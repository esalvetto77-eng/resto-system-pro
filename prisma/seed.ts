// Script de seed para datos iniciales de prueba
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de base de datos...')

  // Crear proveedores de ejemplo
  const proveedor1 = await prisma.proveedor.create({
    data: {
      nombre: 'Distribuidora de Pescados S.A.',
      contacto: 'Juan Pérez',
      telefono: '+54 11 1234-5678',
      email: 'contacto@pescados.com',
      direccion: 'Av. Corrientes 1234, CABA',
      diasPedido: JSON.stringify(['Lunes', 'Miércoles']),
      horarioPedido: '09:00-12:00',
      diasEntrega: JSON.stringify(['Martes', 'Jueves']),
      activo: true,
    },
  })

  const proveedor2 = await prisma.proveedor.create({
    data: {
      nombre: 'Arroces y Condimentos Premium',
      contacto: 'María González',
      telefono: '+54 11 2345-6789',
      email: 'ventas@arroces.com',
      direccion: 'Calle Falsa 456, CABA',
      diasPedido: JSON.stringify(['Martes']),
      horarioPedido: '10:00-14:00',
      diasEntrega: JSON.stringify(['Miércoles', 'Viernes']),
      activo: true,
    },
  })

  console.log('✅ Proveedores creados')

  // Crear productos de ejemplo
  const productos = [
    {
      nombre: 'Salmón Fresco',
      codigo: 'PES-001',
      descripcion: 'Salmón noruego premium',
      proveedorId: proveedor1.id,
      unidad: 'kg',
      stockMinimo: 10,
      precioCompra: 8500,
      activo: true,
    },
    {
      nombre: 'Atún Fresco',
      codigo: 'PES-002',
      descripcion: 'Atún de alta calidad',
      proveedorId: proveedor1.id,
      unidad: 'kg',
      stockMinimo: 8,
      precioCompra: 7200,
      activo: true,
    },
    {
      nombre: 'Arroz para Sushi',
      codigo: 'ARR-001',
      descripcion: 'Arroz japones premium',
      proveedorId: proveedor2.id,
      unidad: 'kg',
      stockMinimo: 20,
      precioCompra: 1200,
      activo: true,
    },
    {
      nombre: 'Alga Nori',
      codigo: 'CON-001',
      descripcion: 'Alga nori para sushi',
      proveedorId: proveedor2.id,
      unidad: 'paquete',
      stockMinimo: 15,
      precioCompra: 3500,
      activo: true,
    },
  ]

  const productosCreados = await Promise.all(
    productos.map((producto) => prisma.producto.create({ data: producto }))
  )

  console.log('✅ Productos creados')

  // Crear inventario inicial
  await Promise.all(
    productosCreados.map((producto, index) =>
      prisma.inventario.create({
        data: {
          productoId: producto.id,
          stockActual: producto.stockMinimo - (index * 2), // Algunos por debajo del mínimo
        },
      })
    )
  )

  console.log('✅ Inventario inicial creado')

  // Crear empleados de ejemplo
  const empleado1 = await prisma.empleado.create({
    data: {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      dni: '12345678',
      telefono: '+54 11 3456-7890',
      email: 'carlos@restaurant.com',
      tipoSueldo: 'MENSUAL',
      sueldo: 150000,
      activo: true,
    },
  })

  const empleado2 = await prisma.empleado.create({
    data: {
      nombre: 'Ana',
      apellido: 'Martínez',
      dni: '87654321',
      telefono: '+54 11 4567-8901',
      tipoSueldo: 'JORNAL',
      sueldo: 8000,
      activo: true,
    },
  })

  console.log('✅ Empleados creados')

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
