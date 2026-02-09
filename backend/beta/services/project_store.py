from typing import Dict, Optional
from backend.beta.models.project import Project

class ProjectStore:
    _projects: Dict[str, Project] = {}

    @classmethod
    def save_project(cls, project: Project):
        cls._projects[project.id] = project
        return project

    @classmethod
    def get_project(cls, project_id: str) -> Optional[Project]:
        return cls._projects.get(project_id)

    @classmethod
    def update_status(cls, project_id: str, status: str):
        if project_id in cls._projects:
            cls._projects[project_id].status = status
            return cls._projects[project_id]
        return None

    @classmethod
    def add_feedback(cls, project_id: str, feedback):
        if project_id in cls._projects:
            cls._projects[project_id].reviewFeedback.append(feedback)
            return cls._projects[project_id]
        return None
