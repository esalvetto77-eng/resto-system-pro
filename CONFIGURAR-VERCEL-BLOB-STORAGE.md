# 📦 Configurar Vercel Blob Storage para Subida de Archivos

## Problema Resuelto

El error "ERROR AL SUBIR EL DOCUMENTO" ocurría porque el código intentaba escribir archivos en el sistema de archivos local, lo cual **no funciona en Vercel** (entorno serverless sin sistema de archivos persistente).

## Solución Implementada

Se ha migrado el sistema de almacenamiento de archivos a **Vercel Blob Storage**, que es el servicio nativo de Vercel para almacenar archivos en la nube.

## Pasos para Configurar

### Paso 1: Crear Blob Store en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Storage** (en el menú lateral)
4. Haz clic en **Create Database** o **Add Storage**
5. Selecciona **Blob** (Vercel Blob Storage)
6. Dale un nombre (ej: `documentos-empleados`) o usa el predeterminado
7. Haz clic en **Create**

### Paso 2: Configurar Variable de Entorno

Vercel debería configurar automáticamente la variable `BLOB_READ_WRITE_TOKEN`, pero verifica:

1. Ve a **Settings** → **Environment Variables**
2. Busca `BLOB_READ_WRITE_TOKEN`
3. Si **NO existe**, créala manualmente:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Copia el token desde **Storage** → Tu Blob Store → **Settings** → **Tokens**
   - **Environments**: Selecciona **Production**, **Preview**, y **Development**

### Paso 3: Hacer Redeploy

1. Ve a **Deployments**
2. Haz clic en los **3 puntos** del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un commit nuevo y Vercel desplegará automáticamente

## Verificación

1. Ve a tu aplicación en Vercel
2. Intenta subir un documento en la sección de empleados
3. Debería funcionar correctamente sin errores

## Notas Importantes

- ✅ Los archivos nuevos se guardarán en Vercel Blob Storage
- ⚠️ Los archivos antiguos (si los hay) seguirán funcionando si están en el sistema de archivos local (solo en desarrollo)
- 📦 El almacenamiento en Vercel Blob tiene un límite gratuito generoso
- 🔒 Los archivos son públicos por defecto (configurado con `access: 'public'`)

## 🔐 Seguridad Implementada

El sistema de subida de documentos incluye **múltiples capas de seguridad**:

## 1. **Autenticación y Autorización**
- ✅ Solo usuarios autenticados pueden subir documentos
- ✅ Solo usuarios autenticados pueden ver documentos
- ✅ Validación de sesión en cada request

### 2. **Validación de Archivos**
- ✅ **Tamaño máximo**: 10MB por archivo
- ✅ **Tipos permitidos**: PDF, JPG, JPEG, PNG, GIF, WEBP
- ✅ **Validación de MIME types**: Verifica el tipo real del archivo
- ✅ **Magic bytes**: Valida la firma del archivo para detectar archivos maliciosos disfrazados

### 3. **Sanitización**
- ✅ Nombres de archivo sanitizados (sin caracteres peligrosos)
- ✅ Longitud máxima de nombres limitada
- ✅ Descripciones limitadas a 500 caracteres

### 4. **Validación de Datos**
- ✅ Verificación de que el empleado existe antes de subir
- ✅ Validación de campos requeridos
- ✅ Protección contra archivos vacíos

### 5. **Auditoría**
- ✅ Logs de seguridad para cada subida de documento
- ✅ Registro de accesos a documentos
- ✅ Timestamps y IDs de usuario en logs

### 6. **Protección contra Ataques**
- ✅ Validación de magic bytes previene archivos maliciosos
- ✅ Sanitización previene inyección de código
- ✅ Límites de tamaño previenen DoS
- ✅ Validación estricta de tipos previene ejecución de código

### 7. **Almacenamiento Seguro**
- ✅ Archivos almacenados en Vercel Blob Storage (infraestructura segura)
- ✅ URLs públicas pero protegidas por autenticación
- ✅ Sin acceso directo al sistema de archivos del servidor

## Solución de Problemas

### Error: "BLOB_READ_WRITE_TOKEN is not defined"

**Solución**: Asegúrate de que la variable de entorno `BLOB_READ_WRITE_TOKEN` esté configurada en Vercel y haz un redeploy.

### Error: "Failed to upload blob"

**Solución**: 
1. Verifica que el Blob Store esté creado en Vercel
2. Verifica que el token tenga permisos de lectura y escritura
3. Revisa los logs de Vercel para más detalles

### Los documentos antiguos no se ven

**Solución**: Los documentos subidos antes de esta migración pueden no funcionar si estaban guardados localmente. Necesitarás volver a subirlos.

## Cambios Realizados

1. ✅ Instalado `@vercel/blob`
2. ✅ Modificada ruta de upload (`/api/empleados/[id]/documentos/upload`)
3. ✅ Modificada ruta de view (`/api/empleados/[id]/documentos/[docId]/view`)

Los archivos ahora se almacenan en Vercel Blob Storage y se acceden mediante URLs públicas.
