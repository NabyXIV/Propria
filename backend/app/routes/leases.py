from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from pathlib import Path
from app.schemas.lease import LeaseCreate, LeaseResponse
from app.services.lease_service import (
    get_all_leases,
    get_lease_by_id,
    create_lease,
    terminate_lease,
    delete_lease
)
from app.services.storage_service import upload_file
from app.core.database import get_db
from app.routes.auth import get_current_user

router = APIRouter(prefix="/leases", tags=["Leases"])

@router.get("", response_model=List[LeaseResponse])
async def list_leases(
    tenant_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    return await get_all_leases(tenant_id, unit_id)

@router.get("/{lease_id}", response_model=LeaseResponse)
async def get_lease(lease_id: str, current_user=Depends(get_current_user)):
    lease = await get_lease_by_id(lease_id)
    if not lease:
        raise HTTPException(status_code=404, detail="Bail introuvable")
    return lease

@router.post("", response_model=LeaseResponse)
async def add_lease(data: LeaseCreate, current_user=Depends(get_current_user)):
    lease, error = await create_lease(
        data.tenant_id,
        data.unit_id,
        data.start_date,
        data.loyer_mensuel,
        data.due_day
    )
    if error:
        raise HTTPException(status_code=404, detail=error)
    return lease

@router.patch("/{lease_id}/terminate")
async def end_lease(lease_id: str, current_user=Depends(get_current_user)):
    success = await terminate_lease(lease_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bail introuvable")
    return {"message": "Bail terminé"}

@router.delete("/{lease_id}")
async def remove_lease(lease_id: str, current_user=Depends(get_current_user)):
    deleted = await delete_lease(lease_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Bail introuvable")
    return {"message": "Bail supprimé"}

@router.post("/{lease_id}/contract")
async def upload_contract(
    lease_id: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    db = get_db()
    lease = await db.leases.find_one({"lease_id": lease_id})
    if not lease:
        raise HTTPException(status_code=404, detail="Bail introuvable")

    # Vérifie l'extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Extension non autorisée")

    # Lit le fichier
    file_data = await file.read()

    # Upload vers Supabase Storage bucket "contrats"
    file_path = f"{lease_id}/contrat{file_ext}"
    file_url = await upload_file("contracts", file_path, file_data, file.content_type)

    # Met à jour le bail avec l'URL du contrat
    await db.leases.update_one(
        {"lease_id": lease_id},
        {"$set": {"contract_file_path": file_url}}
    )

    return {"message": "Contrat uploadé", "file_url": file_url}