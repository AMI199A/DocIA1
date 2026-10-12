import json
import os
import asyncio
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

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
    ) + STRICT_ANTI_LOOP_RULE,
}

REPORT_JSON_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "title": {"type": "STRING"},
        "subtitle": {"type": "STRING"},
        "summary": {"type": "STRING"},
        "sections": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "title": {"type": "STRING"},
                    "paragraphs": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "bullets": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
                "required": ["title", "paragraphs", "bullets"],
            },
        },
        "slides": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "title": {"type": "STRING"},
                    "bullets": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
                "required": ["title", "bullets"],
            },
        },
        "qa": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "question": {"type": "STRING"},
                    "answer": {"type": "STRING"},
                },
                "required": ["question", "answer"],
            },
        },
        "key_points": {"type": "ARRAY", "items": {"type": "STRING"}},
    },
    "required": ["title", "subtitle", "summary", "sections", "slides", "qa", "key_points"],
}

STRUCTURED_PROMPTS = {
    "reporte_maestro": "Elabora un reporte maestro con resumen ejecutivo, análisis, hallazgos, riesgos, oportunidades y recomendaciones.",
    "resumen_ejecutivo": "Elabora un resumen ejecutivo conciso con antecedentes, hallazgos principales y conclusiones.",
    "presentacion": "Prepara 5 diapositivas con títulos breves y un máximo de 4 viñetas concisas por diapositiva.",
    "cuestionario": "Crea 8 preguntas y respuestas breves de comprensión y análisis, fundamentadas únicamente en el documento.",
    "puntos_clave": "Extrae hasta 8 puntos clave y conclusiones, con explicaciones concisas.",
    "modo_libre": "Responde a la solicitud del usuario usando el documento como fuente.",
}

OUTPUT_TOKENS = {
    "reporte_maestro": 2400,
    "resumen_ejecutivo": 1600,
    "presentacion": 2000,
    "cuestionario": 2800,
    "puntos_clave": 1400,
}


async def _generar_con_gemini(
    prompt: str,
    temperature: float,
    max_output_tokens: int,
    response_schema: dict[str, Any] | None = None,
) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("Falta configurar GEMINI_API_KEY en el entorno de DocIA.")

    generation_config: dict[str, Any] = {
        "temperature": temperature,
        "maxOutputTokens": max_output_tokens,
        "thinkingConfig": {"thinkingBudget": 0},
    }
    if response_schema is not None:
        generation_config["responseMimeType"] = "application/json"
        generation_config["responseSchema"] = response_schema

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": generation_config,
    }
    timeout = httpx.Timeout(90.0, connect=10.0)
    retryable_statuses = {429, 500, 502, 503, 504}

    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(3):
            try:
                response = await client.post(
                    GEMINI_API_URL,
                    headers={"x-goog-api-key": GEMINI_API_KEY},
                    json=payload,
                )
                response.raise_for_status()
                break
            except httpx.TimeoutException as exc:
                raise RuntimeError(
                    "Gemini tardó demasiado en responder; intenta de nuevo."
                ) from exc
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code not in retryable_statuses or attempt == 2:
                    detail = exc.response.text[:500]
                    raise RuntimeError(
                        f"Gemini respondió con HTTP {exc.response.status_code}: {detail}"
                    ) from exc
                await asyncio.sleep(0.5 * (2 ** attempt))
            except httpx.RequestError as exc:
                raise RuntimeError("No se pudo conectar con la API de Gemini.") from exc

    try:
        response_data = response.json()
    except json.JSONDecodeError as exc:
        raise RuntimeError("Gemini devolvió una respuesta no válida.") from exc

    candidates = response_data.get("candidates", [])
    if not candidates:
        raise RuntimeError(
            "Gemini no generó contenido; la solicitud pudo ser bloqueada por seguridad."
        )

    candidate = candidates[0]
    if candidate.get("finishReason") == "MAX_TOKENS":
        raise RuntimeError(
            "Gemini agotó el límite de salida antes de terminar. "
            "Reduce el documento o intenta de nuevo."
        )

    parts = candidate.get("content", {}).get("parts", [])
    contenido = "".join(part.get("text", "") for part in parts)
    if not contenido:
        raise RuntimeError("Gemini devolvió una respuesta vacía.")
    return contenido


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
        "El objeto debe incluir todas las propiedades del esquema. Rellena solo la propiedad correspondiente "
        "a la tarea (sections para reportes, slides para presentaciones, qa para cuestionarios o key_points "
        "para puntos clave); deja las demás listas vacías. Mantén title, subtitle y summary concisos.\n"
    )
    if prompt_personalizado.strip():
        prompt += f"INSTRUCCIÓN DEL USUARIO: {prompt_personalizado.strip()}\n"
    prompt += f"DOCUMENTO FUENTE:\n{texto_contexto[:3500]}"

    respuesta = await _generar_con_gemini(
        prompt=prompt,
        temperature=0.1,
        max_output_tokens=OUTPUT_TOKENS.get(tipo, 1800),
        response_schema=REPORT_JSON_SCHEMA,
    )
    try:
        contenido = json.loads(respuesta)
    except json.JSONDecodeError as exc:
        raise ValueError("Gemini devolvió una respuesta que no es JSON válido.") from exc

    if not isinstance(contenido, dict) or not isinstance(contenido.get("sections"), list):
        raise ValueError("La respuesta JSON de Gemini no cumple el esquema esperado.")
    for key in ("title", "subtitle", "summary"):
        if not isinstance(contenido.get(key), str):
            raise ValueError(f"El campo JSON '{key}' debe ser texto.")
    for key in ("slides", "qa", "key_points"):
        if not isinstance(contenido.get(key), list):
            raise ValueError(f"El campo JSON '{key}' debe ser una lista.")
    for section in contenido["sections"]:
        if (
            not isinstance(section, dict)
            or not isinstance(section.get("title"), str)
            or not isinstance(section.get("paragraphs"), list)
            or not isinstance(section.get("bullets"), list)
        ):
            raise ValueError("Gemini devolvió una sección con formato inválido.")
    for slide in contenido["slides"]:
        if (
            not isinstance(slide, dict)
            or not isinstance(slide.get("title"), str)
            or not isinstance(slide.get("bullets"), list)
        ):
            raise ValueError("Gemini devolvió una diapositiva con formato inválido.")
    for item in contenido["qa"]:
        if (
            not isinstance(item, dict)
            or not isinstance(item.get("question"), str)
            or not isinstance(item.get("answer"), str)
        ):
            raise ValueError("Gemini devolvió una pregunta o respuesta con formato inválido.")
    if not all(isinstance(point, str) for point in contenido["key_points"]):
        raise ValueError("Gemini devolvió puntos clave con formato inválido.")
    return contenido


async def generar_resumen(
    texto_contexto: str,
    tipo_contenido: str = "reporte_maestro",
    prompt_personalizado: str = "",
) -> str:
    base_instruction = PROMPT_TEMPLATES.get(
        tipo_contenido, PROMPT_TEMPLATES["reporte_maestro"]
    )
    prompt_parts = [base_instruction]

    if prompt_personalizado and prompt_personalizado.strip():
        prompt_parts.append(
            f"INSTRUCCIÓN / REQUERIMIENTO ESPECÍFICO DEL USUARIO:\n"
            f"{prompt_personalizado.strip()}\n\n"
        )

    prompt_parts.append(f"DOCUMENTO A PROCESAR:\n{texto_contexto[:3500]}")

    return await _generar_con_gemini(
        prompt="".join(prompt_parts),
        temperature=0.1,
        max_output_tokens=450,
    )
