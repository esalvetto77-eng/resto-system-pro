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
      
      // Si los campos adicionales existen, intentar leerlos con una consulta raw
      try {
        const proveedoresConCamposAdicionales = await prisma.$queryRawUnsafe<Array<{
          id: string, 
          comentario: string | null,
          numero_cuenta: string | null,
          banco: string | null
        }>>(
          `SELECT id, comentario, numero_cuenta, banco FROM proveedores WHERE activo = true ORDER BY nombre ASC`
        )
        
        // Mapear campos adicionales a los proveedores (convertir snake_case a camelCase)
        const camposMap = new Map(proveedoresConCamposAdicionales.map(p => [
          p.id, 
          {
            comentario: p.comentario,
            numeroCuenta: p.numero_cuenta,
            banco: p.banco
          }
        ]))
        proveedores = proveedores.map(p => {
          const campos = camposMap.get(p.id) || { comentario: null, numeroCuenta: null, banco: null }
          return {
            ...p,
            comentario: campos.comentario,
            numeroCuenta: campos.numeroCuenta,
            banco: campos.banco,
          }
        })
      } catch (camposError: any) {
        // Si los campos no existen, simplemente agregar null
        console.log('[API PROVEEDORES] Campos adicionales no existen aún, usando null')
        proveedores = proveedores.map(p => ({
          ...p,
          comentario: null,
          numeroCuenta: null,
          banco: null,
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

    // Verificar qué campos adicionales existen
    let tieneComentario = false
    let tieneNumeroCuenta = false
    let tieneBanco = false
    
    try {
      const columnas = await prisma.$queryRawUnsafe<Array<{column_name: string}>>(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'proveedores' 
         AND column_name IN ('comentario', 'numero_cuenta', 'banco')`
      )
      const nombresColumnas = columnas.map(c => c.column_name)
      tieneComentario = nombresColumnas.includes('comentario')
      tieneNumeroCuenta = nombresColumnas.includes('numero_cuenta')
      tieneBanco = nombresColumnas.includes('banco')
    } catch (error: any) {
      console.log('[API PROVEEDORES POST] Error al verificar campos (continuando sin ellos):', error?.message)
    }

    const dataToCreate: any = {
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
      activo: body.activo !== undefined ? Boolean(body.activo) : true,
    }

    // Intentar crear con Prisma primero
    let proveedor: any
    try {
      proveedor = await prisma.proveedor.create({
        data: dataToCreate,
      })
      console.log('[API PROVEEDORES POST] Proveedor creado con Prisma')
    } catch (prismaError: any) {
      // Si Prisma falla (porque valida el schema completo), usar SQL directo
      if (prismaError?.message?.includes('numeroCuenta') || prismaError?.message?.includes('banco') || prismaError?.message?.includes('comentario')) {
        console.log('[API PROVEEDORES POST] Prisma falló por campos adicionales, usando SQL directo')
        
        // Obtener TODAS las columnas de la tabla para encontrar los nombres reales
        const todasLasColumnas = await prisma.$queryRawUnsafe<Array<{column_name: string}>>(
          `SELECT column_name FROM information_schema.columns 
           WHERE table_name = 'proveedores' 
           ORDER BY column_name`
        )
        const nombresColumnas = todasLasColumnas.map(c => c.column_name)
        
        console.log('[API PROVEEDORES POST] Columnas encontradas en BD:', nombresColumnas)
        
        // Buscar columnas usando múltiples estrategias
        const minimoCompraCol = nombresColumnas.find(c => 
          c.toLowerCase() === 'minimo_compra' || 
          c.toLowerCase() === 'minimocompra' ||
          (c.toLowerCase().includes('minimo') && c.toLowerCase().includes('compra'))
        )
        const metodoPagoCol = nombresColumnas.find(c => 
          c.toLowerCase() === 'metodo_pago' || 
          c.toLowerCase() === 'metodopago' ||
          (c.toLowerCase().includes('metodo') && c.toLowerCase().includes('pago'))
        )
        const diasPedidoCol = nombresColumnas.find(c => 
          c.toLowerCase() === 'dias_pedido' || 
          c.toLowerCase() === 'diaspedido' ||
          c.toLowerCase() === 'dias_pedidos' ||
          (c.toLowerCase().includes('dias') && c.toLowerCase().includes('pedido'))
        )
        const horarioPedidoCol = nombresColumnas.find(c => 
          c.toLowerCase() === 'horario_pedido' || 
          c.toLowerCase() === 'horariopedido' ||
          (c.toLowerCase().includes('horario') && c.toLowerCase().includes('pedido'))
        )
        const diasEntregaCol = nombresColumnas.find(c => 
          c.toLowerCase() === 'dias_entrega' || 
          c.toLowerCase() === 'diasentrega' ||
          c.toLowerCase() === 'dias_entregas' ||
          (c.toLowerCase().includes('dias') && c.toLowerCase().includes('entrega'))
        )
        const createdAtCol = nombresColumnas.find(c => 
          c.toLowerCase() === 'created_at' || 
          c.toLowerCase() === 'createdat' ||
          c.toLowerCase() === 'created'
        )
        const updatedAtCol = nombresColumnas.find(c => 
          c.toLowerCase() === 'updated_at' || 
          c.toLowerCase() === 'updatedat' ||
          c.toLowerCase() === 'updated'
        )
        
        // Si no encontramos las columnas requeridas, usar los nombres que Prisma espera (camelCase)
        // Prisma mapea automáticamente camelCase a snake_case en PostgreSQL
        const diasPedidoFinal = diasPedidoCol || 'diasPedido'
        const diasEntregaFinal = diasEntregaCol || 'diasEntrega'
        
        console.log('[API PROVEEDORES POST] Columnas encontradas:', {
          diasPedido: diasPedidoFinal,
          diasEntrega: diasEntregaFinal,
          minimoCompra: minimoCompraCol,
          metodoPago: metodoPagoCol
        })
        
        // Generar ID
        const nuevoId = `clx${Date.now()}${Math.random().toString(36).substring(2, 11)}`
        
        // Usar los nombres EXACTOS encontrados en la BD y ponerlos entre comillas dobles para preservar el case
        // PostgreSQL convierte a minúsculas si no usamos comillas
        const campos: string[] = []
        const valores: any[] = []
        
        // Campos REQUERIDOS (NOT NULL) - usar nombres exactos con comillas
        campos.push('"id"')
        valores.push(nuevoId)
        campos.push('"nombre"')
        valores.push(dataToCreate.nombre)
        campos.push(`"${diasPedidoFinal}"`)
        valores.push(dataToCreate.diasPedido || '[]')
        campos.push(`"${diasEntregaFinal}"`)
        valores.push(dataToCreate.diasEntrega || '[]')
        campos.push('"activo"')
        valores.push(dataToCreate.activo)
        
        // Campos opcionales - usar nombres exactos encontrados
        if (nombresColumnas.includes('contacto')) {
          campos.push('"contacto"')
          valores.push(dataToCreate.contacto)
        }
        if (nombresColumnas.includes('telefono')) {
          campos.push('"telefono"')
          valores.push(dataToCreate.telefono)
        }
        if (nombresColumnas.includes('email')) {
          campos.push('"email"')
          valores.push(dataToCreate.email)
        }
        if (nombresColumnas.includes('direccion')) {
          campos.push('"direccion"')
          valores.push(dataToCreate.direccion)
        }
        if (nombresColumnas.includes('rubro')) {
          campos.push('"rubro"')
          valores.push(dataToCreate.rubro)
        }
        if (minimoCompraCol) {
          campos.push(`"${minimoCompraCol}"`)
          valores.push(dataToCreate.minimoCompra)
        }
        if (metodoPagoCol) {
          campos.push(`"${metodoPagoCol}"`)
          valores.push(dataToCreate.metodoPago)
        }
        if (horarioPedidoCol) {
          campos.push(`"${horarioPedidoCol}"`)
          valores.push(dataToCreate.horarioPedido)
        }
        if (createdAtCol) {
          campos.push(`"${createdAtCol}"`)
          valores.push(new Date())
        }
        if (updatedAtCol) {
          campos.push(`"${updatedAtCol}"`)
          valores.push(new Date())
        }
        if (tieneComentario) {
          campos.push('"comentario"')
          valores.push(toStringOrNull(body.comentario))
        }
        if (tieneNumeroCuenta) {
          campos.push('"numero_cuenta"')
          valores.push(toStringOrNull(body.numeroCuenta))
        }
        if (tieneBanco) {
          campos.push('"banco"')
          valores.push(toStringOrNull(body.banco))
        }
        
        const placeholders = campos.map((_, i) => `$${i + 1}`).join(', ')
        await prisma.$executeRawUnsafe(
          `INSERT INTO proveedores (${campos.join(', ')}) VALUES (${placeholders})`,
          ...valores
        )
        
        // Obtener el proveedor creado
        proveedor = await prisma.proveedor.findUnique({
          where: { id: nuevoId },
          select: {
            id: true,
            nombre: true,
            contacto: true,
            telefono: true,
            email: true,
            direccion: true,
            rubro: true,
            minimoCompra: true,
            metodoPago: true,
            diasPedido: true,
            horarioPedido: true,
            diasEntrega: true,
            activo: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        
        // Agregar campos adicionales
        if (tieneComentario || tieneNumeroCuenta || tieneBanco) {
          try {
            const camposAdicionales = await prisma.$queryRawUnsafe<Array<{
              comentario: string | null,
              numero_cuenta: string | null,
              banco: string | null
            }>>(
              `SELECT comentario, numero_cuenta, banco FROM proveedores WHERE id = $1`,
              nuevoId
            )
            if (camposAdicionales && camposAdicionales.length > 0) {
              proveedor = {
                ...proveedor,
                comentario: camposAdicionales[0].comentario,
                numeroCuenta: camposAdicionales[0].numero_cuenta,
                banco: camposAdicionales[0].banco,
              }
            }
          } catch (error: any) {
            console.log('[API PROVEEDORES POST] Error al obtener campos adicionales:', error?.message)
          }
        }
      } else {
        throw prismaError
      }
    }
    
    // Si se creó con Prisma y hay campos adicionales, actualizarlos
    if (proveedor && (tieneComentario || tieneNumeroCuenta || tieneBanco)) {
      const updatesAdicionales: string[] = []
      const valores: any[] = []
      
      if (tieneComentario) {
        updatesAdicionales.push('comentario = $' + (valores.length + 1))
        valores.push(toStringOrNull(body.comentario))
      }
      if (tieneNumeroCuenta) {
        updatesAdicionales.push('numero_cuenta = $' + (valores.length + 1))
        valores.push(toStringOrNull(body.numeroCuenta))
      }
      if (tieneBanco) {
        updatesAdicionales.push('banco = $' + (valores.length + 1))
        valores.push(toStringOrNull(body.banco))
      }
      
      if (updatesAdicionales.length > 0) {
        valores.push(proveedor.id)
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE proveedores SET ${updatesAdicionales.join(', ')} WHERE id = $${valores.length}`,
            ...valores
          )
          
          // Obtener campos adicionales para la respuesta
          const camposAdicionales = await prisma.$queryRawUnsafe<Array<{
            comentario: string | null,
            numero_cuenta: string | null,
            banco: string | null
          }>>(
            `SELECT comentario, numero_cuenta, banco FROM proveedores WHERE id = $1`,
            proveedor.id
          )
          if (camposAdicionales && camposAdicionales.length > 0) {
            proveedor = {
              ...proveedor,
              comentario: camposAdicionales[0].comentario,
              numeroCuenta: camposAdicionales[0].numero_cuenta,
              banco: camposAdicionales[0].banco,
            }
          }
        } catch (sqlError: any) {
          console.log('[API PROVEEDORES POST] Error al actualizar campos adicionales (continuando):', sqlError?.message)
        }
      }
    }

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
