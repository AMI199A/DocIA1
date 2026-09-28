import os
import re
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


def crear_pptx(contenido: str, nombre_archivo: str) -> str:
    """
    Genera un archivo PowerPoint (.pptx) con el contenido del reporte.
    Cada sección separada por línea en blanco doble o encabezado se convierte en una diapositiva.
    """
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor

    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.pptx")
    prs = Presentation()

    # Slide de título
    slide_layout = prs.slide_layouts[0]  # Título
    slide = prs.slides.add_slide(slide_layout)
    slide.shapes.title.text = "Reporte — DocIA"
    slide.placeholders[1].text = "Generado automáticamente por DocIA"

    # Dividir el contenido en bloques (por encabezados ## o párrafos largos)
    bloques = re.split(r'(?m)^#{1,3}\s+', contenido)
    bloques = [b.strip() for b in bloques if b.strip()]

    for bloque in bloques:
        lineas = bloque.split("\n", 1)
        titulo_slide = lineas[0][:80] if lineas else "Contenido"
        cuerpo_slide = lineas[1].strip() if len(lineas) > 1 else ""

        # Usar layout de contenido
        layout = prs.slide_layouts[1]  # Título + Contenido
        s = prs.slides.add_slide(layout)
        s.shapes.title.text = titulo_slide

        tf = s.placeholders[1].text_frame
        tf.word_wrap = True
        # Agregar párrafos respetando saltos de línea
        for i, linea in enumerate(cuerpo_slide.split("\n")[:15]):  # Max 15 líneas por slide
            if linea.strip():
                p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
                p.text = linea.strip()
                p.font.size = Pt(14)

    prs.save(ruta)
    return ruta


def crear_xlsx(contenido: str, nombre_archivo: str) -> str:
    """
    Genera un archivo Excel (.xlsx) con el contenido del reporte.
    Detecta tablas en el texto y las convierte en hojas de cálculo.
    El resto del contenido va en la hoja principal como texto.
    """
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment

    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.xlsx")
    wb = openpyxl.Workbook()

    # ── Hoja principal: Contenido del reporte ──────────────────────────
    ws = wb.active
    ws.title = "Reporte"

    # Estilos
    header_font = Font(bold=True, size=14, color="FFFFFF")
    header_fill = PatternFill(start_color="1A3C5E", end_color="1A3C5E", fill_type="solid")
    section_font = Font(bold=True, size=12, color="1A3C5E")

    ws.column_dimensions["A"].width = 100

    # Título
    ws.append(["Reporte — DocIA"])
    ws["A1"].font = header_font
    ws["A1"].fill = header_fill
    ws["A1"].alignment = Alignment(horizontal="center")
    ws.append([""])

    row = 3
    for linea in contenido.split("\n"):
        if not linea.strip():
            ws.append([""])
            row += 1
            continue

        ws.append([linea])
        cell = ws.cell(row=row, column=1)

        # Detectar encabezados
        if linea.startswith("#"):
            texto_limpio = linea.lstrip("# ").strip()
            cell.value = texto_limpio
            cell.font = section_font
        elif linea.startswith("**") and linea.endswith("**"):
            cell.value = linea.strip("**")
            cell.font = Font(bold=True)

        row += 1

    # ── Hoja de resumen: Detectar listas con guiones ───────────────────
    items = [l.lstrip("- •*").strip() for l in contenido.split("\n") if l.strip().startswith(("- ", "• ", "* "))]
    if items:
        ws2 = wb.create_sheet("Puntos Clave")
        ws2.column_dimensions["A"].width = 5
        ws2.column_dimensions["B"].width = 90
        ws2.append(["#", "Punto Clave"])
        ws2["A1"].font = Font(bold=True)
        ws2["B1"].font = Font(bold=True)
        for i, item in enumerate(items, 1):
            ws2.append([i, item])

    wb.save(ruta)
    return ruta