// API Route para Liquidaciones Profesionales
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularLiquidacion, EventoMensualData, EmpleadoLiquidacionData } from '@/lib/liquidacionUruguay'

export const dynamic = 'force-dynamic'

// GET: Listar liquidaciones
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const empleadoId = searchParams.get('empleadoId')
    const restauranteId = searchParams.get('restauranteId')
    const mes = searchParams.get('mes')
    const anio = searchParams.get('anio')

    const where: any = {}

    if (empleadoId) {
      where.empleadoId = empleadoId
    }

    if (restauranteId) {
      where.restauranteId = restauranteId
    }

    if (mes) {
      where.mes = parseInt(mes)
    }

    if (anio) {
      where.anio = parseInt(anio)
    }

    const liquidaciones = await prisma.liquidacionProfesional.findMany({
      where,
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            cargo: true,
          },
        },
        restaurante: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    })

    return NextResponse.json(liquidaciones)
  } catch (error) {
    console.error('Error al obtener liquidaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener liquidaciones' },
      { status: 500 }
    )
  }
}

// POST: Generar una nueva liquidación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar campos requeridos
    if (!body.empleadoId || !body.restauranteId || !body.mes || !body.anio) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (empleadoId, restauranteId, mes, anio)' },
        { status: 400 }
      )
    }

    const mes = parseInt(body.mes)
    const anio = parseInt(body.anio)

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
        { error: 'El empleado no está asignado a este restaurante' },
        { status: 400 }
      )
    }

    // Obtener eventos del mes
    const eventos = await prisma.eventoMensual.findMany({
      where: {
        empleadoId: body.empleadoId,
        restauranteId: body.restauranteId,
        mes,
        anio,
      },
      orderBy: { fecha: 'asc' },
    })

    console.log(`[LIQUIDACION] Eventos encontrados para empleado ${body.empleadoId}, mes ${mes}/${anio}:`, eventos.length)
    eventos.forEach(e => {
      console.log(`  - ${e.tipoEvento}: cantidad=${e.cantidad}, monto=${e.monto}, valorUnitario=${e.valorUnitario}`)
    })

    // Obtener horas extras de Ajustes de Turno del mes
    const fechaInicio = new Date(anio, mes - 1, 1)
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59)
    
    const ajustesHorasExtra = await prisma.ajusteTurno.findMany({
      where: {
        empleadoId: body.empleadoId,
        restauranteId: body.restauranteId,
        tipoAjuste: 'horas_extra',
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    })

    console.log(`[LIQUIDACION] Ajustes de turno (horas extra) encontrados:`, ajustesHorasExtra.length)
    const totalMinutosHorasExtra = ajustesHorasExtra.reduce((sum, a) => sum + (a.minutosAfectados || 0), 0)
    const totalHorasExtraDeAjustes = Math.round((totalMinutosHorasExtra / 60) * 100) / 100

    // Convertir eventos al formato necesario
    const eventosData: EventoMensualData[] = eventos.map(e => ({
      tipoEvento: e.tipoEvento,
      cantidad: e.cantidad || undefined,
      valorUnitario: e.valorUnitario || undefined,
      monto: e.monto,
      fecha: e.fecha,
    }))

    // Si hay horas extra en Ajustes de Turno pero no en Eventos Mensuales, agregarlas
    const tieneHorasExtraEnEventos = eventosData.some(e => e.tipoEvento === 'HORAS_EXTRA')
    console.log(`[LIQUIDACION] Tiene horas extra en eventos mensuales:`, tieneHorasExtraEnEventos)
    console.log(`[LIQUIDACION] Total horas extra de ajustes:`, totalHorasExtraDeAjustes)
    
    if (!tieneHorasExtraEnEventos && totalHorasExtraDeAjustes > 0) {
      console.log(`[LIQUIDACION] Agregando ${totalHorasExtraDeAjustes} horas extra desde Ajustes de Turno`)
      eventosData.push({
        tipoEvento: 'HORAS_EXTRA',
        cantidad: totalHorasExtraDeAjustes,
        valorUnitario: empleado.valorHoraExtra || undefined,
        monto: 0, // Se calculará en la función de liquidación
        fecha: fechaInicio,
      })
      console.log(`[LIQUIDACION] Evento agregado. Total eventos ahora:`, eventosData.length)
    } else if (tieneHorasExtraEnEventos) {
      console.log(`[LIQUIDACION] Ya hay horas extra en eventos mensuales, no se agregan desde ajustes`)
    } else if (totalHorasExtraDeAjustes === 0) {
      console.log(`[LIQUIDACION] No hay horas extra en ajustes de turno para este mes`)
    }

    // Preparar datos del empleado
    const empleadoData: EmpleadoLiquidacionData = {
      tipoRemuneracion: empleado.tipoRemuneracion || empleado.tipoSueldo || 'MENSUAL',
      sueldoBaseMensual: empleado.sueldoBaseMensual || empleado.sueldo || undefined,
      valorJornal: empleado.valorJornal || undefined,
      valorHoraNormal: empleado.valorHoraNormal || undefined,
      valorHoraExtra: empleado.valorHoraExtra || undefined,
      ticketAlimentacion: empleado.ticketAlimentacion || false,
      valorTicketDiario: empleado.valorTicketDiario || undefined,
    }

    // Validar que el empleado tenga sueldo configurado
    if (empleadoData.tipoRemuneracion === 'MENSUAL' && !empleadoData.sueldoBaseMensual) {
      return NextResponse.json(
        { error: 'El empleado no tiene sueldo base mensual configurado' },
        { status: 400 }
      )
    }
    if (empleadoData.tipoRemuneracion === 'JORNAL' && !empleadoData.valorJornal) {
      return NextResponse.json(
        { error: 'El empleado no tiene valor jornal configurado' },
        { status: 400 }
      )
    }

    // Calcular liquidación
    const resultado = calcularLiquidacion(
      empleadoData,
      eventosData,
      mes,
      anio,
      body.irpfAdelantado ? parseFloat(body.irpfAdelantado) : undefined,
      body.irpfMesesSinIRPF ? parseInt(body.irpfMesesSinIRPF) : undefined
    )

    // Crear o actualizar liquidación
    const liquidacion = await prisma.liquidacionProfesional.upsert({
      where: {
        empleadoId_restauranteId_mes_anio: {
          empleadoId: body.empleadoId,
          restauranteId: body.restauranteId,
          mes,
          anio,
        },
      },
      create: {
        empleadoId: body.empleadoId,
        restauranteId: body.restauranteId,
        mes,
        anio,
        fechaCierre: new Date(),
        nominalCalculado: resultado.nominalCalculado,
        sueldoBasico: resultado.sueldoBasico,
        jornalesDescontados: resultado.jornalesDescontados,
        horasExtras: resultado.horasExtras,
        montoHorasExtras: resultado.montoHorasExtras,
        ticketAlimentacion: resultado.ticketAlimentacion,
        diasTicket: resultado.diasTicket,
        totalHaberes: resultado.totalHaberes,
        totalGravado: resultado.totalGravado,
        aporteJubilatorio: resultado.aporteJubilatorio,
        frl: resultado.frl,
        seguroEnfermedad: resultado.seguroEnfermedad,
        snis: resultado.snis,
        irpfBaseImponible: resultado.irpfBaseImponible,
        irpfAdelantado: body.irpfAdelantado ? parseFloat(body.irpfAdelantado) : null,
        irpfMesesSinIRPF: body.irpfMesesSinIRPF ? parseInt(body.irpfMesesSinIRPF) : null,
        irpfMonto: resultado.irpfMonto,
        totalDescuentosLegales: resultado.totalDescuentosLegales,
        adelantosEfectivo: resultado.adelantosEfectivo,
        adelantosConsumiciones: resultado.adelantosConsumiciones,
        descuentosManuales: resultado.descuentosManuales,
        totalDescuentosGenerales: resultado.totalDescuentosGenerales,
        totalDescuentos: resultado.totalDescuentos,
        liquidoACobrar: resultado.liquidoACobrar,
        redondeo: resultado.redondeo || null,
        observaciones: body.observaciones || null,
      },
      update: {
        fechaCierre: new Date(),
        nominalCalculado: resultado.nominalCalculado,
        sueldoBasico: resultado.sueldoBasico,
        jornalesDescontados: resultado.jornalesDescontados,
        horasExtras: resultado.horasExtras,
        montoHorasExtras: resultado.montoHorasExtras,
        ticketAlimentacion: resultado.ticketAlimentacion,
        diasTicket: resultado.diasTicket,
        totalHaberes: resultado.totalHaberes,
        totalGravado: resultado.totalGravado,
        aporteJubilatorio: resultado.aporteJubilatorio,
        frl: resultado.frl,
        seguroEnfermedad: resultado.seguroEnfermedad,
        snis: resultado.snis,
        irpfBaseImponible: resultado.irpfBaseImponible,
        irpfAdelantado: body.irpfAdelantado ? parseFloat(body.irpfAdelantado) : null,
        irpfMesesSinIRPF: body.irpfMesesSinIRPF ? parseInt(body.irpfMesesSinIRPF) : null,
        irpfMonto: resultado.irpfMonto,
        totalDescuentosLegales: resultado.totalDescuentosLegales,
        adelantosEfectivo: resultado.adelantosEfectivo,
        adelantosConsumiciones: resultado.adelantosConsumiciones,
        descuentosManuales: resultado.descuentosManuales,
        totalDescuentosGenerales: resultado.totalDescuentosGenerales,
        totalDescuentos: resultado.totalDescuentos,
        liquidoACobrar: resultado.liquidoACobrar,
        liquidoPactado: resultado.liquidoPactado,
        diferenciaLiquido: resultado.diferenciaLiquido,
        redondeo: resultado.redondeo || null,
        observaciones: body.observaciones || null,
      },
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            cargo: true,
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

    return NextResponse.json(liquidacion, { status: 201 })
  } catch (error) {
    console.error('Error al generar liquidación:', error)
    return NextResponse.json(
      { error: 'Error al generar liquidación: ' + (error instanceof Error ? error.message : 'Error desconocido') },
      { status: 500 }
    )
  }
}
