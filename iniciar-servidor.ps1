# Script para iniciar el servidor de desarrollo de Next.js
# Uso: .\iniciar-servidor.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Iniciando Servidor de Desarrollo Next.js" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del proyecto
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Detener procesos de Node.js anteriores
Write-Host "[1/4] Verificando procesos de Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Deteniendo $($nodeProcesses.Count) proceso(s) de Node.js..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   ✓ Procesos detenidos" -ForegroundColor Green
} else {
    Write-Host "   ✓ No hay procesos de Node.js corriendo" -ForegroundColor Green
}

# Limpiar caché de Next.js (opcional, comentado por defecto)
# Write-Host "[2/4] Limpiando caché de Next.js..." -ForegroundColor Yellow
# if (Test-Path ".next") {
#     Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
#     Write-Host "   ✓ Caché limpiado" -ForegroundColor Green
# } else {
#     Write-Host "   ✓ No hay caché que limpiar" -ForegroundColor Green
# }

Write-Host "[2/4] Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host "   ✓ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "   ✓ Dependencias OK" -ForegroundColor Green
}

# Verificar si el puerto 3002 está en uso
Write-Host "[3/4] Verificando puerto 3002..." -ForegroundColor Yellow
$portInUse = Test-NetConnection -ComputerName localhost -Port 3002 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portInUse) {
    Write-Host "   ⚠ Puerto 3002 en uso, intentando liberarlo..." -ForegroundColor Yellow
    # Intentar liberar el puerto matando procesos que lo usan
    $processes = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        $processes | ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
        Write-Host "   ✓ Puerto 3002 liberado" -ForegroundColor Green
    }
} else {
    Write-Host "   ✓ Puerto 3002 disponible" -ForegroundColor Green
}

# Iniciar el servidor
Write-Host "[4/4] Iniciando servidor de desarrollo..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  El servidor se iniciará en PUERTO 3002" -ForegroundColor Cyan
Write-Host "  URL: http://localhost:3002" -ForegroundColor Cyan
Write-Host "  Presiona Ctrl+C para detener el servidor" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar npm run dev (siempre en puerto 3002)
npm run dev
