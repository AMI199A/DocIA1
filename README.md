# 📄 DocIA - Plataforma Inteligente de Documentación y Reportes con IA

DocIA es una plataforma integral para la generación, análisis y consulta de documentos corporativos impulsada por Inteligencia Artificial (modelos LLM locales vía Ollama).

---

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:

1. **Git**: Para clonar el repositorio.
2. **Ollama**: Descargar e instalar desde [ollama.com](https://ollama.com).
   - Descarga el modelo recomendado ejecutando en tu terminal:
     ```bash
     ollama pull phi3
     ```
   - Asegúrate de que Ollama esté corriendo (`ollama serve`).

---

## 🛠️ Opción 1: Levantar con Docker (Recomendado)

Si tienes **Docker Desktop** instalado y en ejecución:

```bash
# 1. Clonar el repositorio y entrar al proyecto
git clone -b QA https://github.com/AMI199A/DocIA.git
cd DocIA

# 2. Construir y levantar el contenedor
docker compose up --build -d
```

¡Listo! Abre en tu navegador:
👉 **`http://localhost:8000`**

*(Para detener el contenedor: `docker compose down`)*

---

## 💻 Opción 2: Levantar en Entorno Local (Python + Node.js)

Si prefieres ejecutarlo de forma nativa para desarrollo:

### 1. Requisitos
* **Python 3.10+**
* **Node.js 18+** y **npm**

---

### 2. Configurar el Backend (FastAPI)

Abre una terminal en la raíz del proyecto (`DocIA`):

```bash
# 1. Crear entorno virtual
python -m venv .venv

# 2. Activar el entorno virtual
# En Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# En Windows (CMD):
.\.venv\Scripts\activate.bat
# En Linux / Mac:
source .venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Iniciar el servidor FastAPI
uvicorn main:app --reload --port 8000
```

> ℹ️ **Nota**: Al arrancar el backend por primera vez, SQLAlchemy creará automáticamente el archivo de base de datos local `docia.db` con todas sus tablas.

---

### 3. Configurar el Frontend (React + Vite)

Abre **otra terminal** y dirígete a la carpeta `frontend`:

```bash
# 1. Entrar a la carpeta frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Abre en tu navegador:
👉 **`http://localhost:5173`** (Frontend en desarrollo)  
*(Las peticiones a la API se redirigen automáticamente al puerto 8000)*

---

## 👤 Primeros Pasos en la Aplicación

1. **Crear una cuenta**:
   - Ingresa a la ruta `/register` en tu navegador.
   - Llena tus datos (Nombre, Correo y Contraseña).
2. **Asignarse rol de Administrador**:
   - Abre tu terminal en la raíz del backend con el entorno virtual activado y ejecuta:
     ```bash
     python cli_admin.py make-admin tu_correo@ejemplo.com
     ```
   - Al recargar la página, tendrás acceso al panel de administración y a todas las funciones avanzadas.
3. **Funcionalidades Principales**:
   - 📊 **Generación de Reportes**: Exporta en 5 formatos (PDF, Word, PowerPoint, Excel, HTML).
   - 💬 **Chat Q&A**: Consulta preguntas sobre los documentos cargados al RAG.
   - 📁 **Gestor Documental**: Sube y gestiona archivos para contexto de la IA.
   - 🗂️ **Plantillas**: Utiliza formatos predefinidos para tus reportes.
