// API Route para ver documentos de empleados
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    // Obtener el documento de la base de datos
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

    // Leer el archivo del sistema de archivos
    const rutaCompleta = join(process.cwd(), 'public', documento.ruta)
    
    try {
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
      console.error('Error al leer archivo:', fileError)
      return NextResponse.json(
        { error: 'Error al leer el archivo' },
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
