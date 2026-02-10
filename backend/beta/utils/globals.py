from google.genai import types
from google.adk.runners import Runner
from google.adk.agents import SequentialAgent , ParallelAgent
import json , shutil , re , subprocess
from pathlib import Path





generate_content_config = types.GenerateContentConfig(
        # 🔒 Enforce machine-readable output
        response_mime_type="application/json",

        # 🎯 Deterministic output (best for schemas)
        temperature=0.0,


        # 🚫 Reduce refusals / partial responses
        safety_settings=[
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.OFF,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.OFF,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=types.HarmBlockThreshold.OFF,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=types.HarmBlockThreshold.OFF,
            ),
        ],
    )



async def create_session(session_service_stateful , app_name: str, user_id: str, session_id: int , intitial_state: dict):
    """Create a session for the user"""
    await session_service_stateful.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
        state=intitial_state
    )


async def create_runner(agent, app_name, session_service_stateful):
    """Create a runner for the agent"""
    return Runner(
        app_name=app_name,
        agent=agent,
        session_service=session_service_stateful
    )


async def create_prompt():
    """Create a prompt for the agent"""
    return types.Content(
        role="user",
        parts=[types.Part(
            text="Based on the provided SRS data, generate the SRS document as per the schema."
        )]
    )


async def generated_response(runner, user_id, session_id, prompt):
    import asyncio
    max_retries = 5
    retry_delay = 15  # Start with 15 seconds

    for attempt in range(max_retries):
        try:
            response = None
            async for event in runner.run_async(
                        user_id=user_id,
                        session_id=session_id,
                        new_message=prompt,
                    ):
                        if event.is_final_response() and event.content and event.content.parts:
                            response = event.content.parts[0].text
                            break
            if response is None:
                raise ValueError(
                    "AI did not return a response. Check that GROQ_API_KEY or GEMINI_API_KEY is set in .env "
                    "and that the model (e.g. gemini/gemini-1.5-pro-latest) is valid."
                )
            return response
        except Exception as e:
            if "rate_limit" in str(e).lower() or "429" in str(e):
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (attempt + 1)
                    print(f"⚠️ Rate limit hit. Waiting {wait_time} seconds before retry {attempt + 1}/{max_retries}...")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"❌ Max retries reached. Error: {e}")
                    raise
            else:
                raise


def clean_and_parse_json(raw_response):
    if isinstance(raw_response, dict):
        return raw_response
    
    if not isinstance(raw_response, str):
        return None

    cleaned = raw_response.strip()
    
    # 1. Remove Markdown Code Blocks
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        try:
            cleaned = re.sub(r"[\x00-\x1F\x7F]", " ", cleaned) 
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON string: {e}")
            return None


async def get_session(session_service_stateful ,app_name , user_id , session_id):
    """Get the session for the user"""
    return await session_service_stateful.get_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id
    )
    



def sanitize_mermaid_output(text: str) -> str | None:
    if not text or not isinstance(text, str):
        return None

    lowered = text.lower()

    refusal_markers = [
        "i can't help",
        "i cannot help",
        "sorry",
        "unable to",
        "as an ai",
        "cannot generate"
    ]
    if any(marker in lowered for marker in refusal_markers):
        return None

    # Remove markdown fences
    text = text.strip()
    text = re.sub(r"^```[a-zA-Z]*", "", text)
    text = re.sub(r"```$", "", text)

    lines = text.splitlines()
    cleaned_lines = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Normalize labeled arrows
        line = re.sub(
            r"(.*?)-->\s*\|\s*(.*?)\s*\|\s*(.*)",
            r"\1-->| \2 | \3",
            line
        )

        # Normalize arrow variants
        line = re.sub(r"-{3,}>", "-->", line)
        line = re.sub(r"<-{3,}", "<--", line)
        line = re.sub(r"==>", "-->", line)

        cleaned_lines.append(line)

    if not cleaned_lines:
        return None

    first = cleaned_lines[0]
    valid_headers = (
        "flowchart", "graph", "erDiagram",
        "sequenceDiagram", "stateDiagram", "classDiagram"
    )

    if not first.startswith(valid_headers):
        cleaned_lines.insert(0, "flowchart LR")

    return "\n".join(cleaned_lines)




def _default_interface_section(title: str) -> dict:
    """Return a minimal valid interface section when AI output is missing."""
    return {
        "title": title,
        "description": "No interface defined.",
        "interface_diagram": {
            "diagram_type": "mermaid",
            "code": "flowchart LR\n    N/A[No Interface Defined]"
        }
    }


def clean_interface_diagrams(external_interfaces: dict) -> dict:
    """
    Iterates through the external_interfaces dictionary, cleans the mermaid code 
    for each interface type, and returns the updated dictionary.
    Always returns a dict with all four interface keys (uses defaults if missing).
    """
    interface_keys = [
        "user_interfaces",
        "hardware_interfaces",
        "software_interfaces",
        "communication_interfaces"
    ]
    default_titles = {
        "user_interfaces": "User Interfaces",
        "hardware_interfaces": "Hardware Interfaces",
        "software_interfaces": "Software Interfaces",
        "communication_interfaces": "Communication Interfaces",
    }

    if not isinstance(external_interfaces, dict):
        external_interfaces = {}

    for key in interface_keys:
        try:
            section = external_interfaces.get(key)
            if not section or not isinstance(section, dict):
                external_interfaces[key] = _default_interface_section(default_titles[key])
                continue
            inner = section.get("interface_diagram") if isinstance(section.get("interface_diagram"), dict) else None
            if not inner or "code" not in inner:
                external_interfaces[key] = _default_interface_section(
                    section.get("title", default_titles[key])
                )
                continue
            raw_code = inner["code"]
            cleaned_code = sanitize_mermaid_output(raw_code)
            if cleaned_code:
                external_interfaces[key]["interface_diagram"]["code"] = cleaned_code
            else:
                external_interfaces[key]["interface_diagram"]["code"] = "flowchart LR\n    N/A[No Interface Defined]"
        except (KeyError, TypeError):
            external_interfaces[key] = _default_interface_section(default_titles[key])

    return external_interfaces


def render_mermaid_png(mermaid_code: str, output_png: Path):
    """
    Renders Mermaid code into a PNG file using mmdc (npm).
    Uses PATH first so it works on any machine; no hardcoded paths.
    """
    mmdc_path = shutil.which("mmdc") or shutil.which("mmdc.cmd")
    if not mmdc_path:
        raise FileNotFoundError(
            "mmdc command not found. Install it with: npm install -g @mermaid-js/mermaid-cli\n"
            "Then ensure npm global bin is in your PATH (e.g. on Windows: %%APPDATA%%\\npm)."
        )
    
    output_png.parent.mkdir(parents=True, exist_ok=True)
    mmd_path = output_png.with_suffix(".mmd")

    with open(mmd_path, "w", encoding="utf-8") as f:
        f.write(mermaid_code)

    css_path = Path("backend/beta/static/custom-diagram.css")
    config_path = Path("backend/beta/static/mermaid-config.json")

    cmd = [
        mmdc_path,
        "-i", str(mmd_path),
        "-o", str(output_png),
        "-w", "3600",
        "-H", "2200",
        "-t", "neutral",
        "-b", "white",
        "-s", "3"
    ]
    if config_path.exists():
        cmd.extend(["-c", str(config_path)])
    if css_path.exists():
        cmd.extend(["-C", str(css_path)])


    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ Mermaid diagram saved: {output_png}")
    except subprocess.CalledProcessError as e:
        print(f"❌ mmdc error: {e.stderr}")
        print(f"Command that failed: {' '.join(cmd)}")
        raise
