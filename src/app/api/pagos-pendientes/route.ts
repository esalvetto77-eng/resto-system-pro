// API Route para gestionar pagos pendientes a proveedores
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { sanitizeString, sanitizeNumber, validateLength, isValidDate } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar pagos pendientes
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden ver pagos pendientes.' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const proveedorId = searchParams.get('proveedorId')
    const soloPendientes = searchParams.get('soloPendientes') === 'true'
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: any = {}

    if (proveedorId) {
      where.proveedorId = proveedorId
    }

    if (soloPendientes) {
      where.pagado = false
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        const fechaHastaDate = new Date(fechaHasta)
        fechaHastaDate.setHours(23, 59, 59, 999)
        where.fecha.lte = fechaHastaDate
      }
    }

    const pagos = await prisma.pagoPendiente.findMany({
      where,
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: [
        { pagado: 'asc' }, // Pendientes primero
        { fecha: 'asc' },
      ],
    })

    return NextResponse.json(pagos)
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error)
    return NextResponse.json(
      { error: 'Error al obtener pagos pendientes' },
      { status: 500 }
    )
  }
}

// POST: Crear nuevo pago pendiente
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear pagos pendientes.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    let { proveedorId, fecha, monto, descripcion, observaciones } = body

    // Validaciones
    if (!proveedorId || !fecha || monto === undefined || monto === null) {
      return NextResponse.json(
        { error: 'Proveedor, fecha y monto son requeridos' },
        { status: 400 }
      )
    }

    // Sanitizar
    descripcion = descripcion ? sanitizeString(descripcion) : null
    observaciones = observaciones ? sanitizeString(observaciones) : null
    monto = sanitizeNumber(monto)

    if (monto === null || monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (descripcion && !validateLength(descripcion, 1, 500)) {
      return NextResponse.json(
        { error: 'La descripción es muy larga' },
        { status: 400 }
      )
    }

    // Validar fecha
    const fechaDate = new Date(fecha)
    if (!isValidDate(fechaDate)) {
      return NextResponse.json(
        { error: 'Fecha inválida' },
        { status: 400 }
      )
    }

    // Verificar que el proveedor existe
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

    // Crear pago pendiente
    const pago = await prisma.pagoPendiente.create({
      data: {
        proveedorId,
        fecha: fechaDate,
        monto,
        descripcion,
        observaciones,
        pagado: false,
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(pago, { status: 201 })
  } catch (error) {
    console.error('Error al crear pago pendiente:', error)
    return NextResponse.json(
      { error: 'Error al crear pago pendiente' },
      { status: 500 }
    )
  }
}
