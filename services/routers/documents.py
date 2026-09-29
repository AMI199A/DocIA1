import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os

from services.database import get_db
from services.models import User, DocumentRAG
from services.auth_utils import get_current_user

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

def detect_language(text: str) -> str:
    """Detección simple de idioma por frecuencia de palabras clave."""
    sample = text[:2000].lower()
    es_words = ["el", "la", "los", "las", "de", "en", "que", "con", "por", "para"]
    en_words = ["the", "and", "for", "with", "this", "from", "that", "are", "was", "have"]
    es_count = sum(sample.split().count(w) for w in es_words)
    en_count = sum(sample.split().count(w) for w in en_words)
    if es_count >= en_count:
        return "es"
    return "en"


def extract_text_from_file(file_path: str, filename: str) -> tuple[str, int]:
    """Extrae texto y retorna (texto, numero_de_paginas)."""
    ext = filename.split('.')[-1].lower()
    text = ""
    page_count = 0
    try:
        if ext == 'pdf':
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(file_path)
                page_count = len(doc)
                for page in doc:
                    text += page.get_text()
            except ImportError:
                import pypdf
                with open(file_path, "rb") as f:
                    reader = pypdf.PdfReader(f)
                    page_count = len(reader.pages)
                    for page in reader.pages:
                        text += page.extract_text() or ""
        elif ext == 'docx':
            import docx
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
            page_count = 1  # docx no expone páginas directamente
        elif ext == 'txt':
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            page_count = max(1, len(text) // 3000)  # Estimado ~3000 chars/página
        elif ext == 'pptx':
            try:
                import importlib
                pptx_mod = importlib.import_module("pptx")
                Presentation = getattr(pptx_mod, "Presentation")
                prs = Presentation(file_path)
                page_count = len(prs.slides)
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, "text") and shape.text:
                            text += shape.text + "\n"
            except (ImportError, Exception):
                page_count = 1
                text = f"[Archivo de presentación {filename} subido correctamente]"
        elif ext == 'xlsx':
            try:
                import importlib
                openpyxl_mod = importlib.import_module("openpyxl")
                wb = openpyxl_mod.load_workbook(file_path, data_only=True)
                page_count = len(wb.sheetnames)
                for sheet in wb.worksheets:
                    text += f"\n--- Hoja: {sheet.title} ---\n"
                    for row in sheet.iter_rows(values_only=True):
                        row_vals = [str(v) for v in row if v is not None]
                        if row_vals:
                            text += " | ".join(row_vals) + "\n"
            except (ImportError, Exception):
                page_count = 1
                text = f"[Archivo de datos tabular {filename} subido correctamente]"
    except Exception as e:
        print(f"Error extracting text from {filename}: {e}")
    return text, page_count

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_extensions = ['pdf', 'txt', 'docx', 'pptx', 'xlsx']
    ext = file.filename.split('.')[-1].lower()
    if ext not in valid_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensión .{ext} no soportada. Formatos permitidos: PDF, TXT, DOCX, PPTX o XLSX."
        )
    
    # Leer contenido del archivo en memoria para obtener el tamaño
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # Save temporarily to extract text
    temp_path = f"temp_{uuid.uuid4().hex}_{file.filename}"
    try:
        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        extracted_text, page_count = extract_text_from_file(temp_path, file.filename)
        if not extracted_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo extraer texto del documento."
            )

        detected_lang = detect_language(extracted_text)

        doc_id = str(uuid.uuid4())[:8]
        new_doc = DocumentRAG(
            id=doc_id,
            user_id=current_user.id,
            filename=file.filename,
            content=extracted_text.strip(),
            file_type=ext,
            file_size=file_size,
            page_count=page_count,
            detected_language=detected_lang,
            processing_status="done"
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        return {
            "id": new_doc.id,
            "filename": new_doc.filename,
            "file_type": new_doc.file_type,
            "file_size": new_doc.file_size,
            "page_count": new_doc.page_count,
            "detected_language": new_doc.detected_language,
            "message": "Documento subido y procesado exitosamente"
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/")
async def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(DocumentRAG).filter(DocumentRAG.user_id == current_user.id).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "page_count": d.page_count,
            "detected_language": d.detected_language,
            "processing_status": d.processing_status,
            "created_at": d.created_at,
        }
        for d in docs
    ]

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(DocumentRAG).filter(DocumentRAG.id == doc_id, DocumentRAG.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    db.delete(doc)
    db.commit()
    return {"message": "Documento eliminado"}
