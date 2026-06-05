from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReminderCreate(BaseModel):
    tenant_id: str
    payment_id: str
    channel: str = "sms"  # sms, whatsapp, email

class ReminderResponse(BaseModel):
    reminder_id: str
    tenant_id: str
    payment_id: str
    channel: str
    message: str
    sent_at: datetime