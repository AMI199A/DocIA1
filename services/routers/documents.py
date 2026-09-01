import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os

from services.database import get_db
from services.models import User, DocumentRAG
from services.auth_utils import get_current_user

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

def extract_text_from_file(file_path: str, filename: str) -> str:
    ext = filename.split('.')[-1].lower()
    text = ""
    try:
        if ext == 'pdf':
            try:
                import fitz # PyMuPDF
                doc = fitz.open(file_path)
                for page in doc:
                    text += page.get_text()
            except ImportError:
                import pypdf
                with open(file_path, "rb") as f:
                    reader = pypdf.PdfReader(f)
                    for page in reader.pages:
                        text += page.extract_text()
        elif ext == 'docx':
            import docx
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif ext == 'txt':
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
    except Exception as e:
        print(f"Error extracting text from {filename}: {e}")
    return text

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_extensions = ['pdf', 'txt', 'docx']
    ext = file.filename.split('.')[-1].lower()
    if ext not in valid_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensión .{ext} no soportada. Use PDF, TXT o DOCX."
        )
    
    # Save temporarily to extract text
    temp_path = f"temp_{uuid.uuid4().hex}_{file.filename}"
    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        
        extracted_text = extract_text_from_file(temp_path, file.filename)
        if not extracted_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo extraer texto del documento."
            )
        
        doc_id = str(uuid.uuid4())[:8]
        new_doc = DocumentRAG(
            id=doc_id,
            user_id=current_user.id,
            filename=file.filename,
            content=extracted_text.strip()
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        
        return {
            "id": new_doc.id,
            "filename": new_doc.filename,
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
    return [{"id": d.id, "filename": d.filename, "created_at": d.created_at} for d in docs]

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
