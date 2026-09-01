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
    pdf.set_font("helvetica", size=12)
    
    # Manejar texto con saltos de línea y soporte UTF-8
    pdf.multi_cell(0, 10, text=contenido)
    pdf.output(ruta)
    return ruta

def crear_docx(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.docx")
    doc = Document()
    doc.add_heading('Reporte Ejecutivo - DocIA', 0)
    doc.add_paragraph(contenido)
    doc.save(ruta)
    return ruta

def crear_html(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.html")
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Reporte DocIA</title>
        <style>
            body {{ font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }}
        </style>
    </head>
    <body>
        {contenido}
    </body>
    </html>
    """
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(html_content)
    return ruta