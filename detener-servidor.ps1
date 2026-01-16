# Script para detener el servidor de desarrollo
# Uso: .\detener-servidor.ps1

Write-Host "Deteniendo servidor de desarrollo..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Deteniendo $($nodeProcesses.Count) proceso(s) de Node.js..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "✓ Servidor detenido correctamente" -ForegroundColor Green
} else {
    Write-Host "✓ No hay procesos de Node.js corriendo" -ForegroundColor Green
}
