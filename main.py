import os
import uuid
import threading
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Módulos del proyecto
from services.file_generator import crear_docx, crear_pdf, crear_html
from services.ollama_service import generar_resumen
from services.database import engine, get_db
from services.models import Base, Report, User, DocumentRAG
from services.routers import auth, admin, documents, workspace, templates
from services.auth_utils import get_current_user
from sqlalchemy.orm import Session
from fastapi import Depends

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DocIA API",
    version="1.0.0",
    description="Backend de integración para la plataforma DocIA"
)

def warmup_ollama():
    print("Iniciando warm-up de Ollama...")
    try:
        # Petición ligera para cargar el modelo
        generar_resumen("Responde 'ok'")
        print("Warm-up de Ollama completado exitosamente.")
    except Exception as e:
        print(f"Error en warm-up de Ollama: {e}")

@app.on_event("startup")
def startup_event():
    # Correr el warm-up en un hilo para no bloquear el arranque de FastAPI
    threading.Thread(target=warmup_ollama, daemon=True).start()

# 1. Configuración de CORS para desarrollo e integración Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, reemplaza por la URL de tu cliente Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(documents.router)
app.include_router(workspace.router)
app.include_router(templates.router)

# 2. Configuración de almacenamiento y rutas estáticas
MEDIA_DIR = "archivos_generados"
STATIC_DIR = "dist/public"  # Apunta al directorio de salida de Vite (outDir en vite.config.ts)

os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/archivos_generados", StaticFiles(directory=MEDIA_DIR), name="archivos_generados")

assets_dir = os.path.join(STATIC_DIR, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")



# 3. Modelos de entrada y salida con sintaxis Pydantic v2
class DocumentRequest(BaseModel):
    texto: str = Field(..., min_length=1, description="Texto de entrada a ser procesado por la IA")
    formato: str = Field(default="pdf", description="Formato del documento: 'pdf', 'docx' o 'html'")
    modelo: str = Field(default="phi3", description="Modelo de Ollama a utilizar")
    contexto_ids: list[str] = Field(default_factory=list, description="IDs de documentos RAG para contexto")

class DocumentResponse(BaseModel):
    id: str
    mensaje: str
    contenido_ia: str
    ruta_archivo: str


# 4. Endpoints de la API
@app.get("/health", status_code=status.HTTP_200_OK)
def check_health():
    """Endpoint para monitoreo del estado de la API."""
    return {"status": "ok", "service": "DocIA API"}


@app.get("/")
def read_root():
    """Servir la SPA construida con Vite o mensaje de estado."""
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"mensaje": "Backend DocIA en ejecución"}

from services.ollama_service import get_ollama_tags

@app.get("/api/v1/models/tags")
def read_tags():
    return get_ollama_tags()


@app.post(
    "/api/v1/reportes/generar",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED
)
def generar_reporte(
    req: DocumentRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Validar texto no vacío
    texto_limpio = req.texto.strip()
    if not texto_limpio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El campo 'texto' no puede estar vacío."
        )

    # Buscar contexto si hay IDs
    contexto_texto = ""
    if req.contexto_ids:
        docs = db.query(DocumentRAG).filter(DocumentRAG.id.in_(req.contexto_ids), DocumentRAG.user_id == current_user.id).all()
        for d in docs:
            contexto_texto += f"\n--- Documento: {d.filename} ---\n{d.content}\n"
    
    # Invocar al servicio Ollama con modelo y contexto
    prompt_completo = texto_limpio
    if contexto_texto:
        prompt_completo += f"\n\nContexto adicional provisto:\n{contexto_texto}"

    resumen_ejecutivo = generar_resumen(prompt_completo, req.modelo)
    if "Error conectando" in resumen_ejecutivo:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=resumen_ejecutivo
        )

    # Generar el archivo según el formato solicitado
    formato = req.formato.lower()
    reporte_id = str(uuid.uuid4())[:8]
    nombre_base = f"reporte_{reporte_id}"

    if formato == "pdf":
        ruta_relativa = crear_pdf(resumen_ejecutivo, nombre_base)
    elif formato == "docx":
        ruta_relativa = crear_docx(resumen_ejecutivo, nombre_base)
    elif formato == "html":
        ruta_relativa = crear_html(resumen_ejecutivo, nombre_base)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato '{req.formato}' no válido. Formatos permitidos: 'pdf', 'docx', 'html'."
        )

    db_report = Report(
        id=reporte_id,
        user_id=current_user.id,
        texto_original=texto_limpio,
        formato=formato,
        contenido_ia=resumen_ejecutivo,
        ruta_archivo=ruta_relativa
    )
    db.add(db_report)
    db.commit()

    return DocumentResponse(
        id=reporte_id,
        mensaje="Reporte generado exitosamente",
        contenido_ia=resumen_ejecutivo,
        ruta_archivo=ruta_relativa
    )

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    # Si la petición busca un archivo en la API o archivos estáticos no existentes, dejar que FastAPI maneje el 404
    if full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    
    # Servir el index.html del build para cualquier ruta del cliente (React/Wouter)
    index_path = os.path.join("dist", "public", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(status_code=404, content={"detail": "Build index.html not found"})