@echo off
title Iniciar DocIA
echo Iniciando servidor Backend DocIA (Uvicorn)...

:: Inicia uvicorn en segundo plano
start /B uvicorn main:app --host 127.0.0.1 --port 8000

:: Espera 2 segundos para asegurar que la API levante correctamente
timeout /t 2 /nobreak >nul

echo Abriendo interfaz Frontend DocIA...
:: Abre la URL de FastAPI en el navegador predeterminado
start http://127.0.0.1:8000/

:: Cierra la ventana de comandos
exit
