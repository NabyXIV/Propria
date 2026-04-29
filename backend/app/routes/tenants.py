from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.tenant import TenantCreate, TenantResponse
from app.services.tenant_service import (
    get_all_tenants,
    get_tenant_by_id,
    create_tenant,
    update_tenant,
    delete_tenant
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/tenants", tags=["Tenants"])

@router.get("", response_model=List[TenantResponse])
async def list_tenants(current_user=Depends(get_current_user)):
    return await get_all_tenants()

@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: str, current_user=Depends(get_current_user)):
    tenant = await get_tenant_by_id(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Locataire introuvable")
    return tenant

@router.post("", response_model=TenantResponse)
async def add_tenant(data: TenantCreate, current_user=Depends(get_current_user)):
    return await create_tenant(data.full_name, data.phone, data.email)

@router.put("/{tenant_id}", response_model=TenantResponse)
async def edit_tenant(tenant_id: str, data: TenantCreate, current_user=Depends(get_current_user)):
    tenant = await update_tenant(tenant_id, data.full_name, data.phone, data.email)
    if not tenant:
        raise HTTPException(status_code=404, detail="Locataire introuvable")
    return tenant

@router.delete("/{tenant_id}")
async def remove_tenant(tenant_id: str, current_user=Depends(get_current_user)):
    deleted = await delete_tenant(tenant_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Locataire introuvable")
    return {"message": "Locataire supprimé"}