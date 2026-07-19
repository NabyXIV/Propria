import paydunya
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration PayDunya — clés avec tirets !
paydunya.api_keys = {
    "PAYDUNYA-MASTER-KEY": os.getenv("PAYDUNYA_MASTER_KEY"),
    "PAYDUNYA-PRIVATE-KEY": os.getenv("PAYDUNYA_PRIVATE_KEY"),
    "PAYDUNYA-TOKEN": os.getenv("PAYDUNYA_TOKEN"),
}

# Mode test = debug True, mode live = debug False
paydunya.debug = os.getenv("PAYDUNYA_MODE", "test") == "test"

# Store info — obligatoire
store = paydunya.Store(
    name="Propria",
    tagline="Gestion locative simplifiée",
    phone_number="+221 77 000 00 00",
    postal_address="Dakar, Sénégal",
    website_url="https://propria-delta.vercel.app",
    logo_url=""
)


async def creer_lien_paiement(
    payment_id: str,
    montant: int,
    description: str,
    tenant_name: str,
    tenant_phone: str,
    return_url: str = None
) -> dict:
    try:
        # Création de la facture avec le store
        invoice = paydunya.Invoice(store=store)

        # Item avec namedtuple
        item = paydunya.InvoiceItem(
            name=description,
            quantity=1,
            unit_price=montant,
            total_price=montant,
            description=f"Loyer - {description}"
        )
        invoice.add_item(item)

        invoice.total_amount = montant
        invoice.description = description

        # URLs de retour
        if return_url:
            invoice.return_url = return_url
            invoice.cancel_url = return_url
            invoice.callback_url = return_url

        # Données custom — liste de tuples !
        invoice.add_custom_data([
            ("payment_id", payment_id),
            ("tenant_name", tenant_name),
            ("tenant_phone", tenant_phone),
        ])

        # Création de la facture sur PayDunya
        status, response = invoice.create()

        if status:
            return {
                "success": True,
                "payment_url": response.get("response_text"),
                "token": response.get("token"),
            }
        else:
            return {
                "success": False,
                "error": str(response)
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


async def verifier_paiement(token: str) -> dict:
    try:
        invoice = paydunya.Invoice(store=store)
        status, response = invoice.confirm(token)

        if status:
            return {
                "success": True,
                "status": response.get("status"),
                "token": token
            }
        else:
            return {
                "success": False,
                "error": str(response)
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }