import uuid
from datetime import datetime, timezone
from app.core.database import get_db

async def enrich_payment(p: dict) -> dict:
    db = get_db()
    if isinstance(p.get('created_at'), str):
        p['created_at'] = datetime.fromisoformat(p['created_at'])
    elif isinstance(p.get('created_at'), datetime) and p['created_at'].tzinfo is None:
        p['created_at'] = p['created_at'].replace(tzinfo=timezone.utc)
    if isinstance(p.get('due_date'), str):
        p['due_date'] = datetime.fromisoformat(p['due_date'])
    elif isinstance(p.get('due_date'), datetime) and p['due_date'].tzinfo is None:
        p['due_date'] = p['due_date'].replace(tzinfo=timezone.utc)
    if p.get('paid_at') and isinstance(p['paid_at'], str):
        p['paid_at'] = datetime.fromisoformat(p['paid_at'])

    lease = await db.leases.find_one({"lease_id": p["lease_id"]}, {"_id": 0})
    if lease:
        p["loyer_mensuel"] = lease.get("loyer_mensuel") or lease.get("rent", 0)
        tenant = await db.tenants.find_one(
            {"tenant_id": lease["tenant_id"]}, {"_id": 0}
        )
        if tenant:
            p["tenant_name"] = tenant["full_name"]
            p["tenant_phone"] = tenant.get("phone")
        unit = await db.units.find_one(
            {"unit_id": lease["unit_id"]}, {"_id": 0}
        )
        if unit:
            p["unit_name"] = unit["name"]
            building = await db.buildings.find_one(
                {"building_id": unit["building_id"]}, {"_id": 0}
            )
            if building:
                p["building_name"] = building["name"]
    return p

async def get_all_payments(status: str = None, period: str = None):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    if period:
        query["period"] = period
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    return [await enrich_payment(p) for p in payments]

async def get_payment_by_id(payment_id: str):
    db = get_db()
    p = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not p:
        return None
    return await enrich_payment(p)

async def create_payment(
    lease_id: str,
    period: str,
    amount: int,
    due_date: datetime,
    status: str = "UNPAID"
):
    db = get_db()
    lease = await db.leases.find_one({"lease_id": lease_id})
    if not lease:
        return None
    payment_id = f"pay_{uuid.uuid4().hex[:8]}"
    doc = {
        "payment_id": payment_id,
        "lease_id": lease_id,
        "period": period,
        "amount": amount,
        "status": status,
        "due_date": due_date.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(doc)
    return await get_payment_by_id(payment_id)

async def update_payment_status(payment_id: str, status: str, paid_at: datetime = None):
    db = get_db()
    update_data = {"status": status}
    if paid_at:
        update_data["paid_at"] = paid_at.isoformat()
    elif status == "PAID":
        update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.payments.update_one(
        {"payment_id": payment_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        return None
    return await get_payment_by_id(payment_id)

async def delete_payment(payment_id: str):
    db = get_db()
    result = await db.payments.delete_one({"payment_id": payment_id})
    return result.deleted_count > 0