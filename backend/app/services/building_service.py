import uuid
from datetime import datetime, timezone
from app.core.database import get_db

async def count_units_stats(building_id: str) -> dict:
    db = get_db()
    units = await db.units.find(
        {"building_id": building_id}, {"_id": 0}
    ).to_list(100)
    
    total = len(units)
    occupied = 0
    
    for u in units:
        # Vérifie s'il y a un bail actif pour cet appartement
        lease = await db.leases.find_one(
            {"unit_id": u["unit_id"], "active": True}
        )
        if lease:
            occupied += 1
    
    vacant = total - occupied
    return {"unit_count": total, "vacant_count": vacant}

async def get_all_buildings():
    db = get_db()
    buildings = await db.buildings.find({}, {"_id": 0}).to_list(1000)
    result = []
    for b in buildings:
        if isinstance(b.get('created_at'), str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
        elif isinstance(b.get('created_at'), datetime) and b['created_at'].tzinfo is None:
            b['created_at'] = b['created_at'].replace(tzinfo=timezone.utc)
        stats = await count_units_stats(b["building_id"])
        b["unit_count"] = stats["unit_count"]
        b["vacant_count"] = stats["vacant_count"]
        result.append(b)
    return result

async def get_building_by_id(building_id: str):
    db = get_db()
    b = await db.buildings.find_one({"building_id": building_id}, {"_id": 0})
    if not b:
        return None
    if isinstance(b.get('created_at'), str):
        b['created_at'] = datetime.fromisoformat(b['created_at'])
    elif isinstance(b.get('created_at'), datetime) and b['created_at'].tzinfo is None:
        b['created_at'] = b['created_at'].replace(tzinfo=timezone.utc)
    stats = await count_units_stats(building_id)
    b["unit_count"] = stats["unit_count"]
    b["vacant_count"] = stats["vacant_count"]
    return b

async def create_building(name: str, address: str):
    db = get_db()
    building_id = f"bld_{uuid.uuid4().hex[:8]}"
    doc = {
        "building_id": building_id,
        "name": name,
        "address": address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.buildings.insert_one(doc)
    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    doc["unit_count"] = 0
    doc["vacant_count"] = 0
    return doc

async def update_building(building_id: str, name: str, address: str):
    db = get_db()
    result = await db.buildings.update_one(
        {"building_id": building_id},
        {"$set": {"name": name, "address": address}}
    )
    if result.matched_count == 0:
        return None
    return await get_building_by_id(building_id)

async def delete_building(building_id: str):
    db = get_db()
    result = await db.buildings.delete_one({"building_id": building_id})
    if result.deleted_count == 0:
        return False
    await db.units.delete_many({"building_id": building_id})
    return True