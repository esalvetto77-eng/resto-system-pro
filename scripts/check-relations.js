// Script para verificar relaciones empleado-restaurante
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRelations() {
  try {
    console.log('🔍 Verificando relaciones...\n')
    
    const totalEmpleados = await prisma.empleado.count()
    const empleadosConRelacion = await prisma.empleadoRestaurante.count()
    const restaurantes = await prisma.restaurante.findMany({ take: 5 })
    
    console.log(`Total empleados: ${totalEmpleados}`)
    console.log(`Relaciones empleado-restaurante: ${empleadosConRelacion}`)
    console.log(`\nRestaurantes:`, restaurantes.map(r => ({ id: r.id, nombre: r.nombre })))
    
    // Verificar si hay empleados sin relación
    const empleadosSinRelacion = await prisma.empleado.findMany({
      where: {
        restaurantes: {
          none: {}
        }
      },
      take: 5
    })
    
    console.log(`\nEmpleados sin relación con restaurantes: ${empleadosSinRelacion.length}`)
    if (empleadosSinRelacion.length > 0) {
      console.log('Ejemplos:', empleadosSinRelacion.map(e => ({ id: e.id, nombre: `${e.nombre} ${e.apellido}` })))
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRelations()
