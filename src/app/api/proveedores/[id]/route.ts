// API Route para operaciones individuales de Proveedores - Versión simplificada
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Obtener un proveedor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Intentar obtener con select explícito para evitar errores si el campo comentario no existe
    let proveedor
    try {
      proveedor = await prisma.proveedor.findUnique({
        where: { id: params.id },
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
          // No incluir comentario en el select inicial
        },
      })
      
      if (!proveedor) {
        return NextResponse.json(
          { error: 'Proveedor no encontrado' },
          { status: 404 }
        )
      }
      
      // Intentar obtener el comentario con una consulta raw si el campo existe
      try {
        const resultado = await prisma.$queryRawUnsafe<Array<{comentario: string | null}>>(
          `SELECT comentario FROM proveedores WHERE id = $1`,
          params.id
        )
        if (resultado && resultado.length > 0) {
          proveedor = {
            ...proveedor,
            comentario: resultado[0].comentario,
          }
        } else {
          proveedor = {
            ...proveedor,
            comentario: null,
          }
        }
      } catch (comentarioError: any) {
        // Si el campo comentario no existe, simplemente agregar null
        console.log('[API PROVEEDOR] Campo comentario no existe aún, usando null')
        proveedor = {
          ...proveedor,
          comentario: null,
        }
      }
    } catch (selectError: any) {
      // Si falla el select, intentar sin select (incluir todos los campos)
      console.log('[API PROVEEDOR] Error con select, intentando sin select:', selectError?.message)
      proveedor = await prisma.proveedor.findUnique({
        where: { id: params.id },
      })
      
      if (!proveedor) {
        return NextResponse.json(
          { error: 'Proveedor no encontrado' },
          { status: 404 }
        )
      }
      
      // Si el proveedor no tiene comentario, agregarlo como null
      if (!('comentario' in proveedor)) {
        proveedor = {
          ...proveedor,
          comentario: null,
        }
      }
    }

    return NextResponse.json(proveedor)
  } catch (error: any) {
    console.error('Error en GET /api/proveedores/[id]:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    return NextResponse.json(
      { error: 'Error al obtener proveedor', details: error?.message },
      { status: 500 }
    )
  }
}

// PUT: Actualizar un proveedor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validar que el nombre esté presente
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el proveedor existe
    const proveedorExistente = await prisma.proveedor.findUnique({
      where: { id: params.id },
    })
    if (!proveedorExistente) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
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

    const proveedor = await prisma.proveedor.update({
      where: { id: params.id },
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
        activo: body.activo !== undefined ? Boolean(body.activo) : proveedorExistente.activo,
      },
    })

    return NextResponse.json(proveedor)
  } catch (error: any) {
    console.error('Error en PUT /api/proveedores/[id]:', error?.message || String(error))
    console.error('Stack trace:', error?.stack)
    return NextResponse.json(
      { error: 'Error al actualizar proveedor', details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar un proveedor
// Si el usuario es ADMIN (dueño): hard delete (eliminación completa)
// Si no es ADMIN: soft delete (marcar como inactivo)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener usuario actual desde la sesión
    const user = await getCurrentUser()
    const userIsAdmin = isAdmin(user)

    if (userIsAdmin) {
      // Hard delete: Eliminar completamente el proveedor y sus relaciones
      await prisma.$transaction(async (tx) => {
        // Eliminar relaciones primero (por las foreign keys)
        await tx.productoProveedor.deleteMany({
          where: { proveedorId: params.id },
        })
        await tx.pedido.deleteMany({
          where: { proveedorId: params.id },
        })

        // Finalmente eliminar el proveedor
        await tx.proveedor.delete({
          where: { id: params.id },
        })
      })

      return NextResponse.json({ message: 'Proveedor eliminado permanentemente' })
    } else {
      // Soft delete: Marcar como inactivo
      const proveedor = await prisma.proveedor.update({
        where: { id: params.id },
        data: {
          activo: false,
        },
      })

      return NextResponse.json(proveedor)
    }
  } catch (error: any) {
    console.error('Error en DELETE /api/proveedores/[id]:', error?.message || String(error))
    return NextResponse.json(
      { error: 'Error al eliminar proveedor' },
      { status: 500 }
    )
  }
}
