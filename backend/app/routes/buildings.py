from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.building import BuildingCreate, BuildingResponse
from app.services.building_service import (
    get_all_buildings,
    get_building_by_id,
    create_building,
    update_building,
    delete_building
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/buildings", tags=["Buildings"])

@router.get("", response_model=List[BuildingResponse])
async def list_buildings(current_user=Depends(get_current_user)):
    return await get_all_buildings()

@router.get("/{building_id}", response_model=BuildingResponse)
async def get_building(building_id: str, current_user=Depends(get_current_user)):
    building = await get_building_by_id(building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Immeuble introuvable")
    return building

@router.post("", response_model=BuildingResponse)
async def add_building(data: BuildingCreate, current_user=Depends(get_current_user)):
    return await create_building(data.name, data.address)

@router.put("/{building_id}", response_model=BuildingResponse)
async def edit_building(building_id: str, data: BuildingCreate, current_user=Depends(get_current_user)):
    building = await update_building(building_id, data.name, data.address)
    if not building:
        raise HTTPException(status_code=404, detail="Immeuble introuvable")
    return building

@router.delete("/{building_id}")
async def remove_building(building_id: str, current_user=Depends(get_current_user)):
    deleted = await delete_building(building_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Immeuble introuvable")
    return {"message": "Immeuble supprimé"}