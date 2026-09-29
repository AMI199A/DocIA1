import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.database import get_db
from services.models import User, Report, DocumentRAG, Template, Draft
from services.auth_utils import get_current_user
from services.file_generator import crear_pdf

router = APIRouter(prefix="/api/v1/workspace", tags=["workspace"])

class DraftCreate(BaseModel):
    title: str
    content: Optional[str] = ""

class DraftResponse(BaseModel):
    id: str
    title: str
    content: Optional[str] = ""
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExportRequest(BaseModel):
    title: Optional[str] = "Reporte Exportado"
    content: str

@router.get("/stats")
async def get_workspace_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_reports = db.query(Report).filter(
        (Report.user_id == current_user.id) | (Report.user_id == None)
    ).count()
    total_rag = db.query(DocumentRAG).filter(
        (DocumentRAG.user_id == current_user.id) | (DocumentRAG.user_id == None)
    ).count()
    total_templates = db.query(Template).filter(
        (Template.user_id == current_user.id) | (Template.user_id == None)
    ).count()

    today = datetime.utcnow().date()
    activity = []
    days_map = {0: "Lun", 1: "Mar", 2: "Mié", 3: "Jue", 4: "Vie", 5: "Sáb", 6: "Dom"}
    
    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        next_day = day_date + timedelta(days=1)
        day_name = days_map[day_date.weekday()]
        
        reports_count = db.query(Report).filter(
            (Report.user_id == current_user.id) | (Report.user_id == None),
            Report.created_at >= day_date,
            Report.created_at < next_day
        ).count()
        
        rag_count = db.query(DocumentRAG).filter(
            (DocumentRAG.user_id == current_user.id) | (DocumentRAG.user_id == None),
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
        content=draft.content or ""
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
    draft.content = draft_update.content or ""
    db.commit()
    db.refresh(draft)
    return draft

@router.post("/export")
async def export_pdf(
    req: ExportRequest,
    current_user: User = Depends(get_current_user)
):
    file_id = str(uuid.uuid4())[:8]
    base_name = f"export_{file_id}"
    try:
        ruta = crear_pdf(req.content, base_name)
        filename = os.path.basename(ruta)
        return {
            "status": "success",
            "filename": filename,
            "url": f"/api/v1/reportes/descargar/{filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exportando PDF: {str(e)}")
