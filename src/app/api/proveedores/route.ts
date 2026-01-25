// API Route para Proveedores - Versión simplificada
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar todos los proveedores
export async function GET() {
  try {
    // Intentar obtener proveedores con select explícito para evitar errores si el campo comentario no existe
    let proveedores
    try {
      proveedores = await prisma.proveedor.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          contacto: true,
          telefono: true,
          email: true,
          direccion: true,
          diasPedido: true,
          horarioPedido: true,
          diasEntrega: true,
          activo: true,
          rubro: true,
          minimoCompra: true,
          metodoPago: true,
          createdAt: true,
          updatedAt: true,
          // Intentar incluir comentario, pero no fallar si no existe
        },
      })
      
      // Si el campo comentario existe, intentar leerlo con una consulta raw
      try {
        const proveedoresConComentario = await prisma.$queryRawUnsafe<Array<{id: string, comentario: string | null}>>(
          `SELECT id, comentario FROM proveedores WHERE activo = true ORDER BY nombre ASC`
        )
        
        // Mapear comentarios a los proveedores
        const comentariosMap = new Map(proveedoresConComentario.map(p => [p.id, p.comentario]))
        proveedores = proveedores.map(p => ({
          ...p,
          comentario: comentariosMap.get(p.id) || null,
        }))
      } catch (comentarioError: any) {
        // Si el campo comentario no existe, simplemente agregar null
        console.log('[API PROVEEDORES] Campo comentario no existe aún, usando null')
        proveedores = proveedores.map(p => ({
          ...p,
          comentario: null,
        }))
      }
    } catch (selectError: any) {
      // Si falla el select, intentar sin select (incluir todos los campos)
      console.log('[API PROVEEDORES] Error con select, intentando sin select:', selectError?.message)
      proveedores = await prisma.proveedor.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      })
    }
    
    return NextResponse.json(proveedores)
  } catch (error: any) {
    console.error('Error en GET /api/proveedores:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    return NextResponse.json([])
  }
}

// POST: Crear un nuevo proveedor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar que el nombre esté presente
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    if (!body.diasPedido || (typeof body.diasPedido !== 'string' && !Array.isArray(body.diasPedido))) {
      return NextResponse.json(
        { error: 'Los días de pedido son requeridos' },
        { status: 400 }
      )
    }

    if (!body.diasEntrega || (typeof body.diasEntrega !== 'string' && !Array.isArray(body.diasEntrega))) {
      return NextResponse.json(
        { error: 'Los días de entrega son requeridos' },
        { status: 400 }
      )
    }

    const toStringOrNull = (value: unknown): string | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'string') return value.trim() || null
      return null
    }

    // Manejar diasPedido y diasEntrega (pueden venir como string JSON o array)
    const handleDiasField = (value: unknown): string => {
      if (value === null || value === undefined) return JSON.stringify([])
      if (typeof value === 'string') {
        // Si ya es un string JSON válido, devolverlo
        try {
          JSON.parse(value)
          return value
        } catch {
          // Si no es JSON válido, tratarlo como string vacío y devolver array vacío
          return JSON.stringify([])
        }
      }
      if (Array.isArray(value)) {
        return JSON.stringify(value)
      }
      return JSON.stringify([])
    }

    // Manejar minimoCompra
    const toNumberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return isNaN(parsed) ? null : parsed
      }
      return null
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        nombre: body.nombre.trim(),
        contacto: toStringOrNull(body.contacto),
        telefono: toStringOrNull(body.telefono),
        email: toStringOrNull(body.email),
        direccion: toStringOrNull(body.direccion),
        rubro: toStringOrNull(body.rubro),
        minimoCompra: toNumberOrNull(body.minimoCompra),
        metodoPago: toStringOrNull(body.metodoPago),
        comentario: toStringOrNull(body.comentario),
        diasPedido: handleDiasField(body.diasPedido),
        horarioPedido: toStringOrNull(body.horarioPedido),
        diasEntrega: handleDiasField(body.diasEntrega),
        activo: body.activo !== undefined ? Boolean(body.activo) : true,
      },
    })

    return NextResponse.json(proveedor, { status: 201 })
  } catch (error: any) {
    console.error('Error en POST /api/proveedores:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    
    // Mensaje de error más descriptivo
    let errorMessage = 'Error al crear proveedor'
    if (error?.message) {
      if (error.message.includes('PrismaClient')) {
        errorMessage = 'Error de conexión con la base de datos'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: 500 }
    )
  }
}
