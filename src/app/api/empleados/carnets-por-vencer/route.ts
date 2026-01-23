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

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const en15Dias = new Date()
    en15Dias.setDate(hoy.getDate() + 15)
    en15Dias.setHours(23, 59, 59, 999)

    // Obtener empleados activos con carnets que vencen en los próximos 15 días
    const empleados = await prisma.empleado.findMany({
      where: {
        activo: true,
        OR: [
          {
            // Carnet de manipulación por vencer
            carnetManipulacionVencimiento: {
              gte: hoy,
              lte: en15Dias,
            },
          },
          {
            // Carnet de salud por vencer
            carnetSaludVencimiento: {
              gte: hoy,
              lte: en15Dias,
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
        fechaVenc.setHours(0, 0, 0, 0)
        const diasRestantes = Math.ceil(
          (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
        )

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
        fechaVenc.setHours(0, 0, 0, 0)
        const diasRestantes = Math.ceil(
          (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
        )

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
