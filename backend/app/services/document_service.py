import uuid
from datetime import datetime, timezone
from app.core.database import get_db
from app.services.storage_service import upload_file, delete_file

async def get_all_documents(tenant_id: str = None):
    db = get_db()
    query = {"tenant_id": tenant_id} if tenant_id else {}
    documents = await db.documents.find(query, {"_id": 0}).to_list(1000)
    result = []
    for d in documents:
        if isinstance(d.get('created_at'), str):
            d['created_at'] = datetime.fromisoformat(d['created_at'])
        elif isinstance(d.get('created_at'), datetime) and d['created_at'].tzinfo is None:
            d['created_at'] = d['created_at'].replace(tzinfo=timezone.utc)
        result.append(d)
    return result

async def upload_document(
    tenant_id: str,
    name: str,
    doc_type: str,
    file_data: bytes,
    file_extension: str,
    content_type: str
):
    db = get_db()
    
    # Vérifie que le locataire existe
    tenant = await db.tenants.find_one({"tenant_id": tenant_id})
    if not tenant:
        return None, "Locataire introuvable"

    document_id = f"doc_{uuid.uuid4().hex[:8]}"
    file_path = f"{tenant_id}/{document_id}{file_extension}"

    # Upload vers Supabase Storage
    file_url = await upload_file("documents", file_path, file_data, content_type)

    doc = {
        "document_id": document_id,
        "tenant_id": tenant_id,
        "name": name,
        "doc_type": doc_type,
        "file_url": file_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.documents.insert_one(doc)
    doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc, None

async def delete_document(document_id: str):
    db = get_db()
    doc = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not doc:
        return False
    
    # Supprime de Supabase Storage
    tenant_id = doc["tenant_id"]
    file_path = f"{tenant_id}/{document_id}"
    try:
        await delete_file("documents", file_path)
    except:
        pass

    await db.documents.delete_one({"document_id": document_id})
    return True