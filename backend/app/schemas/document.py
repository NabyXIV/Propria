from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentResponse(BaseModel):
    document_id: str
    tenant_id: str
    name: str
    doc_type: str
    file_url: str
    created_at: datetime