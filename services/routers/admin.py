from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from services.database import get_db
from services.models import User, UserRole
from services.auth_utils import require_admin
from services.routers.auth import UserResponse

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

class RoleUpdate(BaseModel):
    role: str

class StatusUpdate(BaseModel):
    is_active: bool

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    users = db.query(User).all()
    return users

@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: int, role_update: RoleUpdate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    if role_update.role not in [UserRole.user.value, UserRole.admin.value]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(user_id: int, status_update: StatusUpdate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent admin from deactivating themselves
    if user.id == current_admin.id and not status_update.is_active:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user.is_active = status_update.is_active
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    from services.models import Report
    total_users = db.query(User).count()
    total_reports = db.query(Report).count()
    
    # Simple breakdown
    pdf_count = db.query(Report).filter(Report.formato.ilike("pdf")).count()
    md_count = db.query(Report).filter(Report.formato.ilike("markdown")).count()
    
    return {
        "total_users": total_users,
        "total_reports": total_reports,
        "format_breakdown": {
            "pdf": pdf_count,
            "markdown": md_count,
        }
    }
