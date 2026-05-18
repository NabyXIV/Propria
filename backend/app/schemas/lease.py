from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LeaseCreate(BaseModel):
    tenant_id: str
    unit_id: str
    start_date: datetime
    loyer_mensuel: int  # en FCFA
    due_day: int = 5   # jour du mois où le loyer est dû

class LeaseResponse(BaseModel):
    lease_id: str
    tenant_id: str
    unit_id: str
    start_date: datetime
    loyer_mensuel: int  # en FCFA
    due_day: int
    active: bool
    tenant_name: Optional[str] = None
    unit_name: Optional[str] = None
    building_name: Optional[str] = None
    contract_file_path: Optional[str] = None
    created_at: datetime