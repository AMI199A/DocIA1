import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

from services.database import get_db
from services.models import User, Template
from services.auth_utils import get_current_user

router = APIRouter(prefix="/api/v1/templates", tags=["templates"])

class TemplateCreate(BaseModel):
    name: str
    description: str
    content: str
    color: str = "bg-blue-500"

class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    content: str
    color: str
    created_at: datetime

@router.get("/", response_model=List[TemplateResponse])
async def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    templates = db.query(Template).filter(Template.user_id == current_user.id).all()
    return templates

@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_in: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template_id = str(uuid.uuid4())[:8]
    new_template = Template(
        id=template_id,
        user_id=current_user.id,
        name=template_in.name,
        description=template_in.description,
        content=template_in.content,
        color=template_in.color
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template

@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    db.delete(template)
    db.commit()
    return {"message": "Plantilla eliminada"}
