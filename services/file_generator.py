import os
from fpdf import FPDF
from docx import Document
from dotenv import load_dotenv

load_dotenv()
STORAGE_PATH = os.getenv("STORAGE_PATH", "./archivos_generados")

# Asegurar que la carpeta exista
os.makedirs(STORAGE_PATH, exist_ok=True)

def crear_pdf(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.pdf")
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    # Manejar texto con saltos de línea
    pdf.multi_cell(0, 10, txt=contenido)
    pdf.output(ruta)
    return ruta

def crear_docx(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.docx")
    doc = Document()
    doc.add_heading('Reporte Ejecutivo - DocIA', 0)
    doc.add_paragraph(contenido)
    doc.save(ruta)
    return ruta