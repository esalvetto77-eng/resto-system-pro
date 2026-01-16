// Script para probar las APIs directamente con Prisma
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAPIs() {
  console.log('=== PROBANDO CONSULTAS DIRECTAS ===\n')

  try {
    // Test 1: Restaurantes
    console.log('1. Probando restaurantes...')
    const restaurantes = await prisma.restaurante.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })
    console.log(`   ✅ Restaurantes: ${restaurantes.length}`)
    restaurantes.forEach(r => console.log(`      - ${r.nombre}`))

    // Test 2: Empleados sin filtro
    console.log('\n2. Probando empleados sin filtro...')
    const empleadosSinFiltro = await prisma.empleado.findMany({
      where: {},
      include: {
        restaurantes: {
          include: {
            restaurante: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { apellido: 'asc' },
    })
    console.log(`   ✅ Empleados: ${empleadosSinFiltro.length}`)

    // Test 3: Empleados con filtro activo
    console.log('\n3. Probando empleados con filtro activo=true...')
    const empleadosActivos = await prisma.empleado.findMany({
      where: { activo: true },
      include: {
        restaurantes: {
          include: {
            restaurante: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { apellido: 'asc' },
    })
    console.log(`   ✅ Empleados activos: ${empleadosActivos.length}`)

    // Test 4: Empleados con filtro de restaurante
    console.log('\n4. Probando empleados con filtro de restaurante...')
    const restauranteId = restaurantes[0]?.id
    if (restauranteId) {
      const where = {
        AND: [
          { activo: true },
          {
            OR: [
              {
                restaurantes: {
                  some: {
                    restauranteId: restauranteId,
                  },
                },
              },
              {
                restaurantes: {
                  none: {},
                },
              },
            ],
          },
        ],
      }
      const empleadosConRestaurante = await prisma.empleado.findMany({
        where,
        include: {
          restaurantes: {
            include: {
              restaurante: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: { apellido: 'asc' },
      })
      console.log(`   ✅ Empleados con filtro restaurante: ${empleadosConRestaurante.length}`)
    }

    console.log('\n=== TODAS LAS PRUEBAS COMPLETADAS ===')
  } catch (error) {
    console.error('❌ Error en pruebas:', error)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testAPIs()
