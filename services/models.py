import enum
from datetime import datetime
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Float
from sqlalchemy.orm import relationship
from services.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default=UserRole.user.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("Report", back_populates="owner")
    documents = relationship("DocumentRAG", back_populates="owner")
    templates_rel = relationship("Template", back_populates="owner")
    drafts = relationship("Draft", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="owner")
    project_versions = relationship("ProjectVersion", back_populates="owner")


class Report(Base):
    """
    Reporte generado por la IA o tarea de generación asíncrona.
    Soporta los flujos de la interfaz actual (pruebas) y la metadata avanzada de QA.
    """
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True) # task_id
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Contenido y estado
    status = Column(String, default="completed", index=True) # "processing", "completed", "error"
    texto_original = Column(Text, nullable=True)
    formato = Column(String, default="pdf")                  # pdf, docx, pptx, md, txt, xlsx, html
    tipo_contenido = Column(String, default="reporte_maestro")
    prompt_personalizado = Column(Text, nullable=True)
    contenido_ia = Column(Text, nullable=True)
    ruta_archivo = Column(String, nullable=True)
    preview = Column(String, nullable=True)
    duration = Column(Float, default=0.0)
    error_detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Metadatos ampliados (v2)
    title = Column(String, default="Reporte DocIA")
    style = Column(String, default="ejecutivo")
    citation_norm = Column(String, nullable=True)
    depth = Column(String, default="medio")
    tone = Column(String, default="formal")
    page_range = Column(String, nullable=True)
    output_type = Column(String, nullable=True)
    include_cover = Column(Boolean, default=False)
    include_toc = Column(Boolean, default=False)
    include_references = Column(Boolean, default=False)
    document_rag_id = Column(String, ForeignKey("documents_rag.id"), nullable=True)

    owner = relationship("User", back_populates="reports")
    source_document = relationship("DocumentRAG", foreign_keys=[document_rag_id])
    versions = relationship("ProjectVersion", back_populates="original_report")
    charts = relationship("GeneratedChart", back_populates="report")


class DocumentRAG(Base):
    """
    Documento cargado para contexto RAG.
    Almacena texto extraído y metadatos del archivo físico.
    """
    __tablename__ = "documents_rag"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    file_type = Column(String, nullable=True)           # pdf / docx / pptx / xlsx / txt
    file_size = Column(Integer, nullable=True)          # Bytes
    page_count = Column(Integer, nullable=True)
    detected_language = Column(String, nullable=True)   # es / en
    processing_status = Column(String, default="done")  # pending / processing / done / error

    owner = relationship("User", back_populates="documents")


class Template(Base):
    """Plantillas de estilo y branding."""
    __tablename__ = "templates"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    color = Column(String, default="bg-blue-500")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    logo_path = Column(String, nullable=True)
    primary_color = Column(String, nullable=True)
    secondary_color = Column(String, nullable=True)
    font = Column(String, nullable=True)
    is_default = Column(Boolean, default=False)

    owner = relationship("User", back_populates="templates_rel")


class Draft(Base):
    """Borradores del editor."""
    __tablename__ = "drafts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String, nullable=False, default="Borrador sin título")
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="drafts")


class ChatMessage(Base):
    """Historial de mensajes del chat contextual."""
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    document_id = Column(String, ForeignKey("documents_rag.id"), nullable=True, index=True)
    role = Column(String, nullable=False)       # "user" o "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="chat_messages")
    document = relationship("DocumentRAG")


class ProjectVersion(Base):
    """Historial de versiones de un reporte."""
    __tablename__ = "project_versions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=True, index=True)
    version_number = Column(Integer, default=1)
    title = Column(String, nullable=False, default="Versión 1")
    contenido_ia = Column(Text, nullable=True)
    ruta_archivo = Column(String, nullable=True)
    config_snapshot = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="project_versions")
    original_report = relationship("Report", back_populates="versions")


class GeneratedChart(Base):
    """Gráficos numéricos generados."""
    __tablename__ = "generated_charts"

    id = Column(String, primary_key=True, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    chart_type = Column(String, nullable=False)
    title = Column(String, nullable=True)
    data_json = Column(Text, nullable=True)
    ruta_archivo = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    report = relationship("Report", back_populates="charts")
