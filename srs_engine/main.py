from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from google.adk.sessions import InMemorySessionService
import uuid
from srs_engine.agents.introduction_agent import create_introduction_agent 
from srs_engine.agents.overall_description_agent import create_overall_description_agent 
from srs_engine.agents.system_features_agent import create_system_features_agent
from srs_engine.agents.external_interfaces_agent import create_external_interfaces_agent
from srs_engine.agents.nfr_agent import create_nfr_agent
from srs_engine.agents.glossary_agent import create_glossary_agent
from srs_engine.agents.assumptions_agent import create_assumptions_agent
from srs_engine.schemas.srs_input_schema import SRSRequest
from srs_engine.utils.globals import (
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
from srs_engine.utils.srs_document_generator import generate_srs_document
from srs_engine.utils.model import API_KEY_CONFIGURED
from srs_engine.utils.fallback_srs import build_minimal_sections
from srs_engine.utils.srs_diagrams import get_all_srs_diagrams

today = datetime.today().strftime("%m/%d/%Y")

app = FastAPI()

app.mount(
    "/static",
    StaticFiles(directory="srs_engine/static"),
    name="static"
)


templates = Jinja2Templates(directory="srs_engine/templates")

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
    base = Path("./srs_engine/generated_srs").resolve()
    path = (base / filename).resolve()
    if not path.is_file() or base not in path.parents:
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(path, filename=filename, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


def _ensure_output_dir():
    Path("./srs_engine/generated_srs").mkdir(exist_ok=True)


def _generate_doc_from_sections(
    inputs: dict,
    introduction_section: dict,
    overall_description_section: dict,
    system_features_section: dict,
    external_interfaces_section: dict,
    nfr_section: dict,
    glossary_section: dict,
    assumptions_section: dict,
    image_paths: dict = None,
) -> str:
    """Build image_paths (if not provided) and call generate_srs_document. Returns path to .docx."""
    project_name = inputs["project_identity"]["project_name"]
    author_list = inputs["project_identity"]["author"]
    organization_name = inputs["project_identity"]["organization"]
    output_path = f"./srs_engine/generated_srs/{project_name}_SRS.docx"
    if image_paths is None:
        image_paths = {
            "user_interfaces": Path(f"./srs_engine/static/{project_name}_user_interfaces_diagram.png"),
            "hardware_interfaces": Path(f"./srs_engine/static/{project_name}_hardware_interfaces_diagram.png"),
            "software_interfaces": Path(f"./srs_engine/static/{project_name}_software_interfaces_diagram.png"),
            "communication_interfaces": Path(f"./srs_engine/static/{project_name}_communication_interfaces_diagram.png"),
        }
    return generate_srs_document(
        project_name=project_name,
        introduction_section=introduction_section,
        overall_description_section=overall_description_section,
        system_features_section=system_features_section,
        external_interfaces_section=external_interfaces_section,
        nfr_section=nfr_section,
        glossary_section=glossary_section,
        assumptions_section=assumptions_section,
        image_paths=image_paths,
        output_path=output_path,
        authors=author_list,
        organization=organization_name,
    )


@app.post("/generate_srs")
async def generate_srs(srs_data: SRSRequest):
    inputs = srs_data.dict()
    project_name = inputs["project_identity"]["project_name"]
    author_list = inputs["project_identity"]["author"]
    organization_name = inputs["project_identity"]["organization"]
    _ensure_output_dir()

    # Try full AI path when API key is set
    if API_KEY_CONFIGURED:
        try:
            print("Received SRS Data (AI path): ", project_name)
            session_id = str(uuid.uuid4())
            user_id = "test"
            initial_state = {"user_inputs": inputs}
            await create_session(session_service_stateful, project_name, user_id, session_id, initial_state)

            first_agent, second_agent = await create_srs_agent()
            runner = await create_runner(first_agent, project_name, session_service_stateful)
            prompt = await create_prompt()

            await generated_response(runner, user_id, session_id, prompt)
            session = await get_session(session_service_stateful, project_name, user_id, session_id)
            time.sleep(2)

            second_runner = await create_runner(second_agent, project_name, session_service_stateful)
            await generated_response(second_runner, user_id, session_id, prompt)
            session = await get_session(session_service_stateful, project_name, user_id, session_id)

            introduction_section = clean_and_parse_json(session.state.get("introduction_section", {})) or {}
            overall_description_section = clean_and_parse_json(session.state.get("overall_description_section", {})) or {}
            system_features_section = clean_and_parse_json(session.state.get("system_features_section", {})) or {}
            external_interfaces_section = clean_interface_diagrams(
                clean_and_parse_json(session.state.get("external_interfaces_section", {})) or {}
            )
            nfr_section = clean_and_parse_json(session.state.get("nfr_section", {})) or {}
            glossary_section = clean_and_parse_json(session.state.get("glossary_section", {})) or {}
            assumptions_section = clean_and_parse_json(session.state.get("assumptions_section", {})) or {}

            text_only = os.getenv("TEXT_ONLY", "0").strip().lower() in ("1", "true", "yes")
            image_paths = {
                "user_interfaces": Path(f"./srs_engine/static/{project_name}_user_interfaces_diagram.png"),
                "hardware_interfaces": Path(f"./srs_engine/static/{project_name}_hardware_interfaces_diagram.png"),
                "software_interfaces": Path(f"./srs_engine/static/{project_name}_software_interfaces_diagram.png"),
                "communication_interfaces": Path(f"./srs_engine/static/{project_name}_communication_interfaces_diagram.png"),
                "system_context": Path(f"./srs_engine/static/{project_name}_system_context.png"),
                "system_architecture": Path(f"./srs_engine/static/{project_name}_system_architecture.png"),
                "use_case": Path(f"./srs_engine/static/{project_name}_use_case.png"),
                "user_workflow": Path(f"./srs_engine/static/{project_name}_user_workflow.png"),
                "security_flow": Path(f"./srs_engine/static/{project_name}_security_flow.png"),
                "data_erd": Path(f"./srs_engine/static/{project_name}_data_erd.png"),
            }
            if not text_only:
                for key in ("user_interfaces", "hardware_interfaces", "software_interfaces", "communication_interfaces"):
                    try:
                        code = external_interfaces_section[key]["interface_diagram"]["code"]
                        render_mermaid_png(code, image_paths[key])
                    except Exception as diagram_err:
                        print(f"⚠️ Diagram {key}: {diagram_err}")
                for name, code in get_all_srs_diagrams(inputs).items():
                    try:
                        render_mermaid_png(code, image_paths[name])
                    except Exception as diagram_err:
                        print(f"⚠️ SRS diagram {name}: {diagram_err}")

            generated_path = _generate_doc_from_sections(
                inputs,
                introduction_section,
                overall_description_section,
                system_features_section,
                external_interfaces_section,
                nfr_section,
                glossary_section,
                assumptions_section,
                image_paths=image_paths,
            )
            print(f"✅ SRS document generated (AI): {generated_path}")
            return {
                "status": "success",
                "message": "SRS document generated successfully",
                "srs_document_path": generated_path,
                "download_url": f"/download_srs/{Path(generated_path).name}",
            }
        except Exception as e:
            import traceback
            print(f"⚠️ AI path failed, using form-based fallback: {e}")
            print(traceback.format_exc())

    # Fallback: generate from form data only (no AI). Always works.
    minimal = build_minimal_sections(inputs)
    external_interfaces_section = clean_interface_diagrams(minimal["external_interfaces_section"])
    text_only = os.getenv("TEXT_ONLY", "0").strip().lower() in ("1", "true", "yes")
    image_paths = {
        "user_interfaces": Path(f"./srs_engine/static/{project_name}_user_interfaces_diagram.png"),
        "hardware_interfaces": Path(f"./srs_engine/static/{project_name}_hardware_interfaces_diagram.png"),
        "software_interfaces": Path(f"./srs_engine/static/{project_name}_software_interfaces_diagram.png"),
        "communication_interfaces": Path(f"./srs_engine/static/{project_name}_communication_interfaces_diagram.png"),
        "system_context": Path(f"./srs_engine/static/{project_name}_system_context.png"),
        "system_architecture": Path(f"./srs_engine/static/{project_name}_system_architecture.png"),
        "use_case": Path(f"./srs_engine/static/{project_name}_use_case.png"),
        "user_workflow": Path(f"./srs_engine/static/{project_name}_user_workflow.png"),
        "security_flow": Path(f"./srs_engine/static/{project_name}_security_flow.png"),
        "data_erd": Path(f"./srs_engine/static/{project_name}_data_erd.png"),
    }
    if not text_only:
        for key in ("user_interfaces", "hardware_interfaces", "software_interfaces", "communication_interfaces"):
            try:
                code = external_interfaces_section[key]["interface_diagram"]["code"]
                render_mermaid_png(code, image_paths[key])
            except Exception as diagram_err:
                print(f"⚠️ Diagram {key} (fallback): {diagram_err}")
        for name, code in get_all_srs_diagrams(inputs).items():
            try:
                render_mermaid_png(code, image_paths[name])
            except Exception as diagram_err:
                print(f"⚠️ SRS diagram {name} (fallback): {diagram_err}")
    generated_path = _generate_doc_from_sections(
        inputs,
        minimal["introduction_section"],
        minimal["overall_description_section"],
        minimal["system_features_section"],
        external_interfaces_section,
        minimal["nfr_section"],
        minimal["glossary_section"],
        minimal["assumptions_section"],
        image_paths=image_paths,
    )
    print(f"✅ SRS document generated: {generated_path}")
    return {
        "status": "success",
        "message": "SRS document generated successfully",
        "srs_document_path": generated_path,
        "download_url": f"/download_srs/{Path(generated_path).name}",
    }













