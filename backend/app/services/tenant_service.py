import uuid
from datetime import datetime, timezone
from app.core.database import get_db

async def enrich_tenant(t: dict) -> dict:
    db = get_db()
    if isinstance(t.get('created_at'), str):
        t['created_at'] = datetime.fromisoformat(t['created_at'])
    lease = await db.leases.find_one(
        {"tenant_id": t["tenant_id"], "active": True}, {"_id": 0}
    )
    if lease:
        t["loyer_mensuel"] = lease.get("loyer_mensuel")
        if isinstance(lease.get('start_date'), str):
            t["lease_start"] = datetime.fromisoformat(lease['start_date'])
        unit = await db.units.find_one(
            {"unit_id": lease["unit_id"]}, {"_id": 0}
        )
        if unit:
            t["unit_name"] = unit["name"]
            building = await db.buildings.find_one(
                {"building_id": unit["building_id"]}, {"_id": 0}
            )
            if building:
                t["building_name"] = building["name"]
    return t

async def get_all_tenants():
    db = get_db()
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(1000)
    return [await enrich_tenant(t) for t in tenants]

async def get_tenant_by_id(tenant_id: str):
    db = get_db()
    t = await db.tenants.find_one({"tenant_id": tenant_id}, {"_id": 0})
    if not t:
        return None
    return await enrich_tenant(t)

async def create_tenant(full_name: str, phone: str = None, email: str = None):
    db = get_db()
    tenant_id = f"ten_{uuid.uuid4().hex[:8]}"
    doc = {
        "tenant_id": tenant_id,
        "full_name": full_name,
        "phone": phone,
        "email": email,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenants.insert_one(doc)
    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc

async def update_tenant(tenant_id: str, full_name: str, phone: str = None, email: str = None):
    db = get_db()
    result = await db.tenants.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"full_name": full_name, "phone": phone, "email": email}}
    )
    if result.matched_count == 0:
        return None
    return await get_tenant_by_id(tenant_id)

async def delete_tenant(tenant_id: str):
    db = get_db()
    result = await db.tenants.delete_one({"tenant_id": tenant_id})
    return result.deleted_count > 0