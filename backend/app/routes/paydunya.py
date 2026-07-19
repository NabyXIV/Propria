from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.database import get_db
from app.routes.auth import get_current_user
from app.services.paydunya_service import creer_lien_paiement, verifier_paiement
from datetime import datetime, timezone

router = APIRouter(prefix="/payments", tags=["PayDunya"])

@router.post("/{payment_id}/generer-lien")
async def generer_lien_paiement(
    payment_id: str,
    current_user=Depends(get_current_user)
):
    """
    Génère un lien de paiement PayDunya pour un paiement donné
    La gérante appelle cet endpoint puis envoie le lien au locataire
    """
    db = get_db()

    # Récupère le paiement
    payment = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Paiement introuvable")

    # Récupère le bail
    lease = await db.leases.find_one({"lease_id": payment["lease_id"]}, {"_id": 0})
    if not lease:
        raise HTTPException(status_code=404, detail="Bail introuvable")

    # Récupère le locataire
    tenant = await db.tenants.find_one({"tenant_id": lease["tenant_id"]}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Locataire introuvable")

    # Récupère l'appartement
    unit = await db.units.find_one({"unit_id": lease["unit_id"]}, {"_id": 0})
    unit_name = unit["name"] if unit else "Appartement"

    # Description du paiement
    description = f"Loyer {unit_name} - {payment['period']}"

    # Crée le lien PayDunya
    result = await creer_lien_paiement(
        payment_id=payment_id,
        montant=payment["amount"],
        description=description,
        tenant_name=tenant["full_name"],
        tenant_phone=tenant.get("phone", ""),
    )

    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur PayDunya : {result['error']}"
        )

    # Sauvegarde le lien et le token PayDunya dans le paiement
    await db.payments.update_one(
        {"payment_id": payment_id},
        {"$set": {
            "paydunya_token": result["token"],
            "payment_url": result["payment_url"],
            "lien_genere_le": datetime.now(timezone.utc).isoformat()
        }}
    )

    return {
        "payment_url": result["payment_url"],
        "token": result["token"],
        "message": f"Lien de paiement généré pour {tenant['full_name']}"
    }


@router.post("/webhook/paydunya")
async def webhook_paydunya(request: Request):
    """
    Endpoint IPN PayDunya — appelé automatiquement quand le locataire paie
    Met à jour le statut du paiement en DB
    """
    db = get_db()

    try:
        data = await request.json()

        # Récupère le token PayDunya
        paydunya_token = data.get("token") or data.get("data", {}).get("token")

        if not paydunya_token:
            raise HTTPException(status_code=400, detail="Token manquant")

        # Vérifie le paiement auprès de PayDunya
        result = await verifier_paiement(paydunya_token)

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        # Cherche le paiement en DB via le token PayDunya
        payment = await db.payments.find_one(
            {"paydunya_token": paydunya_token}, {"_id": 0}
        )

        if not payment:
            raise HTTPException(status_code=404, detail="Paiement introuvable en DB")

        # Met à jour le statut
        if result["status"] == "completed":
            await db.payments.update_one(
                {"paydunya_token": paydunya_token},
                {"$set": {
                    "status": "PAID",
                    "paid_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            return {"message": "Paiement confirmé", "status": "PAID"}

        return {"message": "Paiement reçu", "status": result["status"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))