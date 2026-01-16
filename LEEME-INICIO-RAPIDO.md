# 🚀 Inicio Rápido - Gestión del Servidor

## ✅ Métodos para Iniciar el Servidor

### Método 1: Script PowerShell (Recomendado)
1. **Doble clic** en `iniciar-servidor.ps1`
2. Si aparece un error de permisos, ejecuta en PowerShell:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   Luego vuelve a hacer doble clic en `iniciar-servidor.ps1`

### Método 2: Script Batch (Más fácil)
1. **Doble clic** en `iniciar-servidor.bat`
2. El servidor se iniciará automáticamente

### Método 3: Desde la Terminal
```bash
npm run dev
```

### Método 4: Con limpieza automática
```bash
npm run dev:clean
```

## 🛑 Detener el Servidor

### Método 1: Script
- **Doble clic** en `detener-servidor.bat` o `detener-servidor.ps1`

### Método 2: Desde la Terminal
- Presiona `Ctrl + C` en la terminal donde está corriendo el servidor

### Método 3: Comando
```bash
npm run dev:stop
```

## 🔧 Solución de Problemas

### Si el servidor no inicia:
1. **Usa `iniciar-servidor.bat`** - Cierra procesos anteriores automáticamente
2. **Verifica que no haya otro proceso usando el puerto 3002**
3. **Espera 10-15 segundos** después de iniciar antes de abrir el navegador

### Si aparece "puerto en uso":
- El script automáticamente usa otro puerto (3003, 3004, etc.)
- Next.js mostrará en la terminal qué puerto está usando

### Si el servidor se detiene inesperadamente:
1. **Revisa la terminal** para ver errores de compilación
2. **Usa `detener-servidor.bat`** para limpiar procesos colgados
3. **Luego usa `iniciar-servidor.bat`** para reiniciar

## 📝 Notas Importantes

- ⚠️ **No cierres la ventana de la terminal** mientras el servidor está corriendo
- ✅ **Mantén una sola instancia** del servidor corriendo a la vez
- 🔄 **Espera a que compile** antes de refrescar el navegador
- 💾 **Guarda los archivos** antes de refrescar para ver cambios

## 🎯 Flujo de Trabajo Recomendado

1. **Inicio del día:**
   - Doble clic en `iniciar-servidor.bat`
   - Espera 10 segundos
   - Abre `http://localhost:3002` en tu navegador

2. **Durante el desarrollo:**
   - Edita archivos
   - Guarda cambios (Ctrl+S)
   - El servidor se recarga automáticamente

3. **Fin del día:**
   - Doble clic en `detener-servidor.bat`
   - O simplemente cierra la ventana de la terminal
