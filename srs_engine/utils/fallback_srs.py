"""
Build minimal SRS section dicts from form payload so we can always generate a .docx
when the AI path fails or API key is missing.
"""
from typing import Dict, Any, List


def _pi(inputs: dict) -> dict:
    return inputs.get("project_identity") or {}


def _sc(inputs: dict) -> dict:
    return inputs.get("system_context") or {}


def _fs(inputs: dict) -> dict:
    return inputs.get("functional_scope") or {}


def _nfr(inputs: dict) -> dict:
    return inputs.get("non_functional_requirements") or {}


def _sec(inputs: dict) -> dict:
    return inputs.get("security_and_compliance") or {}


def _tp(inputs: dict) -> dict:
    return inputs.get("technical_preferences") or {}


def build_minimal_sections(inputs: dict) -> Dict[str, Any]:
    """Build minimal section dicts from form data for generate_srs_document."""
    pi = _pi(inputs)
    sc = _sc(inputs)
    fs = _fs(inputs)
    nfr = _nfr(inputs)
    sec = _sec(inputs)
    tp = _tp(inputs)

    project_name = pi.get("project_name", "Project")
    problem = pi.get("problem_statement", "")
    target_users = pi.get("target_users") or []
    core_features = fs.get("core_features") or []
    primary_flow = fs.get("primary_user_flow") or ""

    introduction_section = {
        "title": "1. Introduction",
        "purpose": {"title": "1.1 Purpose", "description": problem or "See project context."},
        "intended_audience": {
            "title": "1.2 Intended Audience",
            "audience_groups": target_users if isinstance(target_users, list) else [str(target_users)],
        },
        "project_scope": {
            "title": "1.3 Project Scope",
            "description": f"The system provides a centralized platform for {domain or 'core business'} operations with secure access, reporting, and monitoring. Features outside the specified requirements are excluded.",
            "included": core_features if isinstance(core_features, list) else [str(core_features)],
            "excluded": [],
        },
        "document_conventions": {"title": "1.4 Document Conventions", "conventions": ["IEEE 830-1998 style"]},
        "references": {"title": "1.5 References", "references": []},
    }

    app_type = sc.get("application_type", "")
    domain = sc.get("domain", "")
    overall_description_section = {
        "title": "2. Overall Description",
        "product_perspective": {
            "title": "2.1 Product Perspective",
            "description": f"{app_type} in the {domain} domain. {problem or ''}"[:500],
        },
        "product_features": {
            "title": "2.2 Product Features",
            "features": core_features if isinstance(core_features, list) else [str(core_features)],
        },
        "user_classes_and_characteristics": {
            "title": "2.3 User Classes and Characteristics",
            "user_classes": [{"user_class": u, "characteristics": []} for u in (target_users if isinstance(target_users, list) else [str(target_users)])],
        },
        "operating_environment": {"title": "2.4 Operating Environment", "environments": ["Standard web/server environment"]},
        "design_and_implementation_constraints": {"title": "2.5 Design and Implementation Constraints", "constraints": []},
        "user_documentation": {"title": "2.6 User Documentation", "documents": ["User manual to be provided"]},
        "assumptions_and_dependencies": {"title": "2.7 Assumptions and Dependencies", "assumptions": [], "dependencies": []},
    }

    features_list = core_features if isinstance(core_features, list) else [str(core_features)]
    system_features_section = {
        "title": "System Features",
        "features": [
            {
                "feature_name": f if isinstance(f, str) else f"Feature {i+1}",
                "description": primary_flow if i == 0 else "",
                "stimulus_response": [],
                "functional_requirements": [{"description": f"Support: {f if isinstance(f, str) else f'Feature {i+1}'}"}],
            }
            for i, f in enumerate(features_list)
        ],
    }

    def _interface(title: str, desc: str) -> dict:
        return {
            "title": title,
            "description": desc,
            "interface_diagram": {"diagram_type": "mermaid", "code": "flowchart LR\n    A[System] --> B[External]"},
        }

    external_interfaces_section = {
        "title": "4. External Interface Requirements",
        "user_interfaces": _interface("4.1 User Interfaces", "Web or client UI as appropriate."),
        "hardware_interfaces": _interface("4.2 Hardware Interfaces", "Standard hardware."),
        "software_interfaces": _interface("4.3 Software Interfaces", f"Backend: {tp.get('preferred_backend') or 'TBD'}. Database: {tp.get('database_preference') or 'TBD'}."),
        "communication_interfaces": _interface("4.4 Communication Interfaces", "REST/API or as required."),
    }

    perf = nfr.get("performance_expectation", "Normal")
    scale = nfr.get("expected_user_scale", "100-1k")
    nfr_section = {
        "title": "Non-Functional Requirements",
        "performance_requirements": {
            "title": "Performance",
            "requirements": [{"description": f"Performance: {perf}. Scale: {scale}.", "rationale": "User-specified."}],
        },
        "safety_requirements": {"title": "Safety", "requirements": []},
        "security_requirements": {
            "title": "Security",
            "requirements": [
                {"description": "Authentication required." if sec.get("authentication_required") else "Authentication as needed.", "rationale": "Security."},
            ],
        },
        "quality_attributes": {"title": "Quality", "requirements": []},
    }

    glossary_section = {
        "sections": [
            {"title": "Terms", "terms": [{"term": "SRS", "definition": "Software Requirements Specification"}, {"term": project_name, "definition": "This system."}]}
        ]
    }

    assumptions_section = {
        "title": "Assumptions",
        "assumptions": [
            {"description": "Stakeholders have agreed on the problem statement and scope.", "impact": "Scope clarity."},
            {"description": f"Target users: {', '.join(target_users) if isinstance(target_users, list) else target_users}.", "impact": "Audience."},
        ],
    }

    return {
        "introduction_section": introduction_section,
        "overall_description_section": overall_description_section,
        "system_features_section": system_features_section,
        "external_interfaces_section": external_interfaces_section,
        "nfr_section": nfr_section,
        "glossary_section": glossary_section,
        "assumptions_section": assumptions_section,
    }
