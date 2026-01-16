// API Route para documentos de empleados
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Listar documentos de un empleado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentos = await prisma.documentoEmpleado.findMany({
      where: { empleadoId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documentos)
  } catch (error) {
    console.error('Error al obtener documentos:', error)
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    )
  }
}

// POST: Crear un nuevo documento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const documento = await prisma.documentoEmpleado.create({
      data: {
        empleadoId: params.id,
        nombre: body.nombre,
        tipo: body.tipo,
        ruta: body.ruta,
        descripcion: body.descripcion || null,
      },
    })

    return NextResponse.json(documento, { status: 201 })
  } catch (error) {
    console.error('Error al crear documento:', error)
    return NextResponse.json(
      { error: 'Error al crear documento' },
      { status: 500 }
    )
  }
}
