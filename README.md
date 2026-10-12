# DocIA

Aplicación web para analizar documentos y generar reportes con Gemini. La API y la interfaz se ejecutan en Docker; los reportes se pueden exportar a PDF, Word, PowerPoint, Markdown, texto, Excel y HTML.

## Requisitos

- Windows con Docker Desktop y Docker Compose v2, o Docker Engine con Compose.
- Una clave de API de Gemini, disponible en <https://aistudio.google.com/apikey>.

## Inicio normal

Abre PowerShell en la carpeta del proyecto. Crea el archivo de configuración local y agrega tu clave de Gemini a `.env`:

```powershell
if (-not (Test-Path .\.env)) { Copy-Item .env.example .env }
```

Reemplaza `GEMINI_API_KEY` en `.env` con una clave válida. No subas ese archivo a Git. En una copia recién descargada desde GitHub, crea también el archivo de SQLite para que Docker no lo cree como directorio:

```powershell
if (-not (Test-Path .\docia.db)) { New-Item -ItemType File .\docia.db | Out-Null }
```

Construye e inicia la aplicación:

```powershell
docker compose up -d --build
```

Abre <http://localhost:8000> cuando la aplicación esté activa. Para revisar el estado y los registros:

```powershell
docker compose ps
docker compose logs -f app
```

La cuenta inicial es `admin` con contraseña `admin123`. Cámbiala antes de usar la aplicación con datos reales o exponerla en una red.

## Desarrollo con recarga en caliente

Este perfil monta el código fuente del host en el contenedor de la aplicación. Los cambios de Python reinician Uvicorn automáticamente; los cambios de HTML, JavaScript y CSS se sirven desde los archivos actualizados.

```powershell
if (-not (Test-Path .\docia.db)) { New-Item -ItemType File .\docia.db | Out-Null }
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Después del primer inicio, guarda los archivos normalmente. Si cambias dependencias en `requirements.txt` o el `Dockerfile`, reconstruye solo la aplicación:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build app
```

Para salir del modo de desarrollo:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Formatos de salida

Elige el tipo de contenido (por ejemplo, reporte, resumen, cuestionario o presentación) y el formato de archivo por separado. Las opciones disponibles son PDF, DOCX, PPTX, Markdown, TXT, XLSX y HTML. La extensión descargada corresponde al formato seleccionado. Para obtener diapositivas con estructura de presentación, selecciona también “Presentación de Diapositivas” como tipo de contenido.

Los archivos se guardan en `archivos_generados/`; los documentos de la base RAG se guardan en `archivos_rag/`. La base SQLite está en `docia.db`.

Los reportes se solicitan a Gemini como JSON estructurado y se validan antes de exportarlos. El modelo predeterminado es `gemini-2.5-flash`; se puede cambiar con `GEMINI_MODEL` en `.env`. Para usar una plantilla corporativa de Word o PowerPoint, monta el archivo dentro del contenedor y define `DOCX_TEMPLATE_PATH` o `PPTX_TEMPLATE_PATH` con su ruta. Si no se define una plantilla, DocIA aplica estilos predeterminados. El HTML/PDF usa `templates/reporte.html`.

## Datos y mantenimiento

Los datos se conservan al detener o reconstruir la aplicación. Usa `docker compose down` para detenerla.

Para actualizar la aplicación en el modo normal después de cambiar código:

```powershell
docker compose up -d --build app
```

DocIA se conecta a la API de Gemini por HTTPS. Mantén la clave en `.env` y no la incluyas en el frontend ni en el repositorio.