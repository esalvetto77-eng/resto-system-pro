// Script para cambiar contraseñas de usuarios en producción
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

// Crear interfaz para leer desde consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function main() {
  console.log('🔐 Cambio de Contraseñas\n')
  console.log('Este script te permite cambiar las contraseñas de los usuarios.\n')

  // Listar usuarios existentes
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
    },
    orderBy: {
      email: 'asc',
    },
  })

  if (usuarios.length === 0) {
    console.log('❌ No hay usuarios en la base de datos.')
    process.exit(1)
  }

  console.log('👥 Usuarios disponibles:')
  usuarios.forEach((u, index) => {
    console.log(`   ${index + 1}. ${u.nombre} (${u.email}) - ${u.rol}`)
  })
  console.log()

  // Seleccionar usuario
  const usuarioIndex = parseInt(await question('Selecciona el número del usuario (o 0 para cambiar todos): '), 10)

  if (usuarioIndex === 0) {
    // Cambiar contraseñas de todos los usuarios
    console.log('\n🔄 Cambiando contraseñas de TODOS los usuarios...\n')

    for (const usuario of usuarios) {
      const nuevaPassword = await question(`Nueva contraseña para ${usuario.nombre} (${usuario.email}): `)
      
      if (!nuevaPassword || nuevaPassword.length < 6) {
        console.log(`⚠️  Contraseña muy corta para ${usuario.email}. Mínimo 6 caracteres.`)
        continue
      }

      const confirmPassword = await question(`Confirma la contraseña para ${usuario.email}: `)
      
      if (nuevaPassword !== confirmPassword) {
        console.log(`❌ Las contraseñas no coinciden para ${usuario.email}.`)
        continue
      }

      const hashedPassword = await bcrypt.hash(nuevaPassword, 10)
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { password: hashedPassword },
      })

      console.log(`✅ Contraseña actualizada para ${usuario.email}\n`)
    }
  } else if (usuarioIndex >= 1 && usuarioIndex <= usuarios.length) {
    // Cambiar contraseña de un usuario específico
    const usuario = usuarios[usuarioIndex - 1]
    console.log(`\n🔄 Cambiando contraseña para: ${usuario.nombre} (${usuario.email})\n`)

    const nuevaPassword = await question('Nueva contraseña (mínimo 6 caracteres): ')
    
    if (!nuevaPassword || nuevaPassword.length < 6) {
      console.log('❌ La contraseña debe tener al menos 6 caracteres.')
      process.exit(1)
    }

    const confirmPassword = await question('Confirma la contraseña: ')
    
    if (nuevaPassword !== confirmPassword) {
      console.log('❌ Las contraseñas no coinciden.')
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(nuevaPassword, 10)
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashedPassword },
    })

    console.log(`\n✅ Contraseña actualizada exitosamente para ${usuario.email}`)
    console.log(`   Email: ${usuario.email}`)
    console.log(`   Nueva contraseña: ${'*'.repeat(nuevaPassword.length)}`)
  } else {
    console.log('❌ Selección inválida.')
    process.exit(1)
  }

  console.log('\n🎉 Proceso completado!')
}

main()
  .catch((e) => {
    console.error('❌ Error al cambiar contraseñas:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    rl.close()
  })
