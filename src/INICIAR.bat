@echo off
title Generador de Carteleria Retail
cd /d "%~dp0"

echo ============================================================
echo   Generador de Carteleria Retail (100%% Portable)
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js detectado. Iniciando servidor...
    start http://localhost:3000
    node server\server.js
    goto end
)

where powershell >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Iniciando via PowerShell nativo de Windows (sin instalacion)...
    powershell -ExecutionPolicy Bypass -File server\server.ps1
    goto end
)

echo [OK] Abriendo directamente en el navegador...
start "" "%~dp0..\index.html"

:end
