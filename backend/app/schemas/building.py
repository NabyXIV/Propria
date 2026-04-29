from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BuildingCreate(BaseModel):
    name: str
    address: str

class BuildingResponse(BaseModel):
    building_id: str
    name: str
    address: str
    unit_count: int = 0
    vacant_count: int = 0
    created_at: datetime