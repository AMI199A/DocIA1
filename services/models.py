from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text
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
    documents = relationship("DocumentRAG", back_populates="owner")
    templates_rel = relationship("Template", back_populates="owner")
    drafts = relationship("Draft", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="owner")
    project_versions = relationship("ProjectVersion", back_populates="owner")


class Report(Base):
    """
    Reporte generado por la IA a partir de un documento cargado.
    Incluye configuración completa del entregable: estilo, tono, norma de citación, etc.
    """
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)

    # Contenido base (existentes)
    texto_original = Column(Text)
    formato = Column(String)          # pdf / docx / pptx / xlsx / html
    contenido_ia = Column(Text)
    ruta_archivo = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # --- Campos nuevos (Migración v2) ---
    title = Column(String, default="Reporte sin título")           # Nombre visible en historial
    style = Column(String, default="ejecutivo")                    # ejecutivo / academico / tecnico
    citation_norm = Column(String, nullable=True)                  # APA / IEEE / Chicago / Harvard
    depth = Column(String, default="medio")                        # breve / medio / exhaustivo
    tone = Column(String, default="formal")                        # formal / divulgativo / tecnico
    page_range = Column(String, nullable=True)                     # ej: "1-50" o "todo"
    output_type = Column(String, nullable=True)                    # informe / resumen / presentacion / tabular
    include_cover = Column(Boolean, default=False)                 # Incluir portada
    include_toc = Column(Boolean, default=False)                   # Incluir tabla de contenidos
    include_references = Column(Boolean, default=False)            # Incluir sección de referencias
    document_rag_id = Column(String, ForeignKey("documents_rag.id"), nullable=True)  # Doc fuente

    owner = relationship("User", back_populates="reports")
    source_document = relationship("DocumentRAG", foreign_keys=[document_rag_id])
    versions = relationship("ProjectVersion", back_populates="original_report")
    charts = relationship("GeneratedChart", back_populates="report")


class DocumentRAG(Base):
    """
    Documento cargado por el usuario para contexto RAG.
    Almacena el texto extraído y metadatos del archivo original.
    """
    __tablename__ = "documents_rag"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)   # Texto extraído completo
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # --- Campos nuevos (Migración v2) ---
    file_type = Column(String, nullable=True)           # pdf / docx / pptx / xlsx / txt
    file_size = Column(Integer, nullable=True)           # Tamaño en bytes
    page_count = Column(Integer, nullable=True)          # Número de páginas
    detected_language = Column(String, nullable=True)    # es / en / fr / etc.
    processing_status = Column(String, default="done")   # pending / processing / done / error

    owner = relationship("User", back_populates="documents")


class Template(Base):
    """
    Plantillas de branding personalizables por usuario/empresa.
    """
    __tablename__ = "templates"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    content = Column(Text)
    color = Column(String, default="bg-blue-500")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # --- Campos nuevos (Migración v2) ---
    logo_path = Column(String, nullable=True)           # Ruta al logo corporativo
    primary_color = Column(String, nullable=True)       # Color primario hex, ej: "#1A73E8"
    secondary_color = Column(String, nullable=True)     # Color secundario hex
    font = Column(String, nullable=True)                # Tipografía, ej: "Inter"
    is_default = Column(Boolean, default=False)         # Plantilla predeterminada del usuario

    owner = relationship("User", back_populates="templates_rel")


class Draft(Base):
    """
    Borrador del editor WYSIWYG. Permite guardar trabajo en progreso
    antes de exportar el documento final.
    """
    __tablename__ = "drafts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String, nullable=False, default="Borrador sin título")
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="drafts")


# ─────────────────────────────────────────────────────────────────
# TABLAS NUEVAS — Migración v2
# ─────────────────────────────────────────────────────────────────

class ChatMessage(Base):
    """
    Mensajes del chat Q&A contextual sobre el documento cargado.
    Permite hacer preguntas específicas mientras se genera el reporte.
    """
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    document_id = Column(String, ForeignKey("documents_rag.id"), nullable=True, index=True)
    role = Column(String, nullable=False)       # "user" o "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="chat_messages")
    document = relationship("DocumentRAG")


class ProjectVersion(Base):
    """
    Historial de versiones de un reporte. Permite re-procesar el mismo
    documento con distintas configuraciones sin perder versiones anteriores.
    """
    __tablename__ = "project_versions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=True, index=True)
    version_number = Column(Integer, default=1)
    title = Column(String, nullable=False, default="Versión 1")
    contenido_ia = Column(Text)                  # Snapshot del contenido en esta versión
    ruta_archivo = Column(String, nullable=True)
    config_snapshot = Column(Text, nullable=True)  # JSON con la configuración usada
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="project_versions")
    original_report = relationship("Report", back_populates="versions")


class GeneratedChart(Base):
    """
    Gráficos auto-generados a partir de datos numéricos detectados en el documento.
    Exportables a Excel o PowerPoint.
    """
    __tablename__ = "generated_charts"

    id = Column(String, primary_key=True, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    chart_type = Column(String, nullable=False)    # bar / line / pie / dashboard
    title = Column(String, nullable=True)
    data_json = Column(Text, nullable=True)         # JSON con los datos del gráfico
    ruta_archivo = Column(String, nullable=True)    # Imagen o archivo exportado
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    report = relationship("Report", back_populates="charts")
