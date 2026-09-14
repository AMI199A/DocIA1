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
    
    # Usar fuente TrueType del sistema Windows para soporte completo UTF-8
    # (acentos, ñ, caracteres especiales del español)
    font_path = "C:/Windows/Fonts/arial.ttf"
    if os.path.exists(font_path):
        pdf.add_font("ArialUTF", fname=font_path)
        pdf.set_font("ArialUTF", size=12)
    else:
        # Fallback: limpiar caracteres no soportados por Helvetica (Latin-1)
        pdf.set_font("Helvetica", size=12)
        contenido = contenido.encode('latin-1', errors='replace').decode('latin-1')
    
    # Título
    pdf.set_font(size=16)
    pdf.cell(0, 12, txt="Reporte Ejecutivo - DocIA", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(6)
    
    # Contenido con saltos de línea
    pdf.set_font(size=12)
    pdf.multi_cell(0, 7, txt=contenido)
    
    pdf.output(ruta)
    return ruta

def crear_docx(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.docx")
    doc = Document()
    doc.add_heading('Reporte Ejecutivo - DocIA', 0)
    doc.add_paragraph(contenido)
    doc.save(ruta)
    return ruta