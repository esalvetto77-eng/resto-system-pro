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

    // Si hay campos adicionales, usar SQL directo para evitar validación de Prisma
    let proveedor: any
    
    if (tieneComentario || tieneNumeroCuenta || tieneBanco) {
      // Usar SQL directo para crear cuando hay campos adicionales
      const columnasBasicas = await prisma.$queryRawUnsafe<Array<{column_name: string}>>(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'proveedores' 
         AND column_name IN ('minimo_compra', 'minimocompra', 'metodo_pago', 'metodopago', 'dias_pedido', 'diaspedido', 'horario_pedido', 'horariopedido', 'dias_entrega', 'diasentrega')`
      )
      const nombresBasicos = columnasBasicas.map(c => c.column_name)
      
      const minimoCompraCol = nombresBasicos.find(c => c.toLowerCase().includes('minimo') && c.toLowerCase().includes('compra'))
      const metodoPagoCol = nombresBasicos.find(c => c.toLowerCase().includes('metodo') && c.toLowerCase().includes('pago'))
      const diasPedidoCol = nombresBasicos.find(c => c.toLowerCase().includes('dias') && c.toLowerCase().includes('pedido'))
      const horarioPedidoCol = nombresBasicos.find(c => c.toLowerCase().includes('horario') && c.toLowerCase().includes('pedido'))
      const diasEntregaCol = nombresBasicos.find(c => c.toLowerCase().includes('dias') && c.toLowerCase().includes('entrega'))
      
      const campos: string[] = ['id', 'nombre', 'contacto', 'telefono', 'email', 'direccion', 'rubro', 'activo', 'created_at', 'updated_at']
      const valores: any[] = []
      
      // Generar ID
      const nuevoId = require('crypto').randomUUID ? require('crypto').randomUUID() : `clx${Date.now()}${Math.random().toString(36).substr(2, 9)}`
      valores.push(nuevoId)
      valores.push(dataToCreate.nombre)
      valores.push(dataToCreate.contacto)
      valores.push(dataToCreate.telefono)
      valores.push(dataToCreate.email)
      valores.push(dataToCreate.direccion)
      valores.push(dataToCreate.rubro)
      valores.push(dataToCreate.activo)
      
      if (minimoCompraCol) {
        campos.push(minimoCompraCol)
        valores.push(dataToCreate.minimoCompra)
      }
      if (metodoPagoCol) {
        campos.push(metodoPagoCol)
        valores.push(dataToCreate.metodoPago)
      }
      if (diasPedidoCol) {
        campos.push(diasPedidoCol)
        valores.push(dataToCreate.diasPedido)
      }
      if (horarioPedidoCol) {
        campos.push(horarioPedidoCol)
        valores.push(dataToCreate.horarioPedido)
      }
      if (diasEntregaCol) {
        campos.push(diasEntregaCol)
        valores.push(dataToCreate.diasEntrega)
      }
      
      if (tieneComentario) {
        campos.push('comentario')
        valores.push(toStringOrNull(body.comentario))
      }
      if (tieneNumeroCuenta) {
        campos.push('numero_cuenta')
        valores.push(toStringOrNull(body.numeroCuenta))
      }
      if (tieneBanco) {
        campos.push('banco')
        valores.push(toStringOrNull(body.banco))
      }
      
      const placeholders = campos.map((_, i) => `$${i + 1}`).join(', ')
      await prisma.$executeRawUnsafe(
        `INSERT INTO proveedores (${campos.join(', ')}, created_at, updated_at) 
         VALUES (${placeholders}, NOW(), NOW())`,
        ...valores
      )
      
      console.log('[API PROVEEDORES POST] Proveedor creado con SQL directo')
      
      // Obtener el proveedor creado con select explícito
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
      
      // Agregar campos adicionales si existen
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
          console.log('[API PROVEEDORES POST] Error al obtener campos adicionales (continuando):', error?.message)
        }
      }
    } else {
      // Si no hay campos adicionales, usar Prisma normalmente
      proveedor = await prisma.proveedor.create({
        data: dataToCreate,
      })
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
