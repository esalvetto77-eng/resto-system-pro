// Script para probar las APIs directamente
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAPIs() {
  try {
    console.log('🧪 Probando consultas directas a Prisma...\n')
    
    // Test 1: Empleados
    console.log('1. Probando empleados...')
    const empleados = await prisma.empleado.findMany({
      take: 3,
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
    })
    console.log(`   ✅ Encontrados ${empleados.length} empleados`)
    if (empleados.length > 0) {
      console.log(`   Ejemplo: ${empleados[0].nombre} ${empleados[0].apellido}`)
    }
    
    // Test 2: Productos
    console.log('\n2. Probando productos...')
    const productos = await prisma.producto.findMany({
      take: 3,
      include: {
        proveedores: {
          include: {
            proveedor: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        inventario: true,
      },
    })
    console.log(`   ✅ Encontrados ${productos.length} productos`)
    if (productos.length > 0) {
      console.log(`   Ejemplo: ${productos[0].nombre}`)
    }
    
    // Test 3: Proveedores
    console.log('\n3. Probando proveedores...')
    const proveedores = await prisma.proveedor.findMany({
      take: 3,
    })
    console.log(`   ✅ Encontrados ${proveedores.length} proveedores`)
    if (proveedores.length > 0) {
      console.log(`   Ejemplo: ${proveedores[0].nombre}`)
    }
    
    // Test 4: Inventario
    console.log('\n4. Probando inventario...')
    const inventario = await prisma.inventario.findMany({
      take: 3,
      include: {
        producto: {
          include: {
            proveedores: {
              include: {
                proveedor: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    })
    console.log(`   ✅ Encontrados ${inventario.length} items de inventario`)
    if (inventario.length > 0) {
      console.log(`   Ejemplo: ${inventario[0].producto?.nombre || 'N/A'}`)
    }
    
    // Test 5: Restaurantes
    console.log('\n5. Probando restaurantes...')
    const restaurantes = await prisma.restaurante.findMany({
      take: 3,
    })
    console.log(`   ✅ Encontrados ${restaurantes.length} restaurantes`)
    if (restaurantes.length > 0) {
      console.log(`   Ejemplo: ${restaurantes[0].nombre}`)
    }
    
    console.log('\n✅ Todas las consultas funcionaron correctamente')
    console.log('\n💡 Si las APIs no devuelven datos, el problema puede estar en:')
    console.log('   - El servidor no está corriendo')
    console.log('   - Hay errores en la consola del navegador')
    console.log('   - Las respuestas no se están parseando correctamente')
    
  } catch (error) {
    console.error('❌ Error en las consultas:', error)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testAPIs()
