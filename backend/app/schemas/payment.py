from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentCreate(BaseModel):
    lease_id: str
    period: str      # format YYYY-MM ex: "2026-05"
    amount: int      # en FCFA
    due_date: datetime
    status: str = "UNPAID"  # UNPAID, PAID, LATE, VERIFY

class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    paid_at: Optional[datetime] = None

class PaymentResponse(BaseModel):
    payment_id: str
    lease_id: str
    period: str
    amount: int      # en FCFA
    status: str
    due_date: datetime
    paid_at: Optional[datetime] = None
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    unit_name: Optional[str] = None
    building_name: Optional[str] = None
    loyer_mensuel: Optional[int] = None  # en FCFA
    created_at: datetime