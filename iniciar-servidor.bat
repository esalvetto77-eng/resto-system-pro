@echo off
REM Script para iniciar el servidor de desarrollo de Next.js
REM Uso: doble clic en iniciar-servidor.bat

echo ================================================
echo   Iniciando Servidor de Desarrollo Next.js
echo ================================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Detener procesos de Node.js
echo [1/4] Verificando procesos de Node.js...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    Deteniendo procesos de Node.js...
    taskkill /F /IM node.exe >NUL 2>&1
    timeout /t 2 >NUL
    echo    [OK] Procesos detenidos
) else (
    echo    [OK] No hay procesos de Node.js corriendo
)

echo [2/4] Verificando dependencias...
if not exist "node_modules" (
    echo    Instalando dependencias...
    call npm install
    echo    [OK] Dependencias instaladas
) else (
    echo    [OK] Dependencias OK
)

echo [3/4] Verificando puerto 3002...
netstat -ano | findstr ":3002" >nul
if %ERRORLEVEL% EQU 0 (
    echo    [!] Puerto 3002 en uso, intentando liberarlo...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 >nul
    echo    [OK] Puerto liberado
) else (
    echo    [OK] Puerto 3002 disponible
)

echo [4/4] Iniciando servidor de desarrollo...
echo.
echo ================================================
echo   El servidor se iniciará en PUERTO 3002
echo   URL: http://localhost:3002
echo   Presiona Ctrl+C para detener el servidor
echo ================================================
echo.

REM Iniciar npm run dev (siempre en puerto 3002)
call npm run dev

pause
