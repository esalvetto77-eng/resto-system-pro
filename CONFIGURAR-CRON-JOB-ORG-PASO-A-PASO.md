# 📋 Guía Completa: Configurar Actualización Automática con cron-job.org

## 🎯 Objetivo
Configurar un cron job gratuito que actualice la cotización del dólar automáticamente 2 veces al día (9 AM y 3 PM) sin necesidad de Vercel Pro.

---

## 📝 Paso 1: Crear Cuenta en cron-job.org

1. **Abre tu navegador** (Chrome, Edge, Firefox, etc.)

2. **Ve a la página de cron-job.org**:
   ```
   https://cron-job.org
   ```

3. **Haz clic en "Sign Up"** o "Registrarse" (botón en la esquina superior derecha)

4. **Completa el formulario de registro**:
   - **Email**: Ingresa tu email (ejemplo: `tu-email@gmail.com`)
   - **Password**: Crea una contraseña segura
   - **Confirm Password**: Repite la contraseña
   - Acepta los términos y condiciones
   - Haz clic en **"Sign Up"** o **"Registrarse"**

5. **Verifica tu email**:
   - Revisa tu bandeja de entrada
   - Busca un email de cron-job.org
   - Haz clic en el enlace de verificación
   - Si no lo encuentras, revisa la carpeta de spam

6. **Inicia sesión** con tu email y contraseña

---

## 📝 Paso 2: Crear el Cron Job

### 2.1. Acceder al Panel de Control

1. Una vez que inicias sesión, verás el **Dashboard** o **Panel de Control**
2. En la parte superior, verás un menú con opciones
3. Haz clic en **"Cronjobs"** o **"Cron Jobs"** en el menú

### 2.2. Crear Nuevo Cron Job

1. **Haz clic en el botón "Create cronjob"** o **"Crear cron job"** (generalmente es un botón verde o azul)

2. Se abrirá un formulario con varios campos. Completa los siguientes:

---

## 📝 Paso 3: Configurar el Cron Job

### 3.1. Campo "Title" (Título)

**Valor a ingresar:**
```
Actualizar Cotización Dólar BROU
```

**Dónde está:** Primer campo del formulario, generalmente dice "Title" o "Título"

---

### 3.2. Campo "Address" (URL)

**Valor a ingresar:**
```
https://resto-system-pro-9ldp.vercel.app/api/cotizacion-dolar/actualizar
```

**Dónde está:** Campo que dice "Address", "URL", "Target URL" o "Dirección"

**⚠️ IMPORTANTE:** 
- Asegúrate de que la URL sea exactamente esta (copia y pega)
- Debe empezar con `https://`
- No debe tener espacios al final

---

### 3.3. Campo "Request Method" (Método de Solicitud)

**Valor a seleccionar:**
```
POST
```

**Dónde está:** Dropdown o selector que dice "Request Method", "Method" o "Método"

**Cómo hacerlo:**
1. Haz clic en el dropdown
2. Busca y selecciona **"POST"** (no GET, no PUT, debe ser POST)

---

### 3.4. Campo "Schedule" (Programación)

**Valor a ingresar:**
```
0 9,15 * * *
```

**Dónde está:** Campo que dice "Schedule", "Cron Expression", "Cron Schedule" o "Programación"

**Explicación del horario:**
- `0 9,15 * * *` significa: **9:00 AM y 3:00 PM todos los días**
- Formato: `minuto hora día mes día-semana`
- `0` = minuto 0 (en punto)
- `9,15` = horas 9 y 15 (9 AM y 3 PM)
- `* * *` = todos los días, todos los meses, todos los días de la semana

**⚠️ NOTA SOBRE ZONA HORARIA:**
- cron-job.org usa **UTC** (hora universal)
- Uruguay está en **UTC-3**
- Para que se ejecute a las 9 AM y 3 PM hora de Uruguay, usa: `0 12,18 * * *`
  - 12:00 UTC = 9:00 AM Uruguay
  - 18:00 UTC = 3:00 PM Uruguay

**O si prefieres usar hora local de cron-job.org:**
- Si cron-job.org te permite seleccionar zona horaria, selecciona "America/Montevideo" o "UTC-3"
- Y usa: `0 9,15 * * *`

---

### 3.5. Campo "Request Headers" (Encabezados)

**Valor a ingresar:**
```
Content-Type: application/json
```

**Dónde está:** Campo que dice "Request Headers", "Headers", "HTTP Headers" o "Encabezados"

**Cómo hacerlo:**
1. Si hay un botón "Add Header" o "Agregar Encabezado", haz clic
2. En el campo "Name" o "Nombre", escribe: `Content-Type`
3. En el campo "Value" o "Valor", escribe: `application/json`
4. Si no hay botón, escribe directamente: `Content-Type: application/json`

---

### 3.6. Campo "Request Body" (Cuerpo de la Solicitud)

**Valor a ingresar:**
```
{}
```

**Dónde está:** Campo que dice "Request Body", "Body", "Request Data" o "Cuerpo"

**Cómo hacerlo:**
- Escribe simplemente: `{}` (dos llaves vacías)
- Esto indica que no enviamos datos en el cuerpo, solo llamamos al endpoint

---

### 3.7. Campo "Status" (Estado)

**Valor a seleccionar:**
```
Enabled
```

**Dónde está:** Checkbox o toggle que dice "Enabled", "Active", "Activo" o "Habilitado"

**Cómo hacerlo:**
- Asegúrate de que esté **marcado** o **activado**
- Esto permite que el cron job se ejecute automáticamente

---

### 3.8. Otros Campos (Opcionales)

**Notification Email (Email de Notificación):**
- Opcional: Ingresa tu email si quieres recibir notificaciones cuando el cron job se ejecute
- Puedes dejarlo vacío si no quieres notificaciones

**Timeout (Tiempo de Espera):**
- Déjalo en el valor por defecto (generalmente 30 segundos)
- No es necesario cambiarlo

---

## 📝 Paso 4: Guardar el Cron Job

1. **Revisa todos los campos** que completaste:
   - ✅ Title: "Actualizar Cotización Dólar BROU"
   - ✅ Address: `https://resto-system-pro-9ldp.vercel.app/api/cotizacion-dolar/actualizar`
   - ✅ Request Method: POST
   - ✅ Schedule: `0 12,18 * * *` (o `0 9,15 * * *` si seleccionaste zona horaria)
   - ✅ Request Headers: `Content-Type: application/json`
   - ✅ Request Body: `{}`
   - ✅ Status: Enabled

2. **Haz clic en el botón "Save"** o **"Guardar"** (generalmente en la parte inferior del formulario)

3. **Espera la confirmación**: Deberías ver un mensaje de éxito como "Cron job created successfully" o "Cron job creado exitosamente"

---

## 📝 Paso 5: Verificar que Funciona

### 5.1. Verificar en cron-job.org

1. **Ve a la lista de cron jobs** (deberías ver tu nuevo cron job listado)

2. **Haz clic en tu cron job** para ver los detalles

3. **Busca la sección "Execution History"** o **"Historial de Ejecuciones"**

4. **Espera unos minutos** y luego recarga la página

5. **Deberías ver**:
   - Una entrada con estado "Success" o "Éxito" (verde)
   - La fecha y hora de la ejecución
   - El código de respuesta (debería ser 200)

### 5.2. Verificar en Vercel

1. **Ve a tu proyecto en Vercel**: https://vercel.com

2. **Haz clic en tu proyecto** → **"Logs"** o **"Registros"**

3. **Busca mensajes** que empiecen con `[ACTUALIZAR COTIZACION]`

4. **Deberías ver**:
   - `[ACTUALIZAR COTIZACION] Iniciando actualización de cotización y precios...`
   - `[ACTUALIZAR COTIZACION] Cotización obtenida: [número]`
   - `[ACTUALIZAR COTIZACION] Productos en dólares encontrados: [número]`
   - `[ACTUALIZAR COTIZACION] Productos actualizados: [número]`

### 5.3. Verificar en tu Aplicación

1. **Abre tu aplicación**: `https://resto-system-pro-9ldp.vercel.app`

2. **Ve al Dashboard**

3. **Mira la esquina superior derecha** donde se muestra la cotización del dólar

4. **La cotización debería actualizarse** automáticamente 2 veces al día

---

## 📝 Paso 6: Probar Manualmente (Opcional)

Si quieres probar que funciona antes de esperar a la hora programada:

1. **En cron-job.org**, ve a tu cron job

2. **Busca el botón "Run now"** o **"Ejecutar ahora"** (generalmente al lado del cron job)

3. **Haz clic en "Run now"**

4. **Espera unos segundos**

5. **Verifica en "Execution History"** que se ejecutó correctamente

6. **Verifica en Vercel Logs** que recibiste la solicitud

---

## 🔧 Configuración Avanzada (Opcional)

### Agregar Autenticación (Recomendado para Producción)

Si quieres proteger el endpoint para que solo el cron job pueda llamarlo:

1. **En Vercel**, ve a **Settings** → **Environment Variables**

2. **Agrega una nueva variable**:
   - **Name**: `COTIZACION_UPDATE_SECRET`
   - **Value**: Genera un valor aleatorio (ejemplo: `mi-secreto-super-seguro-123456`)
   - **Environments**: Production, Preview, Development

3. **En cron-job.org**, edita tu cron job

4. **En "Request Headers"**, agrega:
   ```
   Content-Type: application/json
   Authorization: Bearer mi-secreto-super-seguro-123456
   ```
   (Reemplaza `mi-secreto-super-seguro-123456` con el valor que configuraste en Vercel)

5. **Guarda los cambios**

---

## ❓ Troubleshooting (Solución de Problemas)

### El cron job no se ejecuta

**Problema:** No ves ejecuciones en el historial

**Soluciones:**
1. Verifica que el cron job esté **"Enabled"** o **"Activo"**
2. Verifica que el **Schedule** esté correcto
3. Verifica que la **URL** sea correcta (sin espacios, con https://)
4. Espera al menos 1 hora para ver la primera ejecución (si lo configuraste para ejecutarse en el futuro)

---

### El cron job se ejecuta pero da error

**Problema:** En "Execution History" ves estado "Failed" o "Error"

**Soluciones:**
1. **Verifica la URL**: Debe ser exactamente `https://resto-system-pro-9ldp.vercel.app/api/cotizacion-dolar/actualizar`
2. **Verifica el método**: Debe ser **POST**, no GET
3. **Verifica los headers**: Debe incluir `Content-Type: application/json`
4. **Revisa los logs de Vercel** para ver el error específico

---

### La cotización no se actualiza en la aplicación

**Problema:** El cron job se ejecuta pero la cotización no cambia

**Soluciones:**
1. **Verifica en Vercel Logs** que el endpoint recibió la solicitud
2. **Verifica que los campos de moneda existan** en la BD (ejecuta `/admin/add-currency-fields` si es necesario)
3. **Verifica que haya productos con moneda USD** para actualizar
4. **Recarga la página** del dashboard para ver la cotización actualizada

---

### Error 401 (No autorizado)

**Problema:** El cron job recibe error 401

**Soluciones:**
1. Si configuraste `COTIZACION_UPDATE_SECRET`, verifica que el header `Authorization` sea correcto
2. Si no configuraste el secret, el endpoint debería funcionar sin autenticación
3. Verifica que el endpoint no requiera autenticación de usuario (debería funcionar sin login)

---

## 📊 Resumen de Configuración

**Valores finales para copiar y pegar:**

```
Title: Actualizar Cotización Dólar BROU
Address: https://resto-system-pro-9ldp.vercel.app/api/cotizacion-dolar/actualizar
Request Method: POST
Schedule: 0 12,18 * * *
Request Headers: Content-Type: application/json
Request Body: {}
Status: Enabled
```

---

## ✅ Checklist Final

Antes de terminar, verifica que:

- [ ] Creaste la cuenta en cron-job.org
- [ ] Verificaste tu email
- [ ] Creaste el cron job con todos los campos correctos
- [ ] El cron job está "Enabled" o "Activo"
- [ ] Probaste ejecutarlo manualmente ("Run now")
- [ ] Verificaste en "Execution History" que se ejecutó correctamente
- [ ] Verificaste en Vercel Logs que recibiste la solicitud
- [ ] La cotización se actualiza en tu aplicación

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu sistema se actualizará automáticamente 2 veces al día sin necesidad de Vercel Pro.

**Próxima ejecución:** El cron job se ejecutará automáticamente a las 9 AM y 3 PM (hora de Uruguay) todos los días.

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa la sección "Troubleshooting" arriba
2. Verifica los logs de Vercel para ver errores específicos
3. Verifica el "Execution History" en cron-job.org para ver el estado de las ejecuciones
