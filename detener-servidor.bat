@echo off
REM Script para detener el servidor de desarrollo
REM Uso: doble clic en detener-servidor.bat

echo Deteniendo servidor de desarrollo...

tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /F /IM node.exe
    echo [OK] Servidor detenido correctamente
) else (
    echo [OK] No hay procesos de Node.js corriendo
)

timeout /t 2 >NUL
