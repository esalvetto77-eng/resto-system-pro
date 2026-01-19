// API Route para subir documentos de empleados
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Determinar tipo de archivo
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    let tipo = 'OTRO'
    if (['pdf'].includes(extension)) tipo = 'PDF'
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) tipo = 'IMAGEN'

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const nombreArchivo = `${params.id}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const rutaArchivo = join(process.cwd(), 'public', 'uploads', 'documentos', nombreArchivo)

    // Guardar archivo en carpeta public
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(rutaArchivo, buffer)

    // Guardar en base de datos
    const documento = await prisma.documentoEmpleado.create({
      data: {
        empleadoId: params.id,
        nombre: nombre,
        tipo: tipo,
        ruta: `/uploads/documentos/${nombreArchivo}`,
        descripcion: descripcion || null,
      },
    })

    return NextResponse.json(documento, { status: 201 })
  } catch (error) {
    console.error('Error al subir documento:', error)
    return NextResponse.json(
      { error: 'Error al subir documento' },
      { status: 500 }
    )
  }
}
