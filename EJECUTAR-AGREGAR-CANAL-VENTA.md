# Instrucciones para Agregar Campo Canal de Venta

## Opción 1: Usar la Página Admin (Recomendado)

1. Espera 2-3 minutos después del último push para que Vercel despliegue los cambios
2. Ve a: `https://tu-app.vercel.app/admin/add-canal-venta-field`
3. Haz clic en "Agregar Campo Canal de Venta"
4. Espera la confirmación

## Opción 2: Ejecutar Directamente el Endpoint (Alternativa)

Si la página no carga, puedes ejecutar el endpoint directamente desde la consola del navegador:

1. Abre tu aplicación en Vercel (debes estar logueado como admin)
2. Abre la consola del navegador (F12 > Console)
3. Copia y pega este código:

```javascript
fetch('/api/admin/add-canal-venta-field', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
})
.then(response => response.json())
.then(data => {
  console.log('Resultado:', data);
  if (data.success) {
    alert('✅ ' + data.message);
  } else {
    alert('❌ Error: ' + (data.error || data.message));
  }
})
.catch(error => {
  console.error('Error:', error);
  alert('❌ Error al ejecutar: ' + error.message);
});
```

4. Presiona Enter para ejecutar
5. Deberías ver una alerta con el resultado

## Verificación

Después de ejecutar cualquiera de las opciones, verifica que funcionó:

1. Ve a crear una nueva venta: `/ventas/nuevo`
2. Deberías ver el campo "Canal de Venta" después de "Tipo de Turno"
3. Si aparece, ¡todo funcionó correctamente!
