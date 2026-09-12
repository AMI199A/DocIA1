import os
import httpx
import traceback
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODELO = os.getenv("OLLAMA_MODEL", "qwen:0.5b")

async def generar_resumen(texto_contexto: str) -> str:
    url = f"{OLLAMA_URL}/api/generate"
    
    payload = {
        "model": MODELO,
        "prompt": f"Analiza el siguiente documento y escribe un resumen ejecutivo profesional y coherente en español sin repetir frases:\n\n{texto_contexto[:2500]}",
        "stream": False,
        "options": {
            "num_predict": 500,
            "temperature": 0.5,
            "repeat_penalty": 1.2
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json().get("response", "No se generó respuesta.")
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"ERROR EN OLLAMA SERVICE:\n{error_details}")
        return f"Error conectando con Ollama: {str(e)}. Verifica que el servicio esté corriendo."