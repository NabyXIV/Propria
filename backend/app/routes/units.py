from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.schemas.unit import UnitCreate, UnitUpdate, UnitResponse
from app.services.unit_service import (
    get_all_units,
    get_unit_by_id,
    create_unit,
    update_unit,
    delete_unit
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/units", tags=["Units"])

@router.get("", response_model=List[UnitResponse])
async def list_units(
    building_id: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    return await get_all_units(building_id)

@router.get("/{unit_id}", response_model=UnitResponse)
async def get_unit(unit_id: str, current_user=Depends(get_current_user)):
    unit = await get_unit_by_id(unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Appartement introuvable")
    return unit

@router.post("", response_model=UnitResponse)
async def add_unit(data: UnitCreate, current_user=Depends(get_current_user)):
    unit = await create_unit(data.building_id, data.name, data.floor, data.rooms)
    if not unit:
        raise HTTPException(status_code=404, detail="Immeuble introuvable")
    return unit

@router.put("/{unit_id}", response_model=UnitResponse)
async def edit_unit(unit_id: str, data: UnitUpdate, current_user=Depends(get_current_user)):
    unit = await update_unit(unit_id, data.name, data.floor, data.rooms)
    if not unit:
        raise HTTPException(status_code=404, detail="Appartement introuvable")
    return unit

@router.delete("/{unit_id}")
async def remove_unit(unit_id: str, current_user=Depends(get_current_user)):
    deleted = await delete_unit(unit_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Appartement introuvable")
    return {"message": "Appartement supprimé"}