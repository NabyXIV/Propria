import uuid
from datetime import datetime, timezone
from app.core.database import get_db

async def enrich_unit(u: dict) -> dict:
    db = get_db()
    if isinstance(u.get('created_at'), str):
        u['created_at'] = datetime.fromisoformat(u['created_at'])
    lease = await db.leases.find_one(
        {"unit_id": u["unit_id"], "active": True}, {"_id": 0}
    )
    if lease:
        u["status"] = "occupied"
        u["loyer_mensuel"] = lease.get("loyer_mensuel")
        tenant = await db.tenants.find_one(
            {"tenant_id": lease["tenant_id"]}, {"_id": 0}
        )
        if tenant:
            u["tenant_name"] = tenant["full_name"]
    else:
        u["status"] = "vacant"
    return u

async def get_all_units(building_id: str = None):
    db = get_db()
    query = {"building_id": building_id} if building_id else {}
    units = await db.units.find(query, {"_id": 0}).to_list(1000)
    return [await enrich_unit(u) for u in units]

async def get_unit_by_id(unit_id: str):
    db = get_db()
    u = await db.units.find_one({"unit_id": unit_id}, {"_id": 0})
    if not u:
        return None
    return await enrich_unit(u)

async def create_unit(building_id: str, name: str, floor: int = None, rooms: int = None):
    db = get_db()
    building = await db.buildings.find_one({"building_id": building_id})
    if not building:
        return None
    unit_id = f"unit_{uuid.uuid4().hex[:8]}"
    doc = {
        "unit_id": unit_id,
        "building_id": building_id,
        "name": name,
        "floor": floor,
        "rooms": rooms,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.units.insert_one(doc)
    return await enrich_unit(doc)

async def update_unit(unit_id: str, name: str, floor: int = None, rooms: int = None):
    db = get_db()
    result = await db.units.update_one(
        {"unit_id": unit_id},
        {"$set": {"name": name, "floor": floor, "rooms": rooms}}
    )
    if result.matched_count == 0:
        return None
    return await get_unit_by_id(unit_id)

async def delete_unit(unit_id: str):
    db = get_db()
    result = await db.units.delete_one({"unit_id": unit_id})
    return result.deleted_count > 0