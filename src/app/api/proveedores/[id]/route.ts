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
    // Intentar obtener el proveedor sin select primero para ver si funciona
    let proveedor: any
    try {
      proveedor = await prisma.proveedor.findUnique({
        where: { id: params.id },
      })
      
      if (!proveedor) {
        return NextResponse.json(
          { error: 'Proveedor no encontrado' },
          { status: 404 }
        )
      }
      
      // Si el proveedor no tiene campos adicionales, intentar obtenerlos con una consulta raw
      if (!('comentario' in proveedor) || proveedor.comentario === undefined) {
        try {
          const resultado = await prisma.$queryRawUnsafe<Array<{
            comentario: string | null,
            numero_cuenta: string | null,
            banco: string | null
          }>>(
            `SELECT comentario, numero_cuenta, banco FROM proveedores WHERE id = $1`,
            params.id
          )
          if (resultado && resultado.length > 0) {
            proveedor.comentario = resultado[0].comentario
            proveedor.numeroCuenta = resultado[0].numero_cuenta
            proveedor.banco = resultado[0].banco
          } else {
            proveedor.comentario = null
            proveedor.numeroCuenta = null
            proveedor.banco = null
          }
        } catch (camposError: any) {
          // Si los campos no existen, simplemente agregar null
          console.log('[API PROVEEDOR] Campos adicionales no existen aún, usando null')
          proveedor.comentario = null
          proveedor.numeroCuenta = null
          proveedor.banco = null
        }
      }
    } catch (error: any) {
      // Si falla porque el campo comentario no existe, intentar con select explícito
      if (error?.message?.includes('comentario') || error?.code === 'P2022') {
        console.log('[API PROVEEDOR] Error con comentario, intentando sin ese campo:', error?.message)
        try {
          const proveedorSinComentario = await prisma.proveedor.findUnique({
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
            },
          })
          
          if (!proveedorSinComentario) {
            return NextResponse.json(
              { error: 'Proveedor no encontrado' },
              { status: 404 }
            )
          }
          
          // Convertir a objeto plano y agregar campos adicionales
          proveedor = {
            id: proveedorSinComentario.id,
            nombre: proveedorSinComentario.nombre,
            contacto: proveedorSinComentario.contacto,
            telefono: proveedorSinComentario.telefono,
            email: proveedorSinComentario.email,
            direccion: proveedorSinComentario.direccion,
            diasPedido: proveedorSinComentario.diasPedido,
            horarioPedido: proveedorSinComentario.horarioPedido,
            diasEntrega: proveedorSinComentario.diasEntrega,
            activo: proveedorSinComentario.activo,
            rubro: proveedorSinComentario.rubro,
            minimoCompra: proveedorSinComentario.minimoCompra,
            metodoPago: proveedorSinComentario.metodoPago,
            comentario: null,
            numeroCuenta: null,
            banco: null,
            createdAt: proveedorSinComentario.createdAt,
            updatedAt: proveedorSinComentario.updatedAt,
          }
        } catch (selectError: any) {
          throw error // Re-lanzar el error original si también falla el select
        }
      } else {
        throw error // Re-lanzar si es otro tipo de error
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

    // Verificar que el proveedor existe (sin incluir comentario para evitar errores)
    let proveedorExistente: any
    try {
      proveedorExistente = await prisma.proveedor.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          nombre: true,
          activo: true,
        },
      })
    } catch (error: any) {
      // Si falla, intentar sin select
      proveedorExistente = await prisma.proveedor.findUnique({
        where: { id: params.id },
      })
    }
    
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

    // Verificar si los campos adicionales existen en la BD antes de intentar actualizarlos
    let camposAdicionalesExisten = false
    try {
      await prisma.$queryRawUnsafe(
        `SELECT comentario, numero_cuenta, banco FROM proveedores WHERE id = $1 LIMIT 1`,
        params.id
      )
      camposAdicionalesExisten = true
      console.log('[API PROVEEDOR PUT] Campos adicionales existen en BD')
    } catch (error: any) {
      console.log('[API PROVEEDOR PUT] Campos adicionales NO existen en BD, actualizando sin esos campos')
      camposAdicionalesExisten = false
    }
    
    // Construir el objeto de datos
    const dataToUpdate: any = {
      nombre: body.nombre.trim(),
      contacto: toStringOrNull(body.contacto),
      telefono: toStringOrNull(body.telefono),
      email: toStringOrNull(body.email),
      direccion: toStringOrNull(body.direccion),
      rubro: toStringOrNull(body.rubro),
      minimoCompra: toNumberOrNull(body.minimoCompra),
      metodoPago: toStringOrNull(body.metodoPago),
      diasPedido: handleDiasField(body.diasPedido),
      horarioPedido: toStringOrNull(body.horarioPedido),
      diasEntrega: handleDiasField(body.diasEntrega),
      activo: body.activo !== undefined ? Boolean(body.activo) : proveedorExistente.activo,
    }
    
    // Solo incluir campos adicionales si existen en la BD
    if (camposAdicionalesExisten) {
      dataToUpdate.comentario = toStringOrNull(body.comentario)
      dataToUpdate.numeroCuenta = toStringOrNull(body.numeroCuenta)
      dataToUpdate.banco = toStringOrNull(body.banco)
    }
    
    // Actualizar el proveedor
    const proveedor = await prisma.proveedor.update({
      where: { id: params.id },
      data: dataToUpdate,
    })
    
    // Si los campos adicionales tienen valor pero no existen, intentar actualizarlos con SQL directo
    // (esto no debería pasar, pero por si acaso)
    if (!camposAdicionalesExisten && (body.comentario || body.numeroCuenta || body.banco)) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS comentario TEXT`
        )
        await prisma.$executeRawUnsafe(
          `ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS numero_cuenta TEXT`
        )
        await prisma.$executeRawUnsafe(
          `ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS banco TEXT`
        )
        await prisma.$executeRawUnsafe(
          `UPDATE proveedores SET comentario = $1, numero_cuenta = $2, banco = $3 WHERE id = $4`,
          toStringOrNull(body.comentario),
          toStringOrNull(body.numeroCuenta),
          toStringOrNull(body.banco),
          params.id
        )
        console.log('[API PROVEEDOR PUT] Campos adicionales agregados y actualizados con SQL')
      } catch (sqlError: any) {
        console.log('[API PROVEEDOR PUT] No se pudo agregar/actualizar campos adicionales con SQL:', sqlError?.message)
        // Continuar sin los campos
      }
    }

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
