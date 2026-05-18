import uuid
from datetime import datetime, timezone
from app.core.database import get_db

async def enrich_lease(l: dict) -> dict:
    db = get_db()
    if isinstance(l.get('created_at'), str):
        l['created_at'] = datetime.fromisoformat(l['created_at'])
    if isinstance(l.get('start_date'), str):
        l['start_date'] = datetime.fromisoformat(l['start_date'])
    tenant = await db.tenants.find_one(
        {"tenant_id": l["tenant_id"]}, {"_id": 0}
    )
    if tenant:
        l["tenant_name"] = tenant["full_name"]
    unit = await db.units.find_one(
        {"unit_id": l["unit_id"]}, {"_id": 0}
    )
    if unit:
        l["unit_name"] = unit["name"]
        building = await db.buildings.find_one(
            {"building_id": unit["building_id"]}, {"_id": 0}
        )
        if building:
            l["building_name"] = building["name"]
    return l

async def get_all_leases(tenant_id: str = None, unit_id: str = None):
    db = get_db()
    query = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if unit_id:
        query["unit_id"] = unit_id
    leases = await db.leases.find(query, {"_id": 0}).to_list(1000)
    return [await enrich_lease(l) for l in leases]

async def get_lease_by_id(lease_id: str):
    db = get_db()
    l = await db.leases.find_one({"lease_id": lease_id}, {"_id": 0})
    if not l:
        return None
    return await enrich_lease(l)

async def create_lease(
    tenant_id: str,
    unit_id: str,
    start_date: datetime,
    loyer_mensuel: int,
    due_day: int = 5
):
    db = get_db()
    # Vérifie que le locataire existe
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if not tenant:
        return None, "Locataire introuvable"
    # Vérifie que l'appartement existe
    unit = await db.units.find_one({"unit_id": unit_id})
    if not unit:
        return None, "Appartement introuvable"
    # Désactive les baux existants pour cet appartement
    await db.leases.update_many(
        {"unit_id": unit_id, "active": True},
        {"$set": {"active": False}}
    )
    lease_id = f"lease_{uuid.uuid4().hex[:8]}"
    doc = {
        "lease_id": lease_id,
        "tenant_id": tenant_id,
        "unit_id": unit_id,
        "start_date": start_date.isoformat(),
        "loyer_mensuel": loyer_mensuel,
        "due_day": due_day,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.leases.insert_one(doc)
    return await get_lease_by_id(lease_id), None

async def terminate_lease(lease_id: str):
    db = get_db()
    result = await db.leases.update_one(
        {"lease_id": lease_id},
        {"$set": {"active": False}}
    )
    return result.matched_count > 0

async def delete_lease(lease_id: str):
    db = get_db()
    result = await db.leases.delete_one({"lease_id": lease_id})
    return result.deleted_count > 0