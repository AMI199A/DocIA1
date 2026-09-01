from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from services.database import Base

class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default=UserRole.user.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("Report", back_populates="owner")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    texto_original = Column(String)
    formato = Column(String)
    contenido_ia = Column(String)
    ruta_archivo = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="reports")

class DocumentRAG(Base):
    __tablename__ = "documents_rag"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    filename = Column(String, nullable=False)
    content = Column(String, nullable=False) # Extracted text content
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User")

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    content = Column(String)
    color = Column(String, default="bg-blue-500")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User")

class Draft(Base):
    __tablename__ = "drafts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String, nullable=False, default="Borrador sin título")
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    owner = relationship("User")
