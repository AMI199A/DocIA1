import os
import re
from fpdf import FPDF
from docx import Document
from pptx import Presentation
from pptx.util import Inches, Pt
from dotenv import load_dotenv

load_dotenv()
STORAGE_PATH = os.getenv("STORAGE_PATH", "./archivos_generados")

# Asegurar que la carpeta exista
os.makedirs(STORAGE_PATH, exist_ok=True)


def sanitizar_texto_para_excel(texto: str) -> str:
    """Elimina caracteres de control ASCII que causan IllegalCharacterError en openpyxl."""
    if not texto:
        return ""
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', str(texto))


def crear_pdf(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.pdf")
    pdf = FPDF()
    pdf.add_page()
    
    # Intentar cargar fuentes del sistema Windows o Linux para soporte UTF-8 completo
    fuentes_candidatas = [
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    ]
    
    fuente_cargada = False
    for font_path in fuentes_candidatas:
        if os.path.exists(font_path):
            try:
                pdf.add_font("CustomUTF", fname=font_path)
                pdf.set_font("CustomUTF", size=12)
                fuente_cargada = True
                break
            except Exception:
                continue

    if not fuente_cargada:
        # Fallback a Helvetica estándar sanitizando caracteres que no pertenecen a latin-1
        pdf.set_font("Helvetica", size=12)
        contenido = contenido.encode('latin-1', errors='replace').decode('latin-1')

    # Título principal
    pdf.set_font(size=16)
    titulo_doc = "Reporte DocIA"
    if not fuente_cargada:
        titulo_doc = titulo_doc.encode('latin-1', errors='replace').decode('latin-1')
    pdf.cell(0, 12, txt=titulo_doc, new_x="LMARGIN", new_y="NEXT", align="C")
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
        parrafo_limpio = parrafo.strip()
        if parrafo_limpio:
            doc.add_paragraph(parrafo_limpio)
    doc.save(ruta)
    return ruta


def crear_pptx(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.pptx")
    prs = Presentation()
    
    # Diapositiva de Portada
    title_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(title_slide_layout)
    if slide.shapes.title:
        slide.shapes.title.text = "DocIA - Presentación Ejecutiva"
    if len(slide.placeholders) > 1:
        slide.placeholders[1].text = "Generado con Inteligencia Artificial"
    
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
        if bslide.shapes.title:
            bslide.shapes.title.text = stitle[:90] if stitle else "Sección del Documento"
        
        # Asignar cuerpo de texto de forma segura
        tf = None
        if len(bslide.placeholders) > 1:
            tf = bslide.placeholders[1].text_frame
        elif bslide.shapes.placeholders:
            tf = bslide.shapes.placeholders[0].text_frame
            
        if tf:
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


def crear_html(contenido: str, nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.html")
    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte DocIA</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            max-width: 820px;
            margin: 2rem auto;
            padding: 2rem;
            color: #1e293b;
            background-color: #f8fafc;
        }}
        .report-card {{
            background: #ffffff;
            border-radius: 12px;
            padding: 2.5rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
        }}
        h1 {{ color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 0.5rem; }}
        h2 {{ color: #1e3a8a; margin-top: 1.5rem; }}
        pre {{ background: #f1f5f9; padding: 1rem; border-radius: 8px; white-space: pre-wrap; }}
    </style>
</head>
<body>
    <div class="report-card">
        <h1>Reporte DocIA</h1>
        <div>{contenido.replace(chr(10), '<br>')}</div>
    </div>
</body>
</html>"""
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(html_content)
    return ruta


def crear_xlsx(contenido: str, nombre_archivo: str) -> str:
    """
    Genera un archivo Excel (.xlsx) estructurado con openpyxl.
    Sanitiza caracteres de control para evitar fallos.
    """
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment

    contenido_seguro = sanitizar_texto_para_excel(contenido)
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.xlsx")
    wb = openpyxl.Workbook()

    # Hoja principal: Contenido del reporte
    ws = wb.active
    ws.title = "Reporte"

    header_font = Font(bold=True, size=14, color="FFFFFF")
    header_fill = PatternFill(start_color="1A3C5E", end_color="1A3C5E", fill_type="solid")
    section_font = Font(bold=True, size=12, color="1A3C5E")

    ws.column_dimensions["A"].width = 100

    ws.append(["Reporte — DocIA"])
    ws["A1"].font = header_font
    ws["A1"].fill = header_fill
    ws["A1"].alignment = Alignment(horizontal="center")
    ws.append([""])

    row = 3
    for linea in contenido_seguro.split("\n"):
        linea_str = linea.strip()
        if not linea_str:
            ws.append([""])
            row += 1
            continue

        ws.append([linea_str])
        cell = ws.cell(row=row, column=1)

        if linea_str.startswith("#"):
            cell.value = linea_str.lstrip("# ").strip()
            cell.font = section_font
        elif linea_str.startswith("**") and linea_str.endswith("**"):
            cell.value = linea_str.strip("**")
            cell.font = Font(bold=True)

        row += 1

    # Hoja de resumen con viñetas
    items = [l.lstrip("- •*").strip() for l in contenido_seguro.split("\n") if l.strip().startswith(("- ", "• ", "* "))]
    if items:
        ws2 = wb.create_sheet("Puntos Clave")
        ws2.column_dimensions["A"].width = 6
        ws2.column_dimensions["B"].width = 90
        ws2.append(["#", "Punto Clave"])
        ws2["A1"].font = Font(bold=True)
        ws2["B1"].font = Font(bold=True)
        for i, item in enumerate(items, 1):
            ws2.append([i, item])

    wb.save(ruta)
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
    elif fmt == "xlsx":
        return crear_xlsx(contenido, nombre_base)
    elif fmt == "html":
        return crear_html(contenido, nombre_base)
    else:
        # Fallback por defecto a PDF
        return crear_pdf(contenido, nombre_base)