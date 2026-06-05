import uuid
from datetime import datetime, timezone
from app.core.database import get_db

async def create_reminder(tenant_id: str, payment_id: str, channel: str = "sms"):
    db = get_db()

    # Vérifie que le paiement existe
    payment = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not payment:
        return None, "Paiement introuvable"

    # Vérifie que le locataire existe
    tenant = await db.tenants.find_one({"tenant_id": tenant_id}, {"_id": 0})
    if not tenant:
        return None, "Locataire introuvable"

    # Génère le message de relance
    message = f"""Bonjour {tenant['full_name']},

Nous vous rappelons que votre loyer de {payment['amount']:,} FCFA pour la période {payment['period']} est en attente de règlement.
Date d'échéance : {payment['due_date'][:10]}

Merci de régulariser votre situation dans les plus brefs délais.

Cordialement,
Propria - Gestion Locative"""

    reminder_id = f"rem_{uuid.uuid4().hex[:8]}"
    doc = {
        "reminder_id": reminder_id,
        "tenant_id": tenant_id,
        "payment_id": payment_id,
        "channel": channel,
        "message": message,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reminders.insert_one(doc)
    doc["sent_at"] = datetime.fromisoformat(doc["sent_at"])
    return doc, None

async def get_all_reminders():
    db = get_db()
    reminders = await db.reminders.find({}, {"_id": 0}).to_list(1000)
    result = []
    for r in reminders:
        if isinstance(r.get('sent_at'), str):
            r['sent_at'] = datetime.fromisoformat(r['sent_at'])
        result.append(r)
    return result