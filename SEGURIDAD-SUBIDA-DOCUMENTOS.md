# 🔐 Seguridad de Subida de Documentos

## Resumen

El sistema de subida de documentos para empleados está protegido con **múltiples capas de seguridad** para garantizar que solo archivos seguros y autorizados puedan ser subidos y accedidos.

## Capas de Seguridad Implementadas

### 1. 🔑 Autenticación y Autorización

**Protección**: Solo usuarios autenticados pueden subir y ver documentos.

- ✅ Verificación de sesión en cada request
- ✅ Validación de usuario activo desde base de datos
- ✅ Bloqueo automático de usuarios no autenticados
- ✅ Logs de acceso para auditoría

**Código de error**: `401 Unauthorized` si no hay sesión válida

---

### 2. 📏 Validación de Tamaño

**Protección**: Límite de tamaño para prevenir ataques DoS y sobrecarga del servidor.

- ✅ **Tamaño máximo**: 10MB por archivo
- ✅ Validación de archivos vacíos
- ✅ Rechazo automático de archivos que excedan el límite

**Código de error**: `400 Bad Request` si el archivo es demasiado grande

---

### 3. 📄 Validación de Tipos de Archivo

**Protección**: Solo tipos de archivo seguros y permitidos pueden ser subidos.

**Tipos permitidos**:
- ✅ PDF (`.pdf`)
- ✅ Imágenes: JPG, JPEG, PNG, GIF, WEBP

**Validaciones implementadas**:
- ✅ Validación de extensión del archivo
- ✅ Validación de MIME type (tipo real del archivo)
- ✅ Validación de magic bytes (firma del archivo)

**Código de error**: `400 Bad Request` si el tipo no está permitido

---

### 4. 🛡️ Validación de Magic Bytes

**Protección**: Detecta archivos maliciosos disfrazados con extensiones falsas.

**Cómo funciona**:
- Lee los primeros bytes del archivo (firma del archivo)
- Compara con las firmas conocidas de tipos seguros
- Rechaza archivos que no coincidan con su extensión

**Ejemplo de protección**:
- ❌ Un archivo `.exe` renombrado como `.pdf` será rechazado
- ❌ Un script malicioso con extensión `.jpg` será detectado
- ✅ Solo archivos con firmas válidas son aceptados

**Código de error**: `400 Bad Request` si la firma no coincide

---

### 5. 🧹 Sanitización de Datos

**Protección**: Previene inyección de código y caracteres peligrosos.

**Sanitizaciones aplicadas**:
- ✅ Nombres de archivo: Solo caracteres alfanuméricos, guiones, puntos y espacios
- ✅ Longitud máxima de nombres: 100 caracteres
- ✅ Descripciones limitadas a 500 caracteres
- ✅ Remoción de caracteres especiales peligrosos

**Ejemplo**:
```
Entrada:  "documento<script>.pdf"
Salida:   "documento_script_.pdf"
```

---

### 6. ✅ Validación de Empleado

**Protección**: Verifica que el empleado existe antes de asociar documentos.

- ✅ Verificación de existencia del empleado en base de datos
- ✅ Validación de ID de empleado válido
- ✅ Prevención de asociación a empleados inexistentes

**Código de error**: `404 Not Found` si el empleado no existe

---

### 7. 📊 Auditoría y Logging

**Protección**: Registro de todas las operaciones para auditoría y detección de problemas.

**Información registrada**:
- ✅ ID del documento subido
- ✅ ID del empleado
- ✅ Tipo de archivo
- ✅ Tamaño del archivo
- ✅ ID del usuario que subió
- ✅ Timestamp de la operación
- ✅ Accesos a documentos

**Uso**:
- Detección de patrones sospechosos
- Auditoría de accesos
- Investigación de incidentes
- Cumplimiento de regulaciones

---

### 8. ☁️ Almacenamiento Seguro

**Protección**: Archivos almacenados en infraestructura segura de Vercel.

**Características**:
- ✅ Vercel Blob Storage (infraestructura enterprise)
- ✅ Sin acceso directo al sistema de archivos del servidor
- ✅ URLs públicas pero protegidas por autenticación
- ✅ Backups automáticos de Vercel
- ✅ Redundancia y alta disponibilidad

---

## Flujo de Seguridad Completo

```
1. Usuario intenta subir archivo
   ↓
2. ✅ Verificación de autenticación
   ↓
3. ✅ Validación de empleado existe
   ↓
4. ✅ Validación de tamaño (max 10MB)
   ↓
5. ✅ Validación de extensión permitida
   ↓
6. ✅ Validación de MIME type
   ↓
7. ✅ Validación de magic bytes (firma)
   ↓
8. ✅ Sanitización de nombres
   ↓
9. ✅ Subida a Vercel Blob Storage
   ↓
10. ✅ Guardado en base de datos
   ↓
11. ✅ Log de auditoría
   ↓
12. ✅ Respuesta exitosa
```

---

## Protección contra Ataques Comunes

### ✅ Ataques Prevenidos

1. **Archivos Maliciosos**
   - Magic bytes detectan archivos disfrazados
   - Validación estricta de tipos
   - Solo tipos seguros permitidos

2. **Ataques DoS (Denial of Service)**
   - Límite de tamaño (10MB)
   - Validación de archivos vacíos
   - Rechazo rápido de archivos inválidos

3. **Inyección de Código**
   - Sanitización de nombres
   - Validación de caracteres
   - Sin ejecución de código del cliente

4. **Acceso No Autorizado**
   - Autenticación requerida
   - Validación de sesión
   - Logs de acceso

5. **Manipulación de Datos**
   - Validación de empleado existe
   - Validación de campos requeridos
   - Sanitización de inputs

---

## Configuración Recomendada

### Variables de Entorno

Asegúrate de tener configurado:
- ✅ `BLOB_READ_WRITE_TOKEN` - Token de Vercel Blob Storage
- ✅ `DATABASE_URL` - URL de conexión a base de datos
- ✅ `SESSION_SECRET` - Secreto para firmar sesiones

### Límites Actuales

- **Tamaño máximo**: 10MB por archivo
- **Tipos permitidos**: PDF, JPG, JPEG, PNG, GIF, WEBP
- **Longitud nombre**: 100 caracteres máximo
- **Longitud descripción**: 500 caracteres máximo

### Ajustar Límites

Si necesitas cambiar los límites, edita:
```typescript
// src/app/api/empleados/[id]/documentos/upload/route.ts
const MAX_FILE_SIZE = 10 * 1024 * 1024 // Cambiar aquí
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', ...] // Agregar tipos aquí
```

---

## Monitoreo y Alertas

### Logs a Revisar

1. **Logs de Vercel**: Revisar intentos fallidos de subida
2. **Logs de aplicación**: Buscar patrones sospechosos
3. **Métricas de uso**: Monitorear tamaño y cantidad de archivos

### Señales de Alerta

- ⚠️ Múltiples intentos fallidos desde la misma IP
- ⚠️ Archivos rechazados por magic bytes
- ⚠️ Intentos de subir tipos no permitidos
- ⚠️ Archivos que exceden el límite de tamaño

---

## Cumplimiento y Regulaciones

### ✅ Características de Cumplimiento

- **Auditoría**: Logs completos de todas las operaciones
- **Autenticación**: Control de acceso estricto
- **Validación**: Múltiples capas de verificación
- **Sanitización**: Prevención de inyección de código
- **Almacenamiento seguro**: Infraestructura enterprise de Vercel

### 📋 Recomendaciones Adicionales

1. **Backups regulares**: Vercel hace backups automáticos
2. **Revisión de logs**: Revisar logs periódicamente
3. **Actualizaciones**: Mantener dependencias actualizadas
4. **Monitoreo**: Configurar alertas para actividad sospechosa

---

## Resumen de Seguridad

| Capa | Protección | Estado |
|------|------------|--------|
| Autenticación | Solo usuarios autenticados | ✅ Implementado |
| Validación de tamaño | Máximo 10MB | ✅ Implementado |
| Validación de tipos | Solo tipos seguros | ✅ Implementado |
| Magic bytes | Detección de archivos maliciosos | ✅ Implementado |
| Sanitización | Caracteres peligrosos removidos | ✅ Implementado |
| Validación de empleado | Empleado debe existir | ✅ Implementado |
| Auditoría | Logs completos | ✅ Implementado |
| Almacenamiento seguro | Vercel Blob Storage | ✅ Implementado |

**Nivel de seguridad**: ⭐⭐⭐⭐⭐ (Muy Alto)

---

## Soporte

Si encuentras algún problema de seguridad o necesitas reportar una vulnerabilidad, revisa los logs de Vercel y contacta al administrador del sistema.
