// Script para crear usuarios en producción (Vercel)
// Ejecutar: npx ts-node scripts/crear-usuarios-produccion.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Creando usuarios en la base de datos...\n')

  // Usuario Dueño (ADMIN/DUENO)
  const duenoEmail = 'dueno@resto.com'
  const duenoPassword = '123456'
  
  const duenoExists = await prisma.usuario.findUnique({
    where: { email: duenoEmail },
  })

  if (!duenoExists) {
    const hashedDuenoPassword = await bcrypt.hash(duenoPassword, 10)
    await prisma.usuario.create({
      data: {
        nombre: 'Dueño',
        email: duenoEmail,
        password: hashedDuenoPassword,
        rol: 'DUENO',
        activo: true,
      },
    })
    console.log('✅ Usuario DUEÑO creado exitosamente')
    console.log(`   Email: ${duenoEmail}`)
    console.log(`   Contraseña: ${duenoPassword}\n`)
  } else {
    console.log('⚠️  Usuario DUEÑO ya existe en la base de datos\n')
  }

  // Usuario Encargado
  const encargadoEmail = 'encargado@resto.com'
  const encargadoPassword = '123456'
  
  const encargadoExists = await prisma.usuario.findUnique({
    where: { email: encargadoEmail },
  })

  if (!encargadoExists) {
    const hashedEncargadoPassword = await bcrypt.hash(encargadoPassword, 10)
    await prisma.usuario.create({
      data: {
        nombre: 'Encargado',
        email: encargadoEmail,
        password: hashedEncargadoPassword,
        rol: 'ENCARGADO',
        activo: true,
      },
    })
    console.log('✅ Usuario ENCARGADO creado exitosamente')
    console.log(`   Email: ${encargadoEmail}`)
    console.log(`   Contraseña: ${encargadoPassword}\n`)
  } else {
    console.log('⚠️  Usuario ENCARGADO ya existe en la base de datos\n')
  }

  console.log('🎉 Proceso completado!')
  console.log('\n📋 RESUMEN DE CREDENCIALES:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 DUEÑO (Administrador):')
  console.log(`   Email: ${duenoEmail}`)
  console.log(`   Contraseña: ${duenoPassword}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 ENCARGADO:')
  console.log(`   Email: ${encargadoEmail}`)
  console.log(`   Contraseña: ${encargadoPassword}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error al crear usuarios:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
