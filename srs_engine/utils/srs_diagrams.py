"""
Generate distinct Mermaid diagrams for a proper SRS:
- System Context Diagram (2.1 Product Perspective)
- System Architecture Diagram (3)
- Use Case Diagram (4 Functional Requirements)
- User Workflow Diagram (5)
- Security Flow Diagram (7)
- Entity Relationship Diagram (8 Data Requirements)
"""
from typing import Dict, Any, List


def _users(inputs: dict) -> List[str]:
    u = inputs.get("project_identity", {}).get("target_users") or []
    return u if isinstance(u, list) else [str(u)]


def _features(inputs: dict) -> List[str]:
    f = inputs.get("functional_scope", {}).get("core_features") or []
    return f if isinstance(f, list) else [str(f)]


def _project_name(inputs: dict) -> str:
    return (inputs.get("project_identity") or {}).get("project_name", "System")


def system_context_diagram(inputs: dict) -> str:
    """System Context Diagram: central system and external entities with data flows."""
    title = (_project_name(inputs) or "System").replace('"', "'")[:30]
    users = _users(inputs)[:4] or ["User", "Admin"]
    nodes = [f'SYS["{title}"]']
    for i, u in enumerate(users):
        label = str(u).replace('"', "'")[:20]
        nodes.append(f'E{i}["{label}"]')
    lines = []
    for i, u in enumerate(users):
        uid = f"E{i}"
        lines.append(f'    {uid} -->|interacts| SYS')
        lines.append(f'    SYS -->|response| {uid}')
    return "flowchart LR\n" + "\n".join(nodes) + "\n" + "\n".join(lines)


def system_architecture_diagram(inputs: dict) -> str:
    """Layered architecture: Presentation, Application, Data, External."""
    name = _project_name(inputs).replace(" ", "_")[:20]
    return """flowchart TB
    subgraph Presentation["Presentation Layer"]
        UI[Web UI]
    end
    subgraph Application["Application Layer"]
        API[Backend Services]
    end
    subgraph Data["Data Layer"]
        DB[(Database)]
    end
    subgraph External["External Integration"]
        EXT[APIs / Third-party]
    end
    UI --> API
    API --> DB
    API --> EXT"""


def use_case_diagram(inputs: dict) -> str:
    """Use case style: actors and use cases (flowchart approximation)."""
    users = _users(inputs)[:4] or ["User", "Admin"]
    features = _features(inputs)[:6] or ["Use system"]
    def safe(s):
        return (s or "").replace('"', "'")[:25]
    lines = ["flowchart LR", "    subgraph Actors", "        direction TB"]
    for i, u in enumerate(users):
        lines.append(f'        A{i}["{safe(str(u))}"]')
    lines.extend(["    end", "    subgraph UseCases"])
    for i, f in enumerate(features[:4]):
        lines.append(f'        UC{i}["{safe(str(f))}"]')
    lines.append("    end")
    for i in range(min(len(users), 2)):
        for j in range(min(len(features), 2)):
            lines.append(f"    A{i} --> UC{j}")
    return "\n".join(lines)


def user_workflow_diagram(inputs: dict) -> str:
    """User workflow: login -> validate -> dashboard -> actions -> results."""
    return """flowchart LR
    A([User logs in]) --> B{Valid?}
    B -->|Yes| C[Access dashboard]
    B -->|No| A
    C --> D[Perform actions]
    D --> E[System processes]
    E --> F[View results]
    F --> D"""


def security_flow_diagram(inputs: dict) -> str:
    """Security: authentication and authorization flow."""
    return """flowchart LR
    U([User]) --> A[Submit credentials]
    A --> B{Authenticate}
    B -->|Success| C[Issue token/session]
    B -->|Fail| D[Deny access]
    C --> E{Authorized for action?}
    E -->|Yes| F[Allow access]
    E -->|No| G[Deny / Redirect]
    F --> H[Log security event]"""


def data_erd_diagram(inputs: dict) -> str:
    """Entity-Relationship diagram: core entities and relationships."""
    name = _project_name(inputs).replace(" ", "").replace("-", "")[:12] or "System"
    return f"""erDiagram
    USER ||--o{{ SESSION : has
    USER ||--o{{ ROLE : assigned
    USER {{
        int id PK
        string name
        string email
    }}
    SESSION {{
        int id PK
        int user_id FK
        datetime created
    }}
    ROLE {{
        int id PK
        string name
    }}
    DATA ||--o{{ AUDIT : generates
    DATA {{
        int id PK
        string payload
        datetime updated
    }}
    AUDIT {{
        int id PK
        int data_id FK
        string action
    }}"""


def get_all_srs_diagrams(inputs: dict) -> Dict[str, str]:
    """Return all 6 Mermaid diagram codes keyed by diagram type."""
    return {
        "system_context": system_context_diagram(inputs),
        "system_architecture": system_architecture_diagram(inputs),
        "use_case": use_case_diagram(inputs),
        "user_workflow": user_workflow_diagram(inputs),
        "security_flow": security_flow_diagram(inputs),
        "data_erd": data_erd_diagram(inputs),
    }
