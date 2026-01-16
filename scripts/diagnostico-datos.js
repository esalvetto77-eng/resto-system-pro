// Script de diagnóstico para verificar datos en la base de datos
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function diagnostico() {
  console.log('=== DIAGNÓSTICO DE DATOS ===\n')

  try {
    // 1. Verificar restaurantes
    const restaurantes = await prisma.restaurante.findMany({
      where: { activo: true },
    })
    console.log(`✅ Restaurantes activos: ${restaurantes.length}`)
    restaurantes.forEach(r => {
      console.log(`   - ${r.nombre} (ID: ${r.id})`)
    })

    // 2. Verificar empleados
    const empleados = await prisma.empleado.findMany({
      where: { activo: true },
      include: {
        restaurantes: {
          include: {
            restaurante: true,
          },
        },
      },
    })
    console.log(`\n✅ Empleados activos: ${empleados.length}`)
    empleados.forEach(e => {
      const restaurantesStr = e.restaurantes.length > 0
        ? e.restaurantes.map(r => r.restaurante.nombre).join(', ')
        : 'Sin restaurante asignado'
      console.log(`   - ${e.nombre} ${e.apellido} (Restaurantes: ${restaurantesStr})`)
    })

    // 3. Verificar productos
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: {
        proveedores: {
          include: {
            proveedor: true,
          },
        },
      },
    })
    console.log(`\n✅ Productos activos: ${productos.length}`)
    productos.forEach(p => {
      const proveedoresStr = p.proveedores.length > 0
        ? p.proveedores.map(pp => pp.proveedor.nombre).join(', ')
        : 'Sin proveedores'
      console.log(`   - ${p.nombre} (Proveedores: ${proveedoresStr})`)
    })

    // 4. Verificar inventario
    const inventario = await prisma.inventario.findMany({
      include: {
        producto: {
          include: {
            proveedores: {
              include: {
                proveedor: true,
              },
              take: 1,
            },
          },
        },
      },
    })
    console.log(`\n✅ Items de inventario: ${inventario.length}`)
    inventario.forEach(i => {
      const proveedor = i.producto.proveedores?.[0]?.proveedor?.nombre || 'Sin proveedor'
      console.log(`   - ${i.producto.nombre}: ${i.stockActual} ${i.producto.unidad} (Proveedor: ${proveedor})`)
    })

    // 5. Verificar proveedores
    const proveedores = await prisma.proveedor.findMany({
      where: { activo: true },
    })
    console.log(`\n✅ Proveedores activos: ${proveedores.length}`)
    proveedores.forEach(p => {
      console.log(`   - ${p.nombre}`)
    })

    // 6. Verificar relaciones Empleado-Restaurante
    const relaciones = await prisma.empleadoRestaurante.findMany({
      include: {
        empleado: true,
        restaurante: true,
      },
    })
    console.log(`\n✅ Relaciones Empleado-Restaurante: ${relaciones.length}`)
    relaciones.forEach(r => {
      console.log(`   - ${r.empleado.nombre} ${r.empleado.apellido} <-> ${r.restaurante.nombre}`)
    })

    console.log('\n=== FIN DEL DIAGNÓSTICO ===')
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnostico()
