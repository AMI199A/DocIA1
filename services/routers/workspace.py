import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from services.database import get_db
from services.models import User, Report, DocumentRAG, Template, Draft
from services.auth_utils import get_current_user
from services.file_generator import crear_pdf

router = APIRouter(prefix="/api/v1/workspace", tags=["workspace"])

class DraftCreate(BaseModel):
    title: str
    content: str

class DraftResponse(BaseModel):
    id: str
    title: str
    content: str
    updated_at: datetime

class ExportRequest(BaseModel):
    title: str
    content: str # HTML content

@router.get("/stats")
async def get_workspace_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total counts
    total_reports = db.query(Report).filter(Report.user_id == current_user.id).count()
    total_rag = db.query(DocumentRAG).filter(DocumentRAG.user_id == current_user.id).count()
    total_templates = db.query(Template).filter(Template.user_id == current_user.id).count()

    # Activity for the last 7 days
    today = datetime.utcnow().date()
    activity = []
    
    # Spanish day names map
    days_map = {0: "Lun", 1: "Mar", 2: "Mié", 3: "Jue", 4: "Vie", 5: "Sáb", 6: "Dom"}
    
    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        next_day = day_date + timedelta(days=1)
        
        day_name = days_map[day_date.weekday()]
        
        reports_count = db.query(Report).filter(
            Report.user_id == current_user.id,
            Report.created_at >= day_date,
            Report.created_at < next_day
        ).count()
        
        rag_count = db.query(DocumentRAG).filter(
            DocumentRAG.user_id == current_user.id,
            DocumentRAG.created_at >= day_date,
            DocumentRAG.created_at < next_day
        ).count()
        
        activity.append({
            "name": day_name,
            "reportes": reports_count,
            "consultas": rag_count
        })

    return {
        "totals": {
            "reportes": total_reports,
            "rag": total_rag,
            "plantillas": total_templates
        },
        "activity": activity
    }

@router.post("/drafts", response_model=DraftResponse)
async def create_draft(
    draft: DraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    draft_id = str(uuid.uuid4())[:8]
    new_draft = Draft(
        id=draft_id,
        user_id=current_user.id,
        title=draft.title,
        content=draft.content
    )
    db.add(new_draft)
    db.commit()
    db.refresh(new_draft)
    return new_draft

@router.put("/drafts/{draft_id}", response_model=DraftResponse)
async def update_draft(
    draft_id: str,
    draft_update: DraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    draft = db.query(Draft).filter(Draft.id == draft_id, Draft.user_id == current_user.id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Borrador no encontrado")
    
    draft.title = draft_update.title
    draft.content = draft_update.content
    db.commit()
    db.refresh(draft)
    return draft

@router.post("/export")
async def export_pdf(
    req: ExportRequest,
    current_user: User = Depends(get_current_user)
):
    # El contenido HTML viene de react-quill
    file_id = str(uuid.uuid4())[:8]
    base_name = f"export_{file_id}"
    
    # Podemos reusar crear_pdf de file_generator.py (que toma markdown/texto y usa pypandoc o similar). 
    # Dado que es un contenido ya parseado, pasarlo directo. 
    # Aquí simularemos la conversión usando el método existente.
    try:
        ruta_relativa = crear_pdf(req.content, base_name)
        return {"url": f"/{ruta_relativa}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exportando PDF: {str(e)}")
