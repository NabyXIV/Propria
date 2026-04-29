from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class TenantCreate(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class TenantResponse(BaseModel):
    tenant_id: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    unit_name: Optional[str] = None
    building_name: Optional[str] = None
    loyer_mensuel: Optional[int] = None  # en FCFA
    lease_start: Optional[datetime] = None
    created_at: datetime