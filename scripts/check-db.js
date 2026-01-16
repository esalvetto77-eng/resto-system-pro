// Script para verificar si hay datos en la base de datos
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Verificando base de datos...\n')
    
    const restaurantes = await prisma.restaurante.count()
    const empleados = await prisma.empleado.count()
    const proveedores = await prisma.proveedor.count()
    const productos = await prisma.producto.count()
    const inventario = await prisma.inventario.count()
    const pedidos = await prisma.pedido.count()
    
    console.log('📊 Estado de la base de datos:')
    console.log(`   Restaurantes: ${restaurantes}`)
    console.log(`   Empleados: ${empleados}`)
    console.log(`   Proveedores: ${proveedores}`)
    console.log(`   Productos: ${productos}`)
    console.log(`   Inventario: ${inventario}`)
    console.log(`   Pedidos: ${pedidos}`)
    
    if (restaurantes === 0 && empleados === 0 && proveedores === 0 && productos === 0) {
      console.log('\n⚠️  La base de datos está vacía.')
      console.log('💡 Para agregar datos de ejemplo, ejecuta: npm run db:seed')
    } else {
      console.log('\n✅ La base de datos tiene datos.')
    }
  } catch (error) {
    console.error('❌ Error al verificar base de datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
