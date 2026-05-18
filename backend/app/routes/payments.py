from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from app.services.payment_service import (
    get_all_payments,
    get_payment_by_id,
    create_payment,
    update_payment_status,
    delete_payment
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentResponse])
async def list_payments(
    status: Optional[str] = None,
    period: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    return await get_all_payments(status, period)

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str, current_user=Depends(get_current_user)):
    payment = await get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    return payment

@router.post("", response_model=PaymentResponse)
async def add_payment(data: PaymentCreate, current_user=Depends(get_current_user)):
    payment = await create_payment(
        data.lease_id,
        data.period,
        data.amount,
        data.due_date,
        data.status
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Bail introuvable")
    return payment

@router.put("/{payment_id}", response_model=PaymentResponse)
async def edit_payment(
    payment_id: str,
    data: PaymentUpdate,
    current_user=Depends(get_current_user)
):
    payment = await update_payment_status(
        payment_id,
        data.status,
        data.paid_at
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    return payment

@router.delete("/{payment_id}")
async def remove_payment(payment_id: str, current_user=Depends(get_current_user)):
    deleted = await delete_payment(payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Paiement introuvable")
    return {"message": "Paiement supprimé"}