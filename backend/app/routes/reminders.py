from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.reminder import ReminderCreate, ReminderResponse
from app.services.reminder_service import create_reminder, get_all_reminders
from app.routes.auth import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.get("", response_model=List[ReminderResponse])
async def list_reminders(current_user=Depends(get_current_user)):
    return await get_all_reminders()

@router.post("", response_model=ReminderResponse)
async def add_reminder(data: ReminderCreate, current_user=Depends(get_current_user)):
    reminder, error = await create_reminder(
        data.tenant_id,
        data.payment_id,
        data.channel
    )
    if error:
        raise HTTPException(status_code=404, detail=error)
    return reminder