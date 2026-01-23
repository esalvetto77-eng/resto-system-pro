// API Route para ver documentos de empleados
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    // 1. AUTENTICACIÓN: Verificar que el usuario esté autenticado
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para ver documentos.' },
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

    // 3. Obtener el documento de la base de datos
    const documento = await prisma.documentoEmpleado.findFirst({
      where: {
        id: params.docId,
        empleadoId: params.id,
      },
    })

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      )
    }

    // 4. Si la ruta es una URL (de Vercel Blob), redirigir directamente
    if (documento.ruta.startsWith('http://') || documento.ruta.startsWith('https://')) {
      // Log de acceso (sin información sensible)
      console.log('[SEGURIDAD] Acceso a documento:', {
        documentoId: documento.id,
        empleadoId: params.id,
        usuarioId: user.id,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.redirect(documento.ruta)
    }

    // Si es una ruta local antigua (para compatibilidad con documentos existentes)
    // Intentar servir desde el sistema de archivos (solo funcionará en desarrollo)
    try {
      const { readFile } = await import('fs/promises')
      const { join } = await import('path')
      const rutaCompleta = join(process.cwd(), 'public', documento.ruta)
      const fileBuffer = await readFile(rutaCompleta)
      
      // Determinar Content-Type según el tipo de archivo
      let contentType = 'application/octet-stream'
      const extension = documento.ruta.split('.').pop()?.toLowerCase()
      
      if (extension === 'pdf') {
        contentType = 'application/pdf'
      } else if (['jpg', 'jpeg'].includes(extension || '')) {
        contentType = 'image/jpeg'
      } else if (extension === 'png') {
        contentType = 'image/png'
      } else if (extension === 'gif') {
        contentType = 'image/gif'
      } else if (extension === 'webp') {
        contentType = 'image/webp'
      }

      // Retornar el archivo con los headers correctos para visualización
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${documento.nombre}"`,
        },
      })
    } catch (fileError) {
      console.error('Error al leer archivo local:', fileError)
      return NextResponse.json(
        { error: 'Error al leer el archivo. El documento puede haber sido migrado a almacenamiento en la nube.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error al obtener documento:', error)
    return NextResponse.json(
      { error: 'Error al obtener documento' },
      { status: 500 }
    )
  }
}
