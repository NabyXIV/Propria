from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
from pathlib import Path
from app.schemas.document import DocumentResponse
from app.services.document_service import (
    get_all_documents,
    upload_document,
    delete_document
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    tenant_id: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    return await get_all_documents(tenant_id)

@router.post("/upload", response_model=DocumentResponse)
async def upload_doc(
    tenant_id: str = Form(...),
    name: str = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    # Vérifie l'extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extension non autorisée. Autorisées : {ALLOWED_EXTENSIONS}"
        )

    # Lit le fichier
    file_data = await file.read()

    # Vérifie la taille
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 5 MB)")

    doc, error = await upload_document(
        tenant_id,
        name,
        doc_type,
        file_data,
        file_ext,
        file.content_type
    )

    if error:
        raise HTTPException(status_code=404, detail=error)
    return doc

@router.delete("/{document_id}")
async def remove_document(document_id: str, current_user=Depends(get_current_user)):
    deleted = await delete_document(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return {"message": "Document supprimé"}