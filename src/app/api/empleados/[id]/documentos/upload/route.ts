// API Route para subir documentos de empleados
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configuración de seguridad
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB máximo
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

// Magic bytes para validación de tipos de archivo
const FILE_SIGNATURES: Record<string, Uint8Array[]> = {
  pdf: [new Uint8Array([0x25, 0x50, 0x44, 0x46])], // %PDF
  jpg: [
    new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), // JPEG
    new Uint8Array([0xff, 0xd8, 0xff, 0xe1]), // JPEG EXIF
    new Uint8Array([0xff, 0xd8, 0xff, 0xdb]), // JPEG
  ],
  png: [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], // PNG
  gif: [
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), // GIF89a
  ],
  webp: [new Uint8Array([0x52, 0x49, 0x46, 0x46])], // RIFF (WebP)
}

// Validar magic bytes del archivo
async function validateFileSignature(
  file: File,
  extension: string
): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer.slice(0, 12)) // Leer primeros 12 bytes

    const signatures = FILE_SIGNATURES[extension]
    if (!signatures) {
      console.warn('[VALIDACIÓN] No hay firmas definidas para extensión:', extension)
      return false
    }

    const isValid = signatures.some((signature) => {
      if (bytes.length < signature.length) return false
      return signature.every((byte, index) => bytes[index] === byte)
    })

    if (!isValid) {
      console.warn('[VALIDACIÓN] Firma no válida:', {
        extension,
        fileName: file.name,
        firstBytes: Array.from(bytes.slice(0, 8)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '),
        expectedSignatures: signatures.map(sig => Array.from(sig.slice(0, 4)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ')),
      })
    }

    return isValid
  } catch (error) {
    console.error('[ERROR] Error al validar firma del archivo:', error)
    return false
  }
}

// Sanitizar nombre de archivo
function sanitizeFileName(fileName: string): string {
  // Remover caracteres peligrosos y mantener solo alfanuméricos, guiones, puntos y espacios
  return fileName
    .replace(/[^a-zA-Z0-9._\s-]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100) // Limitar longitud
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. AUTENTICACIÓN: Verificar que el usuario esté autenticado
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 2. VALIDAR EMPLEADO: Verificar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // 3. VALIDAR DATOS DEL FORMULARIO
    const formData = await request.formData()
    const file = formData.get('file') as File
    const nombre = formData.get('nombre') as string
    const descripcion = formData.get('descripcion') as string | null

    if (!file || !nombre) {
      return NextResponse.json(
        { error: 'Archivo y nombre son requeridos' },
        { status: 400 }
      )
    }

    // 4. VALIDAR TAMAÑO DEL ARCHIVO
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío' },
        { status: 400 }
      )
    }

    // 5. VALIDAR EXTENSIÓN DEL ARCHIVO
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          error: `Tipo de archivo no permitido. Extensiones permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 6. VALIDAR MIME TYPE (más flexible - algunos navegadores no reportan MIME type correctamente)
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      console.warn('[ADVERTENCIA] MIME type no está en la lista permitida:', file.type)
      // No rechazamos si el MIME type no está en la lista, pero validamos magic bytes
    }

    // 7. VALIDAR MAGIC BYTES (firma del archivo) - Protección contra archivos maliciosos
    // Esta es la validación más importante, pero la hacemos más flexible para JPG
    const isValidSignature = await validateFileSignature(file, extension)
    if (!isValidSignature) {
      // Para JPG, ser más flexible ya que algunos archivos pueden tener variaciones
      if (extension === 'jpg' || extension === 'jpeg') {
        console.warn('[ADVERTENCIA] Firma JPG no estándar, pero permitiendo:', {
          extension,
          fileName: file.name,
          mimeType: file.type,
        })
        // Permitir JPG aunque la firma no sea exacta (algunos archivos tienen variaciones)
      } else {
        console.error('[SEGURIDAD] Archivo rechazado - firma no válida:', {
          extension,
          fileName: file.name,
          mimeType: file.type,
        })
        return NextResponse.json(
          {
            error: 'El archivo no coincide con su extensión. Por favor, verifica que el archivo sea válido.',
          },
          { status: 400 }
        )
      }
    }

    // 8. SANITIZAR NOMBRES
    const nombreSanitizado = sanitizeFileName(nombre)
    if (!nombreSanitizado || nombreSanitizado.length < 1) {
      return NextResponse.json(
        { error: 'El nombre del documento no es válido' },
        { status: 400 }
      )
    }

    // 9. DETERMINAR TIPO DE DOCUMENTO
    let tipo = 'OTRO'
    if (extension === 'pdf') tipo = 'PDF'
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension))
      tipo = 'IMAGEN'

    // 10. GENERAR NOMBRE ÚNICO Y SEGURO PARA EL ARCHIVO
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const nombreArchivoSanitizado = sanitizeFileName(file.name)
    const nombreArchivo = `${params.id}_${timestamp}_${randomSuffix}_${nombreArchivoSanitizado}`
    const rutaBlob = `documentos-empleados/${nombreArchivo}`

    // 11. SUBIR ARCHIVO A VERCEL BLOB STORAGE
    // Verificar que el token esté configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[ERROR] BLOB_READ_WRITE_TOKEN no está configurado')
      return NextResponse.json(
        {
          error: 'Error de configuración del servidor. Por favor, contacta al administrador.',
        },
        { status: 500 }
      )
    }

    let blob
    try {
      blob = await put(rutaBlob, file, {
        access: 'public',
        contentType: file.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      })
    } catch (blobError: any) {
      console.error('[ERROR] Error al subir a Vercel Blob:', {
        error: blobError?.message || String(blobError),
        code: blobError?.code,
        status: blobError?.status,
        stack: blobError?.stack,
      })

      // Mensajes de error más específicos
      if (
        blobError?.message?.includes('token') ||
        blobError?.message?.includes('unauthorized') ||
        blobError?.message?.includes('401')
      ) {
        return NextResponse.json(
          {
            error: 'Error de autenticación con el servicio de almacenamiento. Verifica que BLOB_READ_WRITE_TOKEN esté configurado en Vercel.',
          },
          { status: 500 }
        )
      }

      if (blobError?.message?.includes('size') || blobError?.message?.includes('too large')) {
        return NextResponse.json(
          {
            error: 'El archivo es demasiado grande para el servicio de almacenamiento.',
          },
          { status: 400 }
        )
      }

      // Re-lanzar para que se capture en el catch general con más contexto
      throw new Error(`Error al subir archivo: ${blobError?.message || String(blobError)}`)
    }

    // 12. GUARDAR EN BASE DE DATOS CON INFORMACIÓN DE AUDITORÍA
    const documento = await prisma.documentoEmpleado.create({
      data: {
        empleadoId: params.id,
        nombre: nombreSanitizado,
        tipo: tipo,
        ruta: blob.url,
        descripcion: descripcion ? descripcion.substring(0, 500) : null, // Limitar descripción
      },
    })

    // Log de seguridad (sin información sensible)
    console.log('[SEGURIDAD] Documento subido exitosamente:', {
      documentoId: documento.id,
      empleadoId: params.id,
      tipo: tipo,
      tamaño: file.size,
      usuarioId: user.id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(documento, { status: 201 })
  } catch (error: any) {
    console.error('[ERROR] Error al subir documento:', {
      error: error?.message || String(error),
      stack: error?.stack,
      empleadoId: params.id,
      timestamp: new Date().toISOString(),
    })

    // Mensajes de error más específicos basados en el tipo de error
    let errorMessage = 'Error al subir documento. Por favor, intenta nuevamente.'
    
    if (error?.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      errorMessage = 'Error de configuración: BLOB_READ_WRITE_TOKEN no está configurado en Vercel. Contacta al administrador.'
    } else if (error?.message?.includes('token') || error?.message?.includes('unauthorized')) {
      errorMessage = 'Error de autenticación con el servicio de almacenamiento. Verifica la configuración en Vercel.'
    } else if (error?.message) {
      // Si el error tiene un mensaje específico, usarlo
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
