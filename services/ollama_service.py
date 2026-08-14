import os
import requests
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODELO = os.getenv("OLLAMA_MODEL", "llama3")

def generar_resumen(texto_contexto: str) -> str:
    url = f"{OLLAMA_URL}/api/generate"
    
    # Prompt estructurado para obtener un mejor reporte ejecutivo
    prompt_sistema = (
        "Actúa como un analista experto de sistemas y negocios. "
        "Tu tarea es leer el texto proporcionado y generar un Reporte Ejecutivo claro y conciso.\n"
        "El reporte debe contener estrictamente la siguiente estructura:\n"
        "1. Resumen principal (máximo 3 líneas).\n"
        "2. Puntos clave (en formato de viñetas).\n"
        "3. Conclusión o recomendación.\n\n"
        f"Texto a analizar:\n{texto_contexto}"
    )
    
    payload = {
        "model": MODELO,
        "prompt": prompt_sistema,
        "stream": False,
        "options": {
            "temperature": 0.3 # Temperatura baja para respuestas más precisas y menos creativas
        }
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json().get("response", "No se generó respuesta.")
    except Exception as e:
        return f"Error conectando con Ollama: {str(e)}. Verifica que el servicio esté corriendo."