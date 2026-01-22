// API Route para operaciones individuales de pagos pendientes
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { sanitizeString, sanitizeNumber, validateLength, isValidDate } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener un pago pendiente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const pago = await prisma.pagoPendiente.findUnique({
      where: { id: params.id },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            contacto: true,
            telefono: true,
            email: true,
          },
        },
      },
    })

    if (!pago) {
      return NextResponse.json(
        { error: 'Pago pendiente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(pago)
  } catch (error) {
    console.error('Error al obtener pago pendiente:', error)
    return NextResponse.json(
      { error: 'Error al obtener pago pendiente' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un pago pendiente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    let { proveedorId, fecha, monto, descripcion, observaciones, pagado, fechaPago } = body

    // Verificar que el pago existe
    const pagoExistente = await prisma.pagoPendiente.findUnique({
      where: { id: params.id },
    })

    if (!pagoExistente) {
      return NextResponse.json(
        { error: 'Pago pendiente no encontrado' },
        { status: 404 }
      )
    }

    // Validaciones
    if (proveedorId) {
      const proveedor = await prisma.proveedor.findUnique({
        where: { id: proveedorId },
        select: { id: true, activo: true },
      })

      if (!proveedor || !proveedor.activo) {
        return NextResponse.json(
          { error: 'Proveedor no encontrado o inactivo' },
          { status: 404 }
        )
      }
    }

    // Sanitizar
    if (descripcion !== undefined) {
      descripcion = descripcion ? sanitizeString(descripcion) : null
      if (descripcion && !validateLength(descripcion, 1, 500)) {
        return NextResponse.json(
          { error: 'La descripción es muy larga' },
          { status: 400 }
        )
      }
    }

    if (observaciones !== undefined) {
      observaciones = observaciones ? sanitizeString(observaciones) : null
    }

    if (monto !== undefined) {
      monto = sanitizeNumber(monto)
      if (monto === null || monto <= 0) {
        return NextResponse.json(
          { error: 'El monto debe ser mayor a 0' },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: any = {}

    if (proveedorId) updateData.proveedorId = proveedorId
    if (fecha) {
      const fechaDate = new Date(fecha)
      if (!isValidDate(fechaDate)) {
        return NextResponse.json(
          { error: 'Fecha inválida' },
          { status: 400 }
        )
      }
      updateData.fecha = fechaDate
    }
    if (monto !== undefined) updateData.monto = monto
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (observaciones !== undefined) updateData.observaciones = observaciones

    // Manejar marcado como pagado
    if (pagado !== undefined) {
      updateData.pagado = pagado
      if (pagado) {
        updateData.fechaPago = fechaPago ? new Date(fechaPago) : new Date()
      } else {
        updateData.fechaPago = null
      }
    }

    // Actualizar
    const pago = await prisma.pagoPendiente.update({
      where: { id: params.id },
      data: updateData,
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(pago)
  } catch (error) {
    console.error('Error al actualizar pago pendiente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar pago pendiente' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un pago pendiente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    await prisma.pagoPendiente.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Pago pendiente eliminado' })
  } catch (error) {
    console.error('Error al eliminar pago pendiente:', error)
    return NextResponse.json(
      { error: 'Error al eliminar pago pendiente' },
      { status: 500 }
    )
    }
}
