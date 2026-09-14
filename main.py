from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from services.ollama_service import generar_resumen
from services.file_generator import crear_pdf, crear_docx
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(title="DocIA API", version="1.0.0")

class DocumentRequest(BaseModel):
    texto: str
    formato: str = "pdf" # Puede ser "pdf" o "docx"

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido a la API de DocIA"}

@app.post("/api/v1/reportes/generar")
def generar_reporte(req: DocumentRequest):
    # 1. Llamar a Ollama para procesar el texto
    resumen_ejecutivo = generar_resumen(req.texto)
    
    if "Error conectando" in resumen_ejecutivo:
        raise HTTPException(status_code=500, detail=resumen_ejecutivo)
    
    # 2. Generar archivo físico
    nombre_base = "reporte_ejecutivo"
    if req.formato.lower() == "pdf":
        ruta_archivo = crear_pdf(resumen_ejecutivo, nombre_base)
    elif req.formato.lower() == "docx":
        ruta_archivo = crear_docx(resumen_ejecutivo, nombre_base)
    else:
        raise HTTPException(status_code=400, detail="Formato no soportado. Usa pdf o docx.")
    
    # 3. Retornar respuesta
    return {
        "mensaje": "Reporte generado exitosamente",
        "contenido_ia": resumen_ejecutivo,
        "ruta_archivo": ruta_archivo
    }
@app.get("/api/v1/health")
def health_check():
    # Esta ruta le avisa al frontend que el backend está encendido
    return {"status": "ok", "message": "API de DocIA conectada y funcionando"}

@app.get("/api/v1/dashboard/stats")
def get_dashboard_stats():
    # Esta ruta envía datos de prueba para los gráficos/estadísticas del frontend
    return {
        "documentosGenerados": 0,
        "usuariosActivos": 1,
        "estadoOllama": "Conectado"
    }

# Configuración de CORS para permitir la comunicación con el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite peticiones desde cualquier origen (Live Server, etc.)
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Permite todos los encabezados
)


