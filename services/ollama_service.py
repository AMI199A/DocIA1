import os
import requests
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL") or os.getenv("OLLAMA_URL") or "http://localhost:11434"
# Modelo optimizado para respuestas rápidas
MODELO = os.getenv("OLLAMA_MODEL") or "phi3"

def generar_resumen(texto_contexto: str, modelo: str = MODELO) -> str:
    url = f"{OLLAMA_URL}/api/generate"
    
    payload = {
        "model": modelo,
        "prompt": texto_contexto,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 800
        }
    }
    
    try:
        # Primer intento con timeout estricto (30s)
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        return response.json().get("response", "No se generó respuesta.")
    except Exception as e:
        print(f"Fallo con modelo {modelo} ({str(e)}). Intentando fallback...")
        
        # Fallback a un modelo más ligero (ej. phi3)
        fallback_model = "phi3"
        payload["model"] = fallback_model
        
        try:
            # Segundo intento con timeout más amplio (600s)
            fallback_res = requests.post(url, json=payload, timeout=600)
            fallback_res.raise_for_status()
            return fallback_res.json().get("response", "No se generó respuesta (fallback).")
        except Exception as fallback_err:
            return f"Error conectando con Ollama (incluso en fallback): {str(fallback_err)}"

def get_ollama_tags():
    url = f"{OLLAMA_URL}/api/tags"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        models = response.json().get("models", [])
        return [m.get("name") for m in models]
    except Exception as e:
        return ["phi3", "llama3"] # Fallback models