import os
import json
import httpx
import traceback
from typing import Any
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODELO = os.getenv("OLLAMA_MODEL", "phi3")

STRICT_ANTI_LOOP_RULE = (
    "\n\nREGLA ESTRICTA DE GENERACIÓN:\n"
    "- Responde EXCLUSIVAMENTE con la estructura del reporte solicitado.\n"
    "- Queda estrictamente PROHIBIDO repetir títulos, caer en bucles de texto o inventar variaciones de nombres (ej. 'María Gavilotas').\n"
    "- Mantén estricta fidelidad, coherencia y profesionalismo con los datos del documento proporcionado.\n"
    "- Formatea la respuesta con Markdown claro y estructurado (encabezados ##, listas y negritas).\n\n"
)

PROMPT_TEMPLATES = {
    "reporte_maestro": (
        "Actúa como un consultor y analista experto. Analiza minuciosamente el siguiente documento y "
        "elabora un REPORTE MAESTRO completo, altamente estructurado y profesional en español.\n"
        "Estructura requerida:\n"
        "1. RESUMEN EJECUTIVO\n"
        "2. ANÁLISIS DETALLADO Y HALLAZGOS\n"
        "3. PUNTOS CLAVE Y MÉTRICAS\n"
        "4. RIESGOS Y OPORTUNIDADES\n"
        "5. CONCLUSIONES Y RECOMENDACIONES ESTRATÉGICAS\n"
    ) + STRICT_ANTI_LOOP_RULE,
    "resumen_ejecutivo": (
        "Actúa como un redactor ejecutivo de alto nivel. Analiza el siguiente documento y escribe un "
        "RESUMEN EJECUTIVO conciso, profesional y directo al grano en español. Destaca los antecedentes, "
        "puntos esenciales, decisiones clave y conclusiones sin redundancias.\n"
    ) + STRICT_ANTI_LOOP_RULE,
    "presentacion": (
        "Actúa como un diseñador de presentaciones y consultor estratégico. Con base en el siguiente documento, "
        "elabora el contenido estructurado para una PRESENTACIÓN DE DIAPOSITIVAS en español.\n"
        "Organiza el contenido claramente por diapositivas (ej. [Diapositiva 1: Título], [Diapositiva 2: Objetivos], "
        "etc.), con encabezados impactantes y viñetas concisas con la información clave.\n"
    ) + STRICT_ANTI_LOOP_RULE,
    "cuestionario": (
        "Actúa como un especialista en evaluación y preguntas de comprensión. Analiza el siguiente documento "
        "y genera un CUESTIONARIO / BANCO DE PREGUNTAS Y RESPUESTAS (Q&A) en español. "
        "Incluye preguntas clave de análisis y síntesis con sus respuestas precisas y fundamentadas en el texto.\n"
    ) + STRICT_ANTI_LOOP_RULE,
    "puntos_clave": (
        "Actúa como un sintetizador de información estratégica. Analiza el siguiente documento y extrae los "
        "PUNTOS CLAVE, IDEAS FUERZA Y CONCLUSIONES en español, organizados con viñetas claras y breves "
        "explicaciones de alto impacto.\n"
    ) + STRICT_ANTI_LOOP_RULE,
    "modo_libre": (
        "Analiza el siguiente documento y procesa la información de forma profesional en español según "
        "las directrices especificadas.\n"
    ) + STRICT_ANTI_LOOP_RULE
}

REPORT_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "subtitle": {"type": "string"},
        "summary": {"type": "string"},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "paragraphs": {"type": "array", "items": {"type": "string"}},
                    "bullets": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title", "paragraphs", "bullets"],
                "additionalProperties": False,
            },
        },
        "slides": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "bullets": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title", "bullets"],
                "additionalProperties": False,
            },
        },
        "qa": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "answer": {"type": "string"},
                },
                "required": ["question", "answer"],
                "additionalProperties": False,
            },
        },
        "key_points": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["title", "subtitle", "summary", "sections", "slides", "qa", "key_points"],
    "additionalProperties": False,
}

STRUCTURED_PROMPTS = {
    "reporte_maestro": "Elabora un reporte maestro con resumen ejecutivo, análisis, hallazgos, riesgos, oportunidades y recomendaciones.",
    "resumen_ejecutivo": "Elabora un resumen ejecutivo conciso con antecedentes, hallazgos principales y conclusiones.",
    "presentacion": "Prepara una presentación de 5 diapositivas con títulos breves y viñetas concisas.",
    "cuestionario": "Crea preguntas y respuestas de comprensión y análisis fundamentadas únicamente en el documento.",
    "puntos_clave": "Extrae los puntos clave, ideas principales y conclusiones del documento.",
    "modo_libre": "Responde a la solicitud del usuario usando el documento como fuente.",
}


async def generar_contenido_estructurado(
    texto_contexto: str,
    tipo_contenido: str = "reporte_maestro",
    prompt_personalizado: str = "",
) -> dict[str, Any]:
    tipo = tipo_contenido.lower().strip()
    instruccion = STRUCTURED_PROMPTS.get(tipo, STRUCTURED_PROMPTS["reporte_maestro"])
    prompt = (
        "Actúa como analista experto y escribe en español. Usa exclusivamente los datos proporcionados; "
        "no inventes hechos. Devuelve solo el objeto JSON solicitado por el esquema, sin Markdown ni bloques de código.\n"
        f"TAREA: {instruccion}\n"
        "Completa las secciones pertinentes. Para campos que no correspondan, usa cadenas vacías o listas vacías. "
        "En cuestionarios llena qa con pregunta y respuesta; en presentaciones llena slides con título y viñetas.\n"
    )
    if prompt_personalizado.strip():
        prompt += f"INSTRUCCIÓN DEL USUARIO: {prompt_personalizado.strip()}\n"
    prompt += f"DOCUMENTO FUENTE:\n{texto_contexto[:3500]}"

    payload = {
        "model": MODELO,
        "prompt": prompt,
        "format": REPORT_JSON_SCHEMA,
        "stream": False,
        "keep_alive": "30m",
        "options": {
            "temperature": 0.1,
            "top_k": 20,
            "top_p": 0.8,
            "repeat_penalty": 1.15,
            "num_predict": 900,
            "num_ctx": 2048,
            "num_thread": 4,
        },
    }
    timeout_config = httpx.Timeout(timeout=None, connect=60.0)

    try:
        async with httpx.AsyncClient(timeout=timeout_config) as client:
            response = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
            response.raise_for_status()
            respuesta = response.json().get("response", "")
        contenido = json.loads(respuesta)
    except json.JSONDecodeError as exc:
        raise ValueError("Ollama devolvió una respuesta que no es JSON válido.") from exc
    except httpx.ConnectError as exc:
        raise RuntimeError(f"No se pudo conectar con Ollama en {OLLAMA_URL}.") from exc
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(f"Ollama respondió con HTTP {exc.response.status_code}.") from exc

    if not isinstance(contenido, dict) or not isinstance(contenido.get("sections"), list):
        raise ValueError("La respuesta JSON de Ollama no cumple el esquema esperado.")
    for key in ("title", "subtitle", "summary"):
        if not isinstance(contenido.get(key), str):
            raise ValueError(f"El campo JSON '{key}' debe ser texto.")
    for key in ("slides", "qa", "key_points"):
        if not isinstance(contenido.get(key), list):
            raise ValueError(f"El campo JSON '{key}' debe ser una lista.")
    return contenido

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
        "keep_alive": "30m",
        "options": {
            "temperature": 0.1,
            "top_k": 20,
            "top_p": 0.8,
            "repeat_penalty": 1.15,
            "num_predict": 450,
            "num_ctx": 2048,
            "num_thread": 4
        }
    }

    # Configuración sin límite de tiempo para lectura (timeout infinito para inferencias complejas)
    timeout_config = httpx.Timeout(timeout=None, connect=60.0)

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
