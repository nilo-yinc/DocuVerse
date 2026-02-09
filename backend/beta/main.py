from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, Query
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from google.adk.sessions import InMemorySessionService
import uuid
from backend.beta.agents.introduction_agent import create_introduction_agent 
from backend.beta.agents.overall_description_agent import create_overall_description_agent 
from backend.beta.agents.system_features_agent import create_system_features_agent
from backend.beta.agents.external_interfaces_agent import create_external_interfaces_agent
from backend.beta.agents.nfr_agent import create_nfr_agent
from backend.beta.agents.glossary_agent import create_glossary_agent
from backend.beta.agents.assumptions_agent import create_assumptions_agent
from backend.beta.schemas.srs_input_schema import SRSRequest
from backend.beta.utils.globals import (
    create_session ,
    create_runner ,
    create_prompt ,
    generated_response ,
    get_session ,
    clean_and_parse_json,
    clean_interface_diagrams,
    render_mermaid_png)
from google.adk.agents import SequentialAgent , ParallelAgent
from pathlib import Path
import os
import time
from datetime import datetime
from backend.beta.utils.srs_document_generator import generate_srs_document
from backend.beta.utils.model import API_KEY_CONFIGURED, GROQ_API_KEY, GROQ_MODEL
from backend.beta.utils.fallback_srs import build_minimal_sections
from backend.beta.utils.srs_diagrams import get_all_srs_diagrams
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from litellm import completion as litellm_completion
import threading

today = datetime.today().strftime("%m/%d/%Y")

app = FastAPI()

SRS_PROGRESS = {}
SRS_PROGRESS_LOCK = threading.Lock()

app.mount(
    "/static",
    StaticFiles(directory="backend/beta/static"),
    name="static"
)


templates = Jinja2Templates(directory="backend/beta/templates")

session_service_stateful = InMemorySessionService()


async def create_srs_agent():
     
    # Using Parallel execution with Gemini Pro (better rate limits)
    first_agent = SequentialAgent(
          name = "first_agent",
          sub_agents = [
               ParallelAgent(
                    name = "first_parallel_agent",
                    sub_agents = [
                         create_introduction_agent(),
                         create_overall_description_agent(),
                         create_system_features_agent(),
                         create_external_interfaces_agent(),
                         create_nfr_agent()
                    ],
                    description = "This agent handles the generation of the Introduction and Overall Description sections of the SRS document."
               )
          ]
     )

    second_agent = SequentialAgent(
          name = "second_agent",
          sub_agents = [
               ParallelAgent(
                   name = "finalization_agent",
                   sub_agents = [
                       create_glossary_agent(),
                       create_assumptions_agent()
                   ],
                   description = "This agent handles the generation of the Glossary and Assumptions sections of the SRS document."
               )
          ]
     )

    
    return first_agent , second_agent











@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(
        "home.html",
        {"request": request}
    )


@app.get("/download_srs/{filename}")
async def download_srs(filename: str):
    """Serve the generated SRS .docx for download. Filename e.g. ProjectName_SRS.docx."""
    if not filename.endswith(".docx") or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    base = Path("./backend/beta/generated_srs").resolve()
    path = (base / filename).resolve()
    if not path.is_file() or base not in path.parents:
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(path, filename=filename, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


def _ensure_output_dir():
    Path("./backend/beta/generated_srs").mkdir(exist_ok=True, parents=True)


def _set_progress(project_key: str, stage: str, progress: int, message: str, status: str = "processing", **extra):
    payload = {
        "project_key": project_key,
        "stage": stage,
        "progress": max(0, min(int(progress), 100)),
        "status": status,
        "message": message,
        "updated_at": int(time.time()),
    }
    payload.update(extra)
    with SRS_PROGRESS_LOCK:
        SRS_PROGRESS[project_key] = payload


def _get_progress(project_key: str) -> dict:
    with SRS_PROGRESS_LOCK:
        return SRS_PROGRESS.get(project_key, {
            "project_key": project_key,
            "stage": "idle",
            "progress": 0,
            "status": "idle",
            "message": "No generation started for this project.",
            "updated_at": int(time.time()),
        })


def _safe_project_key(project_name: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in (project_name or "Project"))
    safe = safe.strip("_")
    return safe or "Project"


def _build_image_paths(project_key: str) -> dict:
    return {
        "user_interfaces": Path(f"./backend/beta/static/{project_key}_user_interfaces_diagram.png"),
        "hardware_interfaces": Path(f"./backend/beta/static/{project_key}_hardware_interfaces_diagram.png"),
        "software_interfaces": Path(f"./backend/beta/static/{project_key}_software_interfaces_diagram.png"),
        "communication_interfaces": Path(f"./backend/beta/static/{project_key}_communication_interfaces_diagram.png"),
        "system_context": Path(f"./backend/beta/static/{project_key}_system_context.png"),
        "system_architecture": Path(f"./backend/beta/static/{project_key}_system_architecture.png"),
        "use_case": Path(f"./backend/beta/static/{project_key}_use_case.png"),
        "user_workflow": Path(f"./backend/beta/static/{project_key}_user_workflow.png"),
        "security_flow": Path(f"./backend/beta/static/{project_key}_security_flow.png"),
        "data_erd": Path(f"./backend/beta/static/{project_key}_data_erd.png"),
    }


def _output_path(project_key: str, variant: str = "full") -> str:
    if variant == "instant":
        return f"./backend/beta/generated_srs/{project_key}_SRS_instant.docx"
    if variant == "quick":
        return f"./backend/beta/generated_srs/{project_key}_SRS_quick.docx"
    if variant == "enhanced":
        return f"./backend/beta/generated_srs/{project_key}_SRS_enhanced.docx"
    return f"./backend/beta/generated_srs/{project_key}_SRS.docx"


def _to_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    return [str(value).strip()] if str(value).strip() else []


def _select_gemini_models() -> list:
    """
    Return ordered model candidates from fastest to richest.
    Environment override:
    - GEMINI_MODEL: comma-separated list, e.g. "gemini-2.0-flash,gemini-1.5-pro-latest"
    """
    raw = os.getenv("GEMINI_MODEL", "").strip()
    if raw:
        return [m.strip() for m in raw.split(",") if m.strip()]
    return [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro-latest",
    ]


def _try_fast_litellm_json(prompt: str) -> dict:
    """
    Try Groq/LiteLLM first for speed. Returns parsed JSON dict or {}.
    """
    try:
        if not GROQ_API_KEY:
            return {}
        # Prefer configured GROQ model first if it is not gemini/*
        model_candidates = []
        if GROQ_MODEL and not GROQ_MODEL.startswith("gemini/"):
            model_candidates.append(GROQ_MODEL)
        # Fast Groq defaults
        model_candidates.extend([
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "meta-llama/llama-4-maverick-17b-128e-instruct",
            "groq/llama-3.1-8b-instant",
            "groq/llama-3.3-70b-versatile",
        ])
        # Expand Groq model aliases so both raw and provider-qualified names are tried.
        expanded = []
        for m in model_candidates:
            expanded.append(m)
            if not m.startswith("groq/"):
                expanded.append(f"groq/{m}")

        # Deduplicate while keeping order
        seen = set()
        models = [m for m in expanded if not (m in seen or seen.add(m))]

        for model_name in models:
            try:
                print(f"⚡ Trying fast LiteLLM model: {model_name}")
                # Some models/providers do not support strict response_format json_object.
                # We retry without it if needed.
                try:
                    resp = litellm_completion(
                        model=model_name,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0,
                        response_format={"type": "json_object"},
                        timeout=15,
                    )
                except Exception:
                    resp = litellm_completion(
                        model=model_name,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0,
                        timeout=15,
                    )
                text = (resp.choices[0].message.content or "").strip()
                cleaned = clean_and_parse_json(text)
                if cleaned:
                    print(f"✅ LiteLLM JSON accepted from: {model_name}")
                    return cleaned
                print(f"⚠️ LiteLLM returned non-parseable JSON from: {model_name}")
            except Exception as e:
                print(f"⚠️ LiteLLM model failed ({model_name}): {e}")
        return {}
    except Exception as e:
        print(f"⚠️ LiteLLM fast path failed: {e}")
        return {}


def _map_ai_to_sections(inputs: dict, ai: dict) -> dict:
    """Convert flexible AI output into strict generator section structure."""
    base = build_minimal_sections(inputs)
    if not isinstance(ai, dict) or not ai:
        return base

    sections = {
        "introduction_section": dict(base["introduction_section"]),
        "overall_description_section": dict(base["overall_description_section"]),
        "system_features_section": dict(base["system_features_section"]),
        "external_interfaces_section": dict(base["external_interfaces_section"]),
        "nfr_section": dict(base["nfr_section"]),
        "glossary_section": dict(base["glossary_section"]),
        "assumptions_section": dict(base["assumptions_section"]),
    }

    intro_ai = ai.get("introduction", {}) if isinstance(ai.get("introduction"), dict) else {}
    purpose_ai = intro_ai.get("purpose")
    if isinstance(purpose_ai, str) and purpose_ai.strip():
        sections["introduction_section"]["purpose"]["description"] = purpose_ai.strip()
    elif isinstance(purpose_ai, dict):
        desc = purpose_ai.get("description")
        if isinstance(desc, str) and desc.strip():
            sections["introduction_section"]["purpose"]["description"] = desc.strip()

    scope_ai = intro_ai.get("scope") if isinstance(intro_ai.get("scope"), dict) else {}
    if scope_ai:
        desc = scope_ai.get("description")
        if isinstance(desc, str) and desc.strip():
            sections["introduction_section"]["project_scope"]["description"] = desc.strip()
        included = _to_list(scope_ai.get("included"))
        excluded = _to_list(scope_ai.get("excluded"))
        if included:
            sections["introduction_section"]["project_scope"]["included"] = included
        if excluded:
            sections["introduction_section"]["project_scope"]["excluded"] = excluded

    definitions = intro_ai.get("definitions")
    if isinstance(definitions, list):
        terms = []
        for item in definitions:
            if isinstance(item, dict):
                term = str(item.get("term", "")).strip()
                definition = str(item.get("definition", "")).strip()
                if term and definition:
                    terms.append({"term": term, "definition": definition})
        if terms:
            sections["glossary_section"] = {"sections": [{"title": "Definitions", "terms": terms}]}

    overall_ai = ai.get("overall_description", {}) if isinstance(ai.get("overall_description"), dict) else {}
    perspective = overall_ai.get("product_perspective")
    if isinstance(perspective, str) and perspective.strip():
        sections["overall_description_section"]["product_perspective"]["description"] = perspective.strip()

    user_chars = overall_ai.get("user_characteristics")
    if isinstance(user_chars, list):
        classes = []
        for item in user_chars:
            if isinstance(item, dict):
                user_class = str(item.get("user_class", "")).strip()
                if user_class:
                    classes.append({"user_class": user_class})
        if classes:
            sections["overall_description_section"]["user_classes_and_characteristics"]["user_classes"] = classes

    assumptions = _to_list(overall_ai.get("assumptions"))
    if assumptions:
        sections["assumptions_section"]["assumptions"] = [{"description": a, "impact": ""} for a in assumptions]

    fr_ai = ai.get("functional_requirements")
    if isinstance(fr_ai, list):
        features = []
        for item in fr_ai:
            if not isinstance(item, dict):
                continue
            feature_name = str(item.get("feature_name", "")).strip()
            if not feature_name:
                continue
            description = str(item.get("description", "")).strip()
            requirements = _to_list(item.get("requirements"))
            if not requirements:
                requirements = [f"Support: {feature_name}"]
            features.append({
                "feature_name": feature_name,
                "description": description,
                "functional_requirements": [{"description": req} for req in requirements],
            })
        if features:
            sections["system_features_section"]["features"] = features

    nfr_ai = ai.get("non_functional_requirements", {}) if isinstance(ai.get("non_functional_requirements"), dict) else {}
    perf = _to_list(nfr_ai.get("performance"))
    security = _to_list(nfr_ai.get("security"))
    reliability = _to_list(nfr_ai.get("reliability"))
    if perf:
        sections["nfr_section"]["performance_requirements"]["requirements"] = [{"description": p} for p in perf]
    if security:
        sections["nfr_section"]["security_requirements"]["requirements"] = [{"description": s} for s in security]
    if reliability:
        sections["nfr_section"]["safety_requirements"]["requirements"] = [{"description": r} for r in reliability]

    return sections


def _render_all_diagrams(inputs: dict, image_paths: dict, interface_sections: dict):
    """Render all major and interface Mermaid diagrams to PNG files."""
    stats = {"core_rendered": 0, "core_failed": 0, "interface_rendered": 0, "interface_failed": 0}
    interface_keys = [
        "user_interfaces",
        "hardware_interfaces",
        "software_interfaces",
        "communication_interfaces",
    ]
    render_jobs = []

    # Core diagrams
    for key, mermaid_code in get_all_srs_diagrams(inputs).items():
        output_png = image_paths.get(key)
        if output_png and isinstance(mermaid_code, str) and mermaid_code.strip():
            render_jobs.append((key, mermaid_code, output_png, "core"))

    # Interface diagrams
    for key in interface_keys:
        section = interface_sections.get(key, {})
        code = ((section.get("interface_diagram") or {}).get("code", "") if isinstance(section, dict) else "")
        output_png = image_paths.get(key)
        if output_png and isinstance(code, str) and code.strip():
            render_jobs.append((key, code, output_png, "interface"))

    # Parallel rendering for faster response time.
    max_workers = max(2, min(6, len(render_jobs)))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_map = {
            executor.submit(render_mermaid_png, code, output_png): (key, kind)
            for key, code, output_png, kind in render_jobs
        }
        for future in as_completed(future_map):
            key, kind = future_map[future]
            try:
                future.result()
                if kind == "core":
                    stats["core_rendered"] += 1
                else:
                    stats["interface_rendered"] += 1
            except Exception as e:
                if kind == "core":
                    stats["core_failed"] += 1
                    print(f"⚠️ Failed to render {key} diagram: {e}")
                else:
                    stats["interface_failed"] += 1
                    print(f"⚠️ Failed to render {key} interface diagram: {e}")
    return stats


def _render_quick_diagrams(inputs: dict, image_paths: dict):
    """Render only 2 core diagrams for quick mode."""
    stats = {"core_rendered": 0, "core_failed": 0, "interface_rendered": 0, "interface_failed": 0}
    all_diagrams = get_all_srs_diagrams(inputs)
    for key in ["system_context", "system_architecture"]:
        code = all_diagrams.get(key)
        output_png = image_paths.get(key)
        if not code or not output_png:
            continue
        try:
            render_mermaid_png(code, output_png)
            stats["core_rendered"] += 1
        except Exception as e:
            stats["core_failed"] += 1
            print(f"⚠️ Failed quick render for {key}: {e}")
    return stats


def _build_sections_with_ai(inputs: dict, project_name: str, project_key: str = "", mode: str = "full") -> dict:
    """Build merged sections using AI when available; fallback to minimal."""
    ai_content = {}
    budget_sec = float(os.getenv("QUICK_AI_BUDGET_SEC", "18")) if mode == "quick" else float(os.getenv("FULL_AI_BUDGET_SEC", "90"))
    started = time.monotonic()

    if API_KEY_CONFIGURED:
        try:
            print(f"🚀 Starting AI Expansion for: {project_name}")
            if project_key:
                _set_progress(project_key, "ai", 25, "Generating detailed requirements with AI...")
            import google.generativeai as genai
            import os
            
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            
            prompt = f"""
            You are an expert Senior Technical Writer. I need you to generate a comprehensive IEEE 830 Software Requirements Specification (SRS) in JSON format.
            
            Project Input Data:
            {json.dumps(inputs, indent=2)}
            
            Task:
            Expand the short user inputs into detailed, professional technical content.
            
            Required JSON Structure:
            {{
                "introduction": {{
                    "purpose": "50-75 word professional summary of the system purpose.",
                    "scope": {{
                        "description": "100 word description of what the system does.",
                        "included": ["List of 5-7 in-scope features/modules"],
                        "excluded": ["List of 3 out-of-scope items"]
                    }},
                    "definitions": [
                         {{"term": "Term1", "definition": "Def1"}}
                    ]
                }},
                "overall_description": {{
                    "product_perspective": "Detailed paragraph about how this product fits into the business/environment.",
                    "user_characteristics": [
                        {{"user_class": "Admin", "characteristics": "Technical user..."}},
                        {{"user_class": "End User", "characteristics": "Non-technical..."}}
                    ],
                    "assumptions": ["List of 3-5 technical assumptions"]
                }},
                "functional_requirements": [
                    {{
                        "feature_name": "Feature Name",
                        "description": "2-3 feature description.",
                        "requirements": ["Req 1", "Req 2", "Req 3"]
                    }}
                ],
                "non_functional_requirements": {{
                    "performance": ["Req 1", "Req 2"],
                    "security": ["Req 1", "Req 2"],
                    "reliability": ["Req 1"]
                }}
            }}
            
            Constraints:
            - Generate at least 5 functional requirements when possible.
            - Return ONLY valid JSON (no markdown, no comments).
            """

            # Fast path first (Groq/LiteLLM), then Gemini fallback
            ai_content = _try_fast_litellm_json(prompt)
            if ai_content:
                if project_key:
                    _set_progress(project_key, "ai", 40, "AI content generated (fast provider).")
                sections = _map_ai_to_sections(inputs, ai_content)
                interface_sections = clean_interface_diagrams(sections.get("external_interfaces_section", {}))
                sections["external_interfaces_section"] = interface_sections
                return sections

            for model_name in _select_gemini_models():
                if (time.monotonic() - started) > budget_sec:
                    print(f"⏱️ AI budget exceeded ({budget_sec}s). Using fallback content.")
                    break
                try:
                    print(f"⚡ Trying model: {model_name}")
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    cleaned_json = clean_and_parse_json(response.text)
                    if cleaned_json:
                        ai_content = cleaned_json
                        print(f"✅ AI Response accepted from: {model_name}")
                        if project_key:
                            _set_progress(project_key, "ai", 40, f"AI content generated ({model_name}).")
                        break
                    print(f"⚠️ Parsed empty JSON from model: {model_name}")
                except Exception as model_err:
                    print(f"⚠️ Model {model_name} failed: {model_err}")
            if not ai_content:
                print("⚠️ All models failed or returned invalid JSON. Falling back.")
                
        except Exception as e:
            print(f"⚠️ AI Expansion failed: {e}")
            import traceback
            traceback.print_exc()

    sections = _map_ai_to_sections(inputs, ai_content)
    if not ai_content:
        print("ℹ️ Using Minimal Fallback")
        if project_key:
            _set_progress(project_key, "ai", 35, "Using fallback baseline content.")
    interface_sections = clean_interface_diagrams(sections.get("external_interfaces_section", {}))
    sections["external_interfaces_section"] = interface_sections
    return sections


def _generate_document(project_name: str, project_key: str, inputs: dict, sections: dict, image_paths: dict, variant: str):
    return generate_srs_document(
        project_name=project_name,
        introduction_section=sections["introduction_section"],
        overall_description_section=sections["overall_description_section"],
        system_features_section=sections["system_features_section"],
        external_interfaces_section=sections["external_interfaces_section"],
        nfr_section=sections["nfr_section"],
        glossary_section=sections["glossary_section"],
        assumptions_section=sections["assumptions_section"],
        image_paths=image_paths,
        output_path=_output_path(project_key, variant),
        authors=inputs["project_identity"]["author"],
        organization=inputs["project_identity"]["organization"]
    )


def _generate_instant_fallback(project_name: str, project_key: str, inputs: dict, image_paths: dict):
    """
    Guaranteed low-latency fallback when quick/full document composition fails.
    Uses minimal sections and only pre-existing core images.
    """
    sections = build_minimal_sections(inputs)
    sections["external_interfaces_section"] = clean_interface_diagrams(sections.get("external_interfaces_section", {}))
    instant_image_paths = {}
    for k in ["system_context", "system_architecture"]:
        p = image_paths.get(k)
        if p and Path(p).is_file():
            instant_image_paths[k] = p
    return _generate_document(project_name, project_key, inputs, sections, instant_image_paths, "instant")


def _generate_enhanced_background(inputs: dict, project_name: str, project_key: str):
    """Background task to create enhanced SRS after quick file is returned."""
    try:
        print(f"🛠️ Background enhanced generation started: {project_name}")
        _set_progress(project_key, "enhanced_ai", 88, "Preparing enhanced version...", status="processing")
        image_paths = _build_image_paths(project_key)
        sections = _build_sections_with_ai(inputs, project_name, project_key)
        _set_progress(project_key, "enhanced_diagrams", 92, "Rendering enhanced diagrams...", status="processing")
        diagram_stats = _render_all_diagrams(inputs, image_paths, sections["external_interfaces_section"])
        if diagram_stats["core_rendered"] == 0:
            _set_progress(project_key, "enhanced_diagrams", 93, "Diagrams unavailable; continuing enhanced build.", status="processing")
        _set_progress(project_key, "enhanced_doc", 96, "Compiling enhanced DOCX...", status="processing")
        _generate_document(project_name, project_key, inputs, sections, image_paths, "enhanced")
        _set_progress(project_key, "completed", 100, "Enhanced document ready.", status="completed")
        print(f"✅ Background enhanced generation completed: {project_name}")
    except Exception as e:
        _set_progress(project_key, "failed", 100, f"Enhanced generation failed: {e}", status="failed")
        print(f"❌ Background enhanced generation failed for {project_name}: {e}")


@app.get("/srs_status/{project_key}")
async def srs_status(project_key: str):
    """Check quick/enhanced document readiness for two-phase generation."""
    instant_path = Path(_output_path(project_key, "instant"))
    quick_path = Path(_output_path(project_key, "quick"))
    enhanced_path = Path(_output_path(project_key, "enhanced"))
    full_path = Path(_output_path(project_key, "full"))
    return {
        "project_key": project_key,
        "instant_ready": instant_path.is_file(),
        "quick_ready": quick_path.is_file(),
        "enhanced_ready": enhanced_path.is_file(),
        "full_ready": full_path.is_file(),
        "instant_download_url": f"/download_srs/{instant_path.name}" if instant_path.is_file() else None,
        "quick_download_url": f"/download_srs/{quick_path.name}" if quick_path.is_file() else None,
        "enhanced_download_url": f"/download_srs/{enhanced_path.name}" if enhanced_path.is_file() else None,
        "full_download_url": f"/download_srs/{full_path.name}" if full_path.is_file() else None,
    }


@app.get("/srs_progress/{project_key}")
async def srs_progress(project_key: str):
    """Stage-wise progress for SRS generation."""
    return _get_progress(project_key)


@app.post("/generate_srs")
async def generate_srs(
    srs_data: SRSRequest,
    background_tasks: BackgroundTasks,
    mode: str = Query(default="full", regex="^(full|quick|instant)$"),
):
    inputs = srs_data.dict()
    project_name = inputs["project_identity"]["project_name"]
    project_key = _safe_project_key(project_name)
    _ensure_output_dir()
    image_paths = _build_image_paths(project_key)
    _set_progress(project_key, "init", 5, "Initializing generation...")

    if mode == "instant":
        # Fastest path: no live Mermaid rendering in request cycle.
        _set_progress(project_key, "content", 20, "Preparing baseline content...")
        sections = build_minimal_sections(inputs)
        sections["external_interfaces_section"] = clean_interface_diagrams(sections.get("external_interfaces_section", {}))
        instant_image_paths = {}
        for k in ["system_context", "system_architecture"]:
            p = image_paths.get(k)
            if p and Path(p).is_file():
                instant_image_paths[k] = p

        try:
            _set_progress(project_key, "doc", 70, "Building DOCX file...")
            generated_path = _generate_document(
                project_name, project_key, inputs, sections, instant_image_paths, "instant"
            )
            _set_progress(
                project_key,
                "completed",
                100,
                "Instant document ready.",
                status="completed",
                download_url=f"/download_srs/{Path(generated_path).name}",
                mode="instant",
            )
            background_tasks.add_task(_generate_enhanced_background, inputs, project_name, project_key)
            return {
                "status": "success",
                "mode": "instant",
                "message": "Instant SRS generated. Enhanced version is being prepared in background.",
                "srs_document_path": generated_path,
                "download_url": f"/download_srs/{Path(generated_path).name}",
                "enhanced_status_url": f"/srs_status/{project_key}",
                "enhanced_download_url": f"/download_srs/{Path(_output_path(project_key, 'enhanced')).name}",
            }
        except Exception as e:
            print(f"❌ Instant Document Generation Failed: {e}")
            import traceback
            traceback.print_exc()
            _set_progress(project_key, "failed", 100, str(e), status="failed")
            raise HTTPException(status_code=500, detail=str(e))

    if mode == "quick":
        # Quick mode: AI-enriched sections + only 2 core diagrams (better quality, faster than full).
        sections = _build_sections_with_ai(inputs, project_name, project_key)
        _set_progress(project_key, "diagrams", 55, "Rendering core diagrams...")
        quick_stats = _render_quick_diagrams(inputs, image_paths)
        if quick_stats["core_rendered"] == 0:
            # Do not fail quick mode; generate document without freshly rendered diagrams.
            _set_progress(
                project_key,
                "diagrams",
                60,
                "Core diagrams unavailable; continuing with document generation.",
                status="processing",
            )
        try:
            _set_progress(project_key, "doc", 80, "Compiling quick DOCX...")
            generated_path = _generate_document(project_name, project_key, inputs, sections, image_paths, "quick")
            _set_progress(
                project_key,
                "completed",
                100,
                "Quick document ready.",
                status="completed",
                download_url=f"/download_srs/{Path(generated_path).name}",
                mode="quick",
            )
            background_tasks.add_task(_generate_enhanced_background, inputs, project_name, project_key)
            return {
                "status": "success",
                "mode": "quick",
                "message": "Quick SRS generated. Enhanced version is being prepared in background.",
                "srs_document_path": generated_path,
                "download_url": f"/download_srs/{Path(generated_path).name}",
                "enhanced_status_url": f"/srs_status/{project_key}",
                "enhanced_download_url": f"/download_srs/{Path(_output_path(project_key, 'enhanced')).name}",
                "warnings": [] if quick_stats["core_rendered"] > 0 else [
                    "Core diagrams could not be freshly rendered in quick mode; document was generated with available assets."
                ],
            }
        except Exception as e:
            print(f"❌ Quick Document Generation Failed: {e}")
            import traceback
            traceback.print_exc()
            try:
                _set_progress(project_key, "doc", 82, "Quick build failed, switching to instant fallback...")
                generated_path = _generate_instant_fallback(project_name, project_key, inputs, image_paths)
                _set_progress(
                    project_key,
                    "completed",
                    100,
                    "Instant fallback document ready.",
                    status="completed",
                    download_url=f"/download_srs/{Path(generated_path).name}",
                    mode="instant",
                )
                background_tasks.add_task(_generate_enhanced_background, inputs, project_name, project_key)
                return {
                    "status": "success",
                    "mode": "instant",
                    "message": "Quick generation failed, instant fallback generated successfully.",
                    "srs_document_path": generated_path,
                    "download_url": f"/download_srs/{Path(generated_path).name}",
                    "enhanced_status_url": f"/srs_status/{project_key}",
                    "enhanced_download_url": f"/download_srs/{Path(_output_path(project_key, 'enhanced')).name}",
                    "warnings": [f"Quick generation failed: {e}. Returned instant fallback."],
                }
            except Exception as fallback_err:
                _set_progress(project_key, "failed", 100, str(fallback_err), status="failed")
                raise HTTPException(status_code=500, detail=f"Quick and instant fallback failed: {fallback_err}")

    sections = _build_sections_with_ai(inputs, project_name, project_key)
    _set_progress(project_key, "diagrams", 60, "Rendering all diagrams...")
    diagram_stats = _render_all_diagrams(inputs, image_paths, sections["external_interfaces_section"])
    if diagram_stats["core_rendered"] == 0:
        _set_progress(
            project_key,
            "diagrams",
            70,
            "Diagrams unavailable; continuing with document generation.",
            status="processing",
        )

    # 3. Document Construction Phase
    try:
        _set_progress(project_key, "doc", 85, "Building full DOCX...")
        generated_path = _generate_document(project_name, project_key, inputs, sections, image_paths, "full")
        _set_progress(
            project_key,
            "completed",
            100,
            "Full document ready.",
            status="completed",
            download_url=f"/download_srs/{Path(generated_path).name}",
            mode="full",
        )
        
        return {
            "status": "success",
            "message": "SRS document generated successfully",
            "mode": "full",
            "srs_document_path": generated_path,
            "download_url": f"/download_srs/{Path(generated_path).name}",
            "warnings": [] if diagram_stats["core_rendered"] > 0 else [
                "Some diagrams could not be rendered; document was generated with available assets."
            ],
        }

    except Exception as e:
        print(f"❌ Document Generation Failed: {e}")
        import traceback
        traceback.print_exc()
        try:
            _set_progress(project_key, "doc", 88, "Full build failed, switching to instant fallback...")
            generated_path = _generate_instant_fallback(project_name, project_key, inputs, image_paths)
            _set_progress(
                project_key,
                "completed",
                100,
                "Instant fallback document ready.",
                status="completed",
                download_url=f"/download_srs/{Path(generated_path).name}",
                mode="instant",
            )
            background_tasks.add_task(_generate_enhanced_background, inputs, project_name, project_key)
            return {
                "status": "success",
                "message": "Full generation failed, instant fallback generated successfully.",
                "mode": "instant",
                "srs_document_path": generated_path,
                "download_url": f"/download_srs/{Path(generated_path).name}",
                "warnings": [f"Full generation failed: {e}. Returned instant fallback."],
            }
        except Exception as fallback_err:
            _set_progress(project_key, "failed", 100, str(fallback_err), status="failed")
            raise HTTPException(status_code=500, detail=f"Full and instant fallback failed: {fallback_err}")













