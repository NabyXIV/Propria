from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.routes.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_stats(current_user=Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)
    current_period = now.strftime("%Y-%m")

    # Baux actifs
    active_leases = await db.leases.find(
        {"active": True}, {"_id": 0}
    ).to_list(1000)

    # Montant attendu ce mois = somme des loyers actifs
    expected_amount = sum(
        l.get("loyer_mensuel") or l.get("rent", 0)
        for l in active_leases
    )

    # Paiements du mois
    payments = await db.payments.find(
        {"period": current_period}, {"_id": 0}
    ).to_list(1000)

    paid_amount = sum(p["amount"] for p in payments if p["status"] == "PAID")
    late_amount = sum(p["amount"] for p in payments if p["status"] == "LATE")
    paid_units = len([p for p in payments if p["status"] == "PAID"])
    late_units = len([p for p in payments if p["status"] == "LATE"])

    # Totaux
    total_buildings = await db.buildings.count_documents({})
    total_units = await db.units.count_documents({})
    total_tenants = await db.tenants.count_documents({})

    # Taux d'occupation
    occupied = len(active_leases)
    occupancy_rate = round(occupied / total_units * 100, 1) if total_units > 0 else 0

    return {
        "expected_amount": expected_amount,
        "paid_amount": paid_amount,
        "late_amount": late_amount,
        "paid_units": paid_units,
        "late_units": late_units,
        "total_buildings": total_buildings,
        "total_units": total_units,
        "total_tenants": total_tenants,
        "occupancy_rate": occupancy_rate
    }

@router.get("/recent-payments")
async def get_recent_payments(
    limit: int = 5,
    current_user=Depends(get_current_user)
):
    db = get_db()
    payments = await db.payments.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)

    result = []
    for p in payments:
        lease = await db.leases.find_one(
            {"lease_id": p["lease_id"]}, {"_id": 0}
        )
        if lease:
            tenant = await db.tenants.find_one(
                {"tenant_id": lease["tenant_id"]}, {"_id": 0}
            )
            unit = await db.units.find_one(
                {"unit_id": lease["unit_id"]}, {"_id": 0}
            )
            building = None
            if unit:
                building = await db.buildings.find_one(
                    {"building_id": unit["building_id"]}, {"_id": 0}
                )
            p["tenant_name"] = tenant["full_name"] if tenant else None
            p["tenant_phone"] = tenant.get("phone") if tenant else None
            p["unit_name"] = unit["name"] if unit else None
            p["building_name"] = building["name"] if building else None
            p["amount"] = p.get("amount", 0)

        # Convertir les dates
        if isinstance(p.get("due_date"), str):
            p["due_date"] = p["due_date"]
        if isinstance(p.get("created_at"), str):
            p["created_at"] = p["created_at"]

        result.append(p)
    return result

@router.get("/chart-data")
async def get_chart_data(current_user=Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)

    # 12 derniers mois
    months = []
    for i in range(11, -1, -1):
        date = now - timedelta(days=i * 30)
        months.append(date.strftime("%Y-%m"))

    chart_data = []
    for month in months:
        payments = await db.payments.find(
            {"period": month}, {"_id": 0}
        ).to_list(1000)
        paid = sum(p["amount"] for p in payments if p["status"] == "PAID")
        expected = sum(p["amount"] for p in payments)
        chart_data.append({
            "month": month,
            "paid": paid,
            "expected": expected
        })

    return chart_data