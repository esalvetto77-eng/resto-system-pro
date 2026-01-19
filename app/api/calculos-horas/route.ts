// API Route para cálculos de horas trabajadas y liquidaciones
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJSON } from '@/lib/utils.ts'
import { calcularHorasPeriodo, calcularSueldo } from '@/lib/calculoHoras'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Listar cálculos de horas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empleadoId = searchParams.get('empleadoId')
    const restauranteId = searchParams.get('restauranteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: any = {}

    if (empleadoId) {
      where.empleadoId = empleadoId
    }

    if (restauranteId) {
      where.restauranteId = restauranteId
    }

    if (fechaDesde || fechaHasta) {
      where.OR = []
      if (fechaDesde) {
        where.OR.push({ fechaFin: { gte: new Date(fechaDesde) } })
      }
      if (fechaHasta) {
        const fechaHastaDate = new Date(fechaHasta)
        fechaHastaDate.setHours(23, 59, 59, 999)
        where.OR.push({ fechaInicio: { lte: fechaHastaDate } })
      }
    }

    const calculos = await prisma.calculoHoras.findMany({
      where,
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        restaurante: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fechaInicio: 'desc' },
    })

    return NextResponse.json(calculos)
  } catch (error) {
    console.error('Error al obtener cálculos de horas:', error)
    return NextResponse.json(
      { error: 'Error al obtener cálculos de horas' },
      { status: 500 }
    )
  }
}

// POST: Calcular y guardar horas trabajadas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar campos requeridos
    if (!body.empleadoId || !body.restauranteId || !body.fechaInicio || !body.fechaFin) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el empleado existe y pertenece al restaurante
    const empleado = await prisma.empleado.findUnique({
      where: { id: body.empleadoId },
      include: {
        restaurantes: {
          where: { restauranteId: body.restauranteId },
        },
      },
    })

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    if (empleado.restaurantes.length === 0) {
      return NextResponse.json(
        { error: 'El empleado no pertenece a este restaurante' },
        { status: 400 }
      )
    }

    // Obtener ajustes de turno para el período
    const fechaInicio = new Date(body.fechaInicio)
    const fechaFin = new Date(body.fechaFin)

    const ajustes = await prisma.ajusteTurno.findMany({
      where: {
        empleadoId: body.empleadoId,
        restauranteId: body.restauranteId,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      orderBy: { fecha: 'asc' },
    })

    // Crear mapa de ajustes por fecha
    const ajustesPorFecha: Record<string, { tipoAjuste: string; minutosAfectados: number | null }> = {}
    ajustes.forEach(ajuste => {
      const fechaKey = ajuste.fecha.toISOString().split('T')[0]
      ajustesPorFecha[fechaKey] = {
        tipoAjuste: ajuste.tipoAjuste,
        minutosAfectados: ajuste.minutosAfectados,
      }
    })

    // Parsear días de descanso
    const diasDescansoRaw = parseJSON<any>(empleado.diasDescanso, {})
    let diasDescansoParsed: Record<string, string> = {}

    if (Array.isArray(diasDescansoRaw)) {
      diasDescansoRaw.forEach((dia: string) => {
        diasDescansoParsed[dia] = 'completo'
      })
    } else if (typeof diasDescansoRaw === 'object' && diasDescansoRaw !== null) {
      Object.entries(diasDescansoRaw).forEach(([dia, valor]) => {
        if (valor === 'medio') {
          diasDescansoParsed[dia] = 'medio-mañana'
        } else {
          diasDescansoParsed[dia] = String(valor)
        }
      })
    }

    // Calcular horas del período
    const calculoHoras = calcularHorasPeriodo(
      fechaInicio,
      fechaFin,
      empleado.horarioEntrada,
      empleado.horarioSalida,
      diasDescansoParsed,
      ajustesPorFecha
    )

    // Calcular sueldo
    const calculoSueldo = calcularSueldo(
      empleado.tipoSueldo,
      empleado.sueldo,
      empleado.valorHoraExtra,
      calculoHoras.horasTrabajadas,
      calculoHoras.horasExtra,
      calculoHoras.diasTrabajados,
      calculoHoras.diasCompletos,
      calculoHoras.diasMedios,
      calculoHoras.faltas
    )

    // Verificar si ya existe un cálculo para este período
    const calculoExistente = await prisma.calculoHoras.findFirst({
      where: {
        empleadoId: body.empleadoId,
        restauranteId: body.restauranteId,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
      },
    })

    let calculo
    if (calculoExistente) {
      // Actualizar cálculo existente
      calculo = await prisma.calculoHoras.update({
        where: { id: calculoExistente.id },
        data: {
          horasBase: calculoHoras.horasBase,
          horasExtra: calculoHoras.horasExtra,
          horasTrabajadas: calculoHoras.horasTrabajadas,
          horasDescontadas: calculoHoras.horasDescontadas,
          diasTrabajados: calculoHoras.diasTrabajados,
          diasCompletos: calculoHoras.diasCompletos,
          diasMedios: calculoHoras.diasMedios,
          faltas: calculoHoras.faltas,
          montoBase: calculoSueldo.montoBase,
          montoHorasExtra: calculoSueldo.montoHorasExtra,
          montoDescuentos: calculoSueldo.montoDescuentos,
          totalPagar: calculoSueldo.totalPagar,
          observaciones: body.observaciones || null,
        },
        include: {
          empleado: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          restaurante: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      })
    } else {
      // Crear nuevo cálculo
      calculo = await prisma.calculoHoras.create({
        data: {
          empleadoId: body.empleadoId,
          restauranteId: body.restauranteId,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          horasBase: calculoHoras.horasBase,
          horasExtra: calculoHoras.horasExtra,
          horasTrabajadas: calculoHoras.horasTrabajadas,
          horasDescontadas: calculoHoras.horasDescontadas,
          diasTrabajados: calculoHoras.diasTrabajados,
          diasCompletos: calculoHoras.diasCompletos,
          diasMedios: calculoHoras.diasMedios,
          faltas: calculoHoras.faltas,
          montoBase: calculoSueldo.montoBase,
          montoHorasExtra: calculoSueldo.montoHorasExtra,
          montoDescuentos: calculoSueldo.montoDescuentos,
          totalPagar: calculoSueldo.totalPagar,
          observaciones: body.observaciones || null,
        },
        include: {
          empleado: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          restaurante: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      })
    }

    return NextResponse.json(calculo, { status: 201 })
  } catch (error: any) {
    console.error('Error al calcular horas:', error)
    return NextResponse.json(
      { error: 'Error al calcular horas: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    )
  }
}
