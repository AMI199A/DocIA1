import os
import requests
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL")
MODELO = os.getenv("OLLAMA_MODEL")

def generar_resumen(texto_contexto: str) -> str:
    url = f"{OLLAMA_URL}/api/generate"
    
    prompt = f"Actúa como un analista experto. Genera un reporte ejecutivo basado en el siguiente texto:\n\n{texto_contexto}"
    
    payload = {
        "model": MODELO,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json().get("response", "No se generó respuesta.")
    except Exception as e:
        return f"Error conectando con Ollama: {str(e)}"