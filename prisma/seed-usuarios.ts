// Script para crear usuario admin inicial
// Ejecutar con: npx ts-node prisma/seed-usuarios.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // Crear usuario admin si no existe
  const adminExists = await prisma.usuario.findUnique({
    where: { email: 'admin@restaurante.com' },
  })

  if (!adminExists) {
    await prisma.usuario.create({
      data: {
        nombre: 'Administrador',
        email: 'admin@restaurante.com',
        password: hashedPassword,
        rol: 'ADMIN',
        activo: true,
      },
    })
    console.log('✅ Usuario admin creado:')
    console.log('   Email: admin@restaurante.com')
    console.log(`   Contraseña: ${adminPassword}`)
  } else {
    console.log('⚠️  Usuario admin ya existe')
  }

  // Crear usuario encargado de ejemplo
  const encargadoExists = await prisma.usuario.findUnique({
    where: { email: 'encargado@restaurante.com' },
  })

  if (!encargadoExists) {
    const encargadoPassword = process.env.ENCARGADO_PASSWORD || 'encargado123'
    const hashedEncargadoPassword = await bcrypt.hash(encargadoPassword, 10)

    await prisma.usuario.create({
      data: {
        nombre: 'Encargado',
        email: 'encargado@restaurante.com',
        password: hashedEncargadoPassword,
        rol: 'ENCARGADO',
        activo: true,
      },
    })
    console.log('✅ Usuario encargado creado:')
    console.log('   Email: encargado@restaurante.com')
    console.log(`   Contraseña: ${encargadoPassword}`)
  } else {
    console.log('⚠️  Usuario encargado ya existe')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
