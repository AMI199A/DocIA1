# Etapa 1: Construcción de la aplicación Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Etapa 2: Imagen final con Python y Backend
FROM python:3.12-slim

# Evitar que Python escriba archivos .pyc en disco y buffer de logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar requerimientos de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY main.py .
COPY services/ ./services/
COPY docia.db .

# Copiar el frontend compilado desde la etapa 1
COPY --from=frontend-builder /app/dist/public ./dist/public

# Crear directorio para almacenar archivos generados
RUN mkdir -p archivos_generados

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
