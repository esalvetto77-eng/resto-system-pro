// Endpoint para verificar usuarios en la base de datos
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Buscar TODOS los usuarios
    const todosUsuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        password: true, // Solo para verificar
      },
    })

    // Buscar usuarios específicos
    const dueno = todosUsuarios.find(u => 
      u.email === 'dueno@resto.com' || 
      u.email?.toLowerCase() === 'dueno@resto.com'
    )
    const encargado = todosUsuarios.find(u => 
      u.email === 'encargado@resto.com' || 
      u.email?.toLowerCase() === 'encargado@resto.com'
    )

    // Verificar contraseñas
    let duenoPasswordOk = false
    let encargadoPasswordOk = false
    let duenoError = null
    let encargadoError = null

    if (dueno) {
      try {
        duenoPasswordOk = await bcrypt.compare('123456', dueno.password)
      } catch (e: any) {
        duenoError = e.message
      }
    }

    if (encargado) {
      try {
        encargadoPasswordOk = await bcrypt.compare('123456', encargado.password)
      } catch (e: any) {
        encargadoError = e.message
      }
    }

    return NextResponse.json({
      conexion: {
        estado: 'OK',
        totalUsuarios: todosUsuarios.length,
      },
      usuarios: todosUsuarios.map(u => ({
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
          encontradoConEmail: dueno?.email || null,
          rol: dueno?.rol || null,
          activo: dueno?.activo ?? null,
          passwordCorrecta: duenoPasswordOk,
          error: duenoError,
        },
        encargado: {
          existe: !!encargado,
          email: 'encargado@resto.com',
          encontradoConEmail: encargado?.email || null,
          rol: encargado?.rol || null,
          activo: encargado?.activo ?? null,
          passwordCorrecta: encargadoPasswordOk,
          error: encargadoError,
        },
      },
      instrucciones: {
        paraLogin: {
          dueno: {
            email: 'dueno@resto.com',
            password: '123456',
            debeFuncionar: dueno && duenoPasswordOk && dueno.activo,
          },
          encargado: {
            email: 'encargado@resto.com',
            password: '123456',
            debeFuncionar: encargado && encargadoPasswordOk && encargado.activo,
          },
        },
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('[TEST-USERS] Error:', error)
    return NextResponse.json({
      error: 'Error al verificar usuarios',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      conexion: {
        estado: 'ERROR',
        mensaje: 'No se pudo conectar a la base de datos',
      },
    }, { status: 500 })
  }
}
