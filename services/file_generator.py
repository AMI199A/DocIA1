import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor
from pptx import Presentation
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader, select_autoescape

load_dotenv()
STORAGE_PATH = os.getenv("STORAGE_PATH", "./archivos_generados")
TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

# Asegurar que la carpeta exista
os.makedirs(STORAGE_PATH, exist_ok=True)


def sanitizar_texto_para_excel(texto: str) -> str:
    """Elimina caracteres de control ASCII que causan IllegalCharacterError en openpyxl."""
    if not texto:
        return ""
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', str(texto))


def _normalizar_contenido(contenido: str | dict[str, Any]) -> dict[str, Any]:
    if isinstance(contenido, dict):
        data = dict(contenido)
    else:
        sections: list[dict[str, Any]] = []
        current_section: dict[str, Any] = {"title": "Contenido", "paragraphs": [], "bullets": []}
        for line in str(contenido).splitlines():
            text = line.strip()
            if not text:
                continue
            if text.startswith("#"):
                if current_section["paragraphs"] or current_section["bullets"]:
                    sections.append(current_section)
                current_section = {"title": text.lstrip("# ").strip(), "paragraphs": [], "bullets": []}
            elif text.startswith(("- ", "* ", "• ")):
                current_section["bullets"].append(text[2:].strip())
            else:
                current_section["paragraphs"].append(text)
        if current_section["paragraphs"] or current_section["bullets"]:
            sections.append(current_section)
        data = {"title": "Reporte DocIA", "sections": sections}

    data.setdefault("title", "Reporte DocIA")
    data.setdefault("subtitle", "")
    data.setdefault("summary", "")
    data.setdefault("sections", [])
    data.setdefault("slides", [])
    data.setdefault("qa", [])
    data.setdefault("key_points", [])
    return data


def contenido_a_markdown(contenido: str | dict[str, Any]) -> str:
    data = _normalizar_contenido(contenido)
    lines = [f"# {data['title']}"]
    if data["subtitle"]:
        lines.extend(["", str(data["subtitle"])])
    if data["summary"]:
        lines.extend(["", "## Resumen ejecutivo", "", str(data["summary"])])
    for section in data["sections"]:
        lines.extend(["", f"## {section.get('title', 'Sección')}"])
        lines.append("")
        lines.extend(str(paragraph) for paragraph in section.get("paragraphs", []) if paragraph)
        lines.extend(f"- {bullet}" for bullet in section.get("bullets", []) if bullet)
    if data["slides"]:
        lines.extend(["", "## Diapositivas"])
        for slide in data["slides"]:
            lines.extend(["", f"### {slide.get('title', 'Diapositiva')}"])
            lines.extend(f"- {bullet}" for bullet in slide.get("bullets", []) if bullet)
    if data["qa"]:
        lines.extend(["", "## Preguntas y respuestas"])
        for item in data["qa"]:
            lines.extend(["", f"**Pregunta:** {item.get('question', '')}", f"**Respuesta:** {item.get('answer', '')}"])
    if data["key_points"]:
        lines.extend(["", "## Puntos clave"])
        lines.extend(f"- {point}" for point in data["key_points"] if point)
    return "\n".join(lines).strip()


def _render_html(contenido: str | dict[str, Any]) -> str:
    environment = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(("html", "xml")),
    )
    template = environment.get_template("reporte.html")
    return template.render(report=_normalizar_contenido(contenido), generated_at=datetime.now().strftime("%d/%m/%Y %H:%M"))


def crear_pdf(contenido: str | dict[str, Any], nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.pdf")
    from weasyprint import HTML

    HTML(string=_render_html(contenido), base_url=str(TEMPLATE_DIR)).write_pdf(ruta)
    return ruta


def crear_docx(contenido: str | dict[str, Any], nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.docx")
    data = _normalizar_contenido(contenido)
    template_path = os.getenv("DOCX_TEMPLATE_PATH", "")
    doc = Document(template_path) if template_path and os.path.isfile(template_path) else Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    normal_style = doc.styles["Normal"]
    normal_style.font.name = "Aptos"
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(45, 55, 72)
    for style_name in ("Title", "Heading 1", "Heading 2"):
        doc.styles[style_name].font.name = "Aptos Display"
        doc.styles[style_name].font.color.rgb = RGBColor(22, 78, 99)

    doc.add_heading(data["title"], 0)
    if data["subtitle"]:
        subtitle = doc.add_paragraph(data["subtitle"])
        subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if data["summary"]:
        doc.add_heading("Resumen ejecutivo", level=1)
        doc.add_paragraph(data["summary"])
    for item in data["sections"]:
        doc.add_heading(item.get("title", "Sección"), level=1)
        for paragraph in item.get("paragraphs", []):
            doc.add_paragraph(paragraph)
        for bullet in item.get("bullets", []):
            doc.add_paragraph(bullet, style="List Bullet")
    if data["slides"]:
        doc.add_heading("Contenido de la presentación", level=1)
        for slide in data["slides"]:
            doc.add_heading(slide.get("title", "Diapositiva"), level=2)
            for bullet in slide.get("bullets", []):
                doc.add_paragraph(bullet, style="List Bullet")
    if data["qa"]:
        doc.add_heading("Preguntas y respuestas", level=1)
        for item in data["qa"]:
            question = doc.add_paragraph()
            question.add_run(f"Pregunta: {item.get('question', '')}").bold = True
            doc.add_paragraph(f"Respuesta: {item.get('answer', '')}")
    if data["key_points"]:
        doc.add_heading("Puntos clave", level=1)
        for point in data["key_points"]:
            doc.add_paragraph(point, style="List Bullet")
    doc.save(ruta)
    return ruta


def crear_pptx(contenido: str | dict[str, Any], nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.pptx")
    data = _normalizar_contenido(contenido)
    template_path = os.getenv("PPTX_TEMPLATE_PATH", "")
    prs = Presentation(template_path) if template_path and os.path.isfile(template_path) else Presentation()

    if not prs.slides:
        cover = prs.slides.add_slide(prs.slide_layouts[0])
        if cover.shapes.title:
            cover.shapes.title.text = data["title"]
        if len(cover.placeholders) > 1:
            cover.placeholders[1].text = data["subtitle"] or data["summary"]

    slides_data = data["slides"]
    if not slides_data:
        slides_data = [
            {
                "title": section.get("title", "Sección"),
                "bullets": section.get("bullets", []) + section.get("paragraphs", []),
            }
            for section in data["sections"]
        ]
    if not slides_data and data["key_points"]:
        slides_data = [{"title": "Puntos clave", "bullets": data["key_points"]}]

    for slide_data in slides_data:
        slide = prs.slides.add_slide(prs.slide_layouts[1])
        if slide.shapes.title:
            slide.shapes.title.text = slide_data.get("title", "Sección")[:100]
        body = next((shape for shape in slide.placeholders if shape.placeholder_format.idx == 1), None)
        if body is None:
            continue
        text_frame = body.text_frame
        text_frame.clear()
        text_frame.word_wrap = True
        bullets = slide_data.get("bullets", [])[:7]
        for index, bullet in enumerate(bullets):
            paragraph = text_frame.paragraphs[0] if index == 0 else text_frame.add_paragraph()
            paragraph.text = str(bullet)[:240]
            paragraph.level = 0
            paragraph.font.size = Pt(20)
        if not bullets:
            text_frame.text = data["summary"][:400] or "Sin puntos disponibles."
            text_frame.paragraphs[0].font.size = Pt(20)

    prs.save(ruta)
    return ruta


def crear_md(contenido: str | dict[str, Any], nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.md")
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(contenido_a_markdown(contenido))
    return ruta


def crear_txt(contenido: str | dict[str, Any], nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.txt")
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(contenido_a_markdown(contenido).replace("#", "").replace("**", ""))
    return ruta


def crear_html(contenido: str | dict[str, Any], nombre_archivo: str) -> str:
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.html")
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(_render_html(contenido))
    return ruta


def crear_xlsx(contenido: str | dict[str, Any], nombre_archivo: str) -> str:
    import openpyxl
    from openpyxl.styles import Alignment, Font, PatternFill

    data = _normalizar_contenido(contenido)
    ruta = os.path.join(STORAGE_PATH, f"{nombre_archivo}.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    header_fill = PatternFill(fill_type="solid", fgColor="164E63")
    header_font = Font(bold=True, color="FFFFFF")
    wrap = Alignment(vertical="top", wrap_text=True)

    if data["qa"]:
        ws.title = "Cuestionario"
        ws.append(["Pregunta", "Respuesta"])
        for item in data["qa"]:
            ws.append([
                sanitizar_texto_para_excel(item.get("question", "")),
                sanitizar_texto_para_excel(item.get("answer", "")),
            ])
        ws.column_dimensions["A"].width = 48
        ws.column_dimensions["B"].width = 90
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions
        for row in ws.iter_rows(min_row=2):
            for cell in row:
                cell.data_type = "s"
                cell.alignment = wrap
    else:
        ws.title = "Reporte"
        ws.append([data["title"]])
        if data["summary"]:
            ws.append(["Resumen ejecutivo"])
            ws.append([data["summary"]])
        for section in data["sections"]:
            ws.append([section.get("title", "Sección")])
            for paragraph in section.get("paragraphs", []):
                ws.append([paragraph])
            for bullet in section.get("bullets", []):
                ws.append([f"• {bullet}"])
        for point in data["key_points"]:
            ws.append([f"• {point}"])
        ws.column_dimensions["A"].width = 110
        for row in ws.iter_rows():
            for cell in row:
                if cell.value is not None:
                    cell.value = sanitizar_texto_para_excel(cell.value)
                    cell.data_type = "s"
                    cell.alignment = wrap

    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 28

    wb.save(ruta)
    return ruta


def generar_archivo_salida(contenido: str | dict[str, Any], formato: str, nombre_base: str) -> str:
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
    raise ValueError(f"Formato de salida no soportado: {formato}")