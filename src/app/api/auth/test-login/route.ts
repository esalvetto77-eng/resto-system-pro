// Endpoint de prueba para verificar usuarios en la base de datos
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Buscar usuarios
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        password: true, // Solo para verificar que existe
      },
    })

    // Verificar si los usuarios de prueba existen
    const dueno = usuarios.find(u => u.email === 'dueno@resto.com')
    const encargado = usuarios.find(u => u.email === 'encargado@resto.com')

    // Probar contraseñas
    let duenoPasswordOk = false
    let encargadoPasswordOk = false

    if (dueno) {
      duenoPasswordOk = await bcrypt.compare('123456', dueno.password)
    }

    if (encargado) {
      encargadoPasswordOk = await bcrypt.compare('123456', encargado.password)
    }

    return NextResponse.json({
      totalUsuarios: usuarios.length,
      usuarios: usuarios.map(u => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        activo: u.activo,
      })),
      verificacion: {
        dueno: {
          existe: !!dueno,
          email: 'dueno@resto.com',
          passwordCorrecta: duenoPasswordOk,
          activo: dueno?.activo || false,
        },
        encargado: {
          existe: !!encargado,
          email: 'encargado@resto.com',
          passwordCorrecta: encargadoPasswordOk,
          activo: encargado?.activo || false,
        },
      },
    })
  } catch (error: any) {
    console.error('Error en test-login:', error)
    return NextResponse.json(
      {
        error: 'Error al verificar usuarios',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
