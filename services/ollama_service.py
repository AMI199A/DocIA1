import os
import httpx
import traceback
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODELO = os.getenv("OLLAMA_MODEL", "phi3")

PROMPT_TEMPLATES = {
    "reporte_maestro": (
        "Actúa como un consultor y analista experto. Analiza minuciosamente el siguiente documento y "
        "elabora un REPORTE MAESTRO completo, altamente estructurado y profesional en español.\n"
        "Estructura requerida:\n"
        "1. RESUMEN EJECUTIVO\n"
        "2. ANÁLISIS DETALLADO Y HALLAZGOS\n"
        "3. PUNTOS CLAVE Y MÉTRICAS\n"
        "4. RIESGOS Y OPORTUNIDADES\n"
        "5. CONCLUSIONES Y RECOMENDACIONES ESTRATÉGICAS\n\n"
    ),
    "resumen_ejecutivo": (
        "Actúa como un redactor ejecutivo de alto nivel. Analiza el siguiente documento y escribe un "
        "RESUMEN EJECUTIVO conciso, profesional y directo al grano en español. Destaca los antecedentes, "
        "puntos esenciales, decisiones clave y conclusiones sin redundancias.\n\n"
    ),
    "presentacion": (
        "Actúa como un diseñador de presentaciones y consultor estratégico. Con base en el siguiente documento, "
        "elabora el contenido estructurado para una PRESENTACIÓN DE DIAPOSITIVAS en español.\n"
        "Organiza el contenido claramente por diapositivas (ej. [Diapositiva 1: Título], [Diapositiva 2: Objetivos], "
        "etc.), con encabezados impactantes y viñetas concisas con la información clave.\n\n"
    ),
    "cuestionario": (
        "Actúa como un especialista en evaluación y preguntas de comprensión. Analiza el siguiente documento "
        "y genera un CUESTIONARIO / BANCO DE PREGUNTAS Y RESPUESTAS (Q&A) en español. "
        "Incluye preguntas clave de análisis y síntesis con sus respuestas precisas y fundamentadas en el texto.\n\n"
    ),
    "puntos_clave": (
        "Actúa como un sintetizador de información estratégica. Analiza el siguiente documento y extrae los "
        "PUNTOS CLAVE, IDEAS FUERZA Y CONCLUSIONES en español, organizados con viñetas claras y breves "
        "explicaciones de alto impacto.\n\n"
    ),
    "modo_libre": (
        "Analiza el siguiente documento y procesa la información de forma profesional en español según "
        "las directrices especificadas.\n\n"
    )
}

async def generar_resumen(
    texto_contexto: str,
    tipo_contenido: str = "reporte_maestro",
    prompt_personalizado: str = ""
) -> str:
    url = f"{OLLAMA_URL}/api/generate"
    
    # Seleccionar plantilla de instrucción base
    base_instruction = PROMPT_TEMPLATES.get(tipo_contenido, PROMPT_TEMPLATES["reporte_maestro"])
    
    # Construcción del prompt integrado
    prompt_parts = [base_instruction]
    
    if prompt_personalizado and prompt_personalizado.strip():
        prompt_parts.append(f"INSTRUCCIÓN / REQUERIMIENTO ESPECÍFICO DEL USUARIO:\n{prompt_personalizado.strip()}\n\n")
        
    prompt_parts.append(f"DOCUMENTO A PROCESAR:\n{texto_contexto[:3500]}")
    
    prompt_final = "".join(prompt_parts)
    
    payload = {
        "model": MODELO,
        "prompt": prompt_final,
        "stream": False,
        "options": {
            "num_predict": 800,
            "temperature": 0.5,
            "repeat_penalty": 1.2
        }
    }
    
    # Configuración de timeout extendido para inferencias largas en CPUs/GPUs
    timeout_config = httpx.Timeout(300.0, connect=60.0, read=300.0, write=60.0)
    
    try:
        async with httpx.AsyncClient(timeout=timeout_config) as client:
            response = await client.post(url, json=payload, timeout=timeout_config)
            response.raise_for_status()
            return response.json().get("response", "No se generó respuesta.")
    except httpx.ReadTimeout:
        error_details = traceback.format_exc()
        print(f"TIMEOUT EN OLLAMA SERVICE:\n{error_details}")
        return "Error de tiempo de espera: Ollama tardó más de lo esperado en procesar el documento. Intenta con un texto más breve o verifica los recursos del sistema."
    except httpx.ConnectError:
        error_details = traceback.format_exc()
        print(f"ERROR DE CONEXIÓN OLLAMA:\n{error_details}")
        return f"Error de conexión con Ollama en {OLLAMA_URL}. Asegúrate de que el comando 'ollama serve' esté activo."
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"ERROR EN OLLAMA SERVICE:\n{error_details}")
        return f"Error conectando con Ollama: {str(e)}. Verifica que el servicio esté corriendo."