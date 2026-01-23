// API Route para obtener empleados con carnets por vencer (15 días)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const user = await getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener TODOS los empleados activos que tengan al menos un carnet configurado
    // Luego filtraremos en memoria para evitar problemas con zonas horarias
    const empleados = await prisma.empleado.findMany({
      where: {
        activo: true,
        OR: [
          {
            carnetManipulacionVencimiento: {
              not: null,
            },
          },
          {
            carnetSaludVencimiento: {
              not: null,
            },
          },
        ],
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        carnetManipulacionVencimiento: true,
        carnetSaludVencimiento: true,
      },
    })

    // Calcular fechas de referencia (solo fecha, sin hora)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const en15Dias = new Date()
    en15Dias.setDate(hoy.getDate() + 15)
    en15Dias.setHours(23, 59, 59, 999)

    console.log('[API] Total empleados con carnets:', empleados.length)
    console.log('[API] Fecha hoy:', hoy.toISOString())
    console.log('[API] Fecha en 15 días:', en15Dias.toISOString())

    console.log('[API] Empleados encontrados con carnets por vencer:', empleados.length)
    console.log('[API] Fecha hoy:', hoy.toISOString())
    console.log('[API] Fecha en 15 días:', en15Dias.toISOString())
    
    // Formatear los resultados
    const alertas = empleados.map((empleado) => {
      const alertasEmpleado: Array<{
        tipo: 'manipulacion' | 'salud'
        fechaVencimiento: string
        diasRestantes: number
      }> = []

      if (empleado.carnetManipulacionVencimiento) {
        const fechaVenc = new Date(empleado.carnetManipulacionVencimiento)
        // Normalizar a medianoche para comparar solo fechas
        fechaVenc.setHours(0, 0, 0, 0)
        
        // Calcular días restantes
        const diferenciaMs = fechaVenc.getTime() - hoy.getTime()
        const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24))

        console.log(`[API] Empleado ${empleado.nombre}: Manipulación vence ${fechaVenc.toISOString()}, días restantes: ${diasRestantes}`)

        // Incluir si vence en los próximos 15 días (incluyendo hoy) y no está vencido
        if (diasRestantes >= 0 && diasRestantes <= 15) {
          alertasEmpleado.push({
            tipo: 'manipulacion',
            fechaVencimiento: empleado.carnetManipulacionVencimiento.toISOString(),
            diasRestantes,
          })
        }
      }

      if (empleado.carnetSaludVencimiento) {
        const fechaVenc = new Date(empleado.carnetSaludVencimiento)
        // Normalizar a medianoche para comparar solo fechas
        fechaVenc.setHours(0, 0, 0, 0)
        
        // Calcular días restantes
        const diferenciaMs = fechaVenc.getTime() - hoy.getTime()
        const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24))

        console.log(`[API] Empleado ${empleado.nombre}: Salud vence ${fechaVenc.toISOString()}, días restantes: ${diasRestantes}`)

        // Incluir si vence en los próximos 15 días (incluyendo hoy) y no está vencido
        if (diasRestantes >= 0 && diasRestantes <= 15) {
          alertasEmpleado.push({
            tipo: 'salud',
            fechaVencimiento: empleado.carnetSaludVencimiento.toISOString(),
            diasRestantes,
          })
        }
      }

      return {
        empleadoId: empleado.id,
        nombre: `${empleado.nombre} ${empleado.apellido}`,
        alertas: alertasEmpleado,
      }
    })

    // Filtrar solo empleados que tienen alertas
    const empleadosConAlertas = alertas.filter((e) => e.alertas.length > 0)

    // Ordenar por días restantes (menor primero = más urgente)
    empleadosConAlertas.sort((a, b) => {
      const minA = Math.min(...a.alertas.map(al => al.diasRestantes))
      const minB = Math.min(...b.alertas.map(al => al.diasRestantes))
      return minA - minB
    })

    console.log('[API] Empleados con alertas después de filtrar:', empleadosConAlertas.length)
    console.log('[API] Detalle de alertas:', JSON.stringify(empleadosConAlertas, null, 2))

    return NextResponse.json({
      total: empleadosConAlertas.length,
      empleados: empleadosConAlertas,
    })
  } catch (error: any) {
    console.error('Error al obtener carnets por vencer:', error)
    return NextResponse.json(
      { error: 'Error al obtener carnets por vencer' },
      { status: 500 }
    )
  }
}
