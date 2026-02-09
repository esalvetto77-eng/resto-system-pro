// API Route para gestionar proveedores de un producto
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener todos los proveedores de un producto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proveedores = await prisma.productoProveedor.findMany({
      where: { productoId: params.id },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            contacto: true,
            telefono: true,
          },
        },
      },
      orderBy: {
        ordenPreferencia: 'asc',
      },
    })

    return NextResponse.json(proveedores)
  } catch (error) {
    console.error('Error al obtener proveedores del producto:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedores del producto' },
      { status: 500 }
    )
  }
}

// POST: Agregar un proveedor a un producto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { id: params.id },
    })
    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: body.proveedorId },
      select: { id: true }, // Solo seleccionar el id para evitar errores con columnas que no existen
    })
    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no existe ya esta relación
    const existe = await prisma.productoProveedor.findUnique({
      where: {
        productoId_proveedorId: {
          productoId: params.id,
          proveedorId: body.proveedorId,
        },
      },
    })
    if (existe) {
      return NextResponse.json(
        { error: 'Este proveedor ya está asociado al producto' },
        { status: 400 }
      )
    }

    // Obtener el siguiente orden de preferencia
    const maxOrden = await prisma.productoProveedor.findFirst({
      where: { productoId: params.id },
      orderBy: { ordenPreferencia: 'desc' },
      select: { ordenPreferencia: true },
    })
    const siguienteOrden = (maxOrden?.ordenPreferencia || 0) + 1

    // Crear la relación
    const productoProveedor = await prisma.productoProveedor.create({
      data: {
        productoId: params.id,
        proveedorId: body.proveedorId,
        precioCompra: body.precioCompra || null,
        ordenPreferencia: body.ordenPreferencia || siguienteOrden,
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            contacto: true,
            telefono: true,
          },
        },
      },
    })

    return NextResponse.json(productoProveedor, { status: 201 })
  } catch (error) {
    console.error('Error al agregar proveedor al producto:', error)
    return NextResponse.json(
      { error: 'Error al agregar proveedor al producto' },
      { status: 500 }
    )
  }
}
