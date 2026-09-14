import os
from fpdf import FPDF
from docx import Document
from pptx import Presentation
from pptx.util import Inches, Pt
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
    pdf.cell(0, 12, txt="Reporte DocIA", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(6)
    
    # Contenido con saltos de línea
    pdf.set_font(size=11)
    pdf.multi_cell(0, 6.5, txt=contenido)
    
    pdf.output(ruta)
    return ruta

def crear_docx(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.docx")
    doc = Document()
    doc.add_heading('Reporte DocIA', 0)
    for parrafo in contenido.split("\n\n"):
        if parrafo.strip():
            doc.add_paragraph(parrafo.strip())
    doc.save(ruta)
    return ruta

def crear_pptx(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.pptx")
    prs = Presentation()
    
    # Diapositiva de Portada
    title_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(title_slide_layout)
    title = slide.shapes.title
    subtitle = slide.placeholders[1]
    title.text = "DocIA - Presentación Ejecutiva"
    subtitle.text = "Generado con Inteligencia Artificial"
    
    # Procesar contenido en diapositivas estructuradas
    lineas = contenido.strip().split("\n")
    slides_data = []
    current_title = "Puntos Clave y Resumen"
    current_bullets = []
    
    for linea in lineas:
        linea_str = linea.strip()
        if not linea_str:
            continue
        
        # Detección de inicio de nueva diapositiva o encabezado
        if (linea_str.startswith("[Diapositiva") or 
            linea_str.startswith("Diapositiva ") or 
            linea_str.startswith("# ") or 
            linea_str.startswith("## ") or 
            (linea_str.endswith(":") and len(linea_str) < 60 and not linea_str.startswith(("-", "*", "•")))):
            
            if current_bullets or current_title != "Puntos Clave y Resumen":
                slides_data.append((current_title, current_bullets))
                current_bullets = []
            
            clean_t = linea_str.lstrip("#").strip().strip("[]:")
            current_title = clean_t
        else:
            clean_bullet = linea_str.lstrip("*-•0123456789. ").strip()
            if clean_bullet:
                current_bullets.append(clean_bullet)
                
    if current_bullets or current_title:
        slides_data.append((current_title, current_bullets))
        
    bullet_slide_layout = prs.slide_layouts[1]
    
    for stitle, sbullets in slides_data:
        bslide = prs.slides.add_slide(bullet_slide_layout)
        btitle = bslide.shapes.title
        btitle.text = stitle[:90] if stitle else "Sección del Documento"
        
        tf = bslide.shapes.placeholders[1].text_frame
        tf.word_wrap = True
        
        if sbullets:
            tf.text = sbullets[0][:220]
            for bullet_text in sbullets[1:6]:
                p = tf.add_paragraph()
                p.text = bullet_text[:220]
        else:
            tf.text = "Contenido procesado por DocIA."
            
    prs.save(ruta)
    return ruta

def crear_md(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.md")
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(f"# Reporte DocIA\n\n{contenido}")
    return ruta

def crear_txt(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.txt")
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(f"REPORTE DOCIA\n{'='*30}\n\n{contenido}")
    return ruta

def generar_archivo_salida(contenido: str, formato: str, nombre_base: str) -> str:
    fmt = formato.lower().strip().replace(".", "")
    if fmt == "pdf":
        return crear_pdf(contenido, nombre_base)
    elif fmt == "docx":
        return crear_docx(contenido, nombre_base)
    elif fmt == "pptx":
        return crear_pptx(contenido, nombre_base)
    elif fmt == "md":
        return crear_md(contenido, nombre_base)
    elif fmt == "txt":
        return crear_txt(contenido, nombre_base)
    else:
        # Fallback por defecto a PDF
        return crear_pdf(contenido, nombre_base)