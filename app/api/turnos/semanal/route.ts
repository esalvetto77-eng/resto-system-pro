// API para obtener planilla semanal de turnos
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJSON } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restauranteId = searchParams.get('restauranteId')
    const semana = searchParams.get('semana') // Formato: YYYY-WW (año-semana)

    // Obtener empleados activos, opcionalmente filtrados por restaurante
    const empleados = await prisma.empleado.findMany({
      where: {
        activo: true,
        ...(restauranteId && {
          restaurantes: {
            some: {
              restauranteId: restauranteId,
            },
          },
        }),
      },
      include: {
        restaurantes: {
          include: {
            restaurante: true,
          },
        },
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' },
      ],
    })

    // Obtener todos los ajustes de turno para los empleados y restaurante
    const ajustes = await prisma.ajusteTurno.findMany({
      where: {
        empleadoId: { in: empleados.map(e => e.id) },
        ...(restauranteId && { restauranteId }),
      },
      orderBy: { fecha: 'asc' },
    })

    // Crear un mapa de ajustes por empleado y fecha
    const ajustesPorEmpleado: Record<string, Record<string, any>> = {}
    ajustes.forEach(ajuste => {
      const fechaKey = ajuste.fecha.toISOString().split('T')[0]
      if (!ajustesPorEmpleado[ajuste.empleadoId]) {
        ajustesPorEmpleado[ajuste.empleadoId] = {}
      }
      ajustesPorEmpleado[ajuste.empleadoId][fechaKey] = {
        tipoAjuste: ajuste.tipoAjuste,
        minutosAfectados: ajuste.minutosAfectados,
      }
    })

    // Procesar empleados con sus días de descanso parseados y ajustes
    const empleadosConTurnos = empleados.map((empleado) => {
      const diasDescansoRaw = parseJSON<any>(empleado.diasDescanso, {})
      let diasDescansoParsed: Record<string, string> = {}

      // Convertir formato antiguo (array) o nuevo (objeto)
      if (Array.isArray(diasDescansoRaw)) {
        diasDescansoRaw.forEach((dia: string) => {
          diasDescansoParsed[dia] = 'completo'
        })
      } else if (typeof diasDescansoRaw === 'object' && diasDescansoRaw !== null) {
        // Convertir valores antiguos "medio" a "medio-mañana" para compatibilidad
        Object.entries(diasDescansoRaw).forEach(([dia, valor]) => {
          if (valor === 'medio') {
            diasDescansoParsed[dia] = 'medio-mañana'
          } else {
            diasDescansoParsed[dia] = String(valor)
          }
        })
      }

      return {
        id: empleado.id,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        horarioEntrada: empleado.horarioEntrada,
        horarioSalida: empleado.horarioSalida,
        diasDescanso: diasDescansoParsed,
        ajustes: ajustesPorEmpleado[empleado.id] || {},
        restaurantes: empleado.restaurantes.map((er) => ({
          id: er.restaurante.id,
          nombre: er.restaurante.nombre,
        })),
      }
    })

    return NextResponse.json(empleadosConTurnos)
  } catch (error) {
    console.error('Error al obtener planilla semanal:', error)
    return NextResponse.json(
      { error: 'Error al obtener planilla semanal' },
      { status: 500 }
    )
  }
}
