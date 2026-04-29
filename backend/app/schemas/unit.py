from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UnitCreate(BaseModel):
    building_id: str
    name: str
    floor: Optional[int] = None
    rooms: Optional[int] = None

class UnitUpdate(BaseModel):
    name: str
    floor: Optional[int] = None
    rooms: Optional[int] = None

class UnitResponse(BaseModel):
    unit_id: str
    building_id: str
    name: str
    floor: Optional[int] = None
    rooms: Optional[int] = None
    status: str = "vacant"
    loyer_mensuel: Optional[int] = None  # en FCFA
    tenant_name: Optional[str] = None
    created_at: datetime