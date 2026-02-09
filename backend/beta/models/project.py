from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ReviewFeedback(BaseModel):
    date: str
    comment: str
    source: str # e.g., "Client", "System"

class WorkflowEvent(BaseModel):
    date: str
    title: str
    description: str
    status: str

class Project(BaseModel):
    id: str
    name: str
    contentMarkdown: str
    clientEmail: Optional[str] = None
    documentUrl: Optional[str] = None
    status: str = "DRAFT" # DRAFT, IN_REVIEW, CHANGES_REQUESTED, APPROVED
    reviewedDocumentUrl: Optional[str] = None
    reviewFeedback: List[ReviewFeedback] = []
    reviewToken: Optional[str] = None
    reviewTokenUsed: bool = False
    workflowEvents: List[WorkflowEvent] = []
    created_at: str = datetime.now().isoformat()
