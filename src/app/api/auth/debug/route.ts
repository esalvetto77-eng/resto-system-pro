// Endpoint de debug para validar el sistema de roles
// Úsalo para verificar que todo funciona correctamente
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSessionCookieNames, hasSessionSecret } from '@/lib/session'

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Permitir acceso sin autenticación para diagnóstico
  try {
    const cookieStore = await cookies()
    const { primary, legacy } = getSessionCookieNames()
    const cookieValue = cookieStore.get(primary)?.value ?? cookieStore.get(legacy)?.value
    const userIdFromCookie = cookieValue || null

    // Obtener usuario desde getCurrentUser (método que usan todas las APIs)
    const user = await getCurrentUser()

    // Obtener usuario directamente de DB para comparar
    let userFromDB = null
    if (userIdFromCookie) {
      userFromDB = await prisma.usuario.findUnique({
        where: { id: userIdFromCookie },
        select: {
          id: true,
          email: true,
          rol: true,
          activo: true,
        },
      })
    }

    // Listar TODOS los usuarios en la base de datos (para diagnóstico)
    const todosLosUsuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Detectar ambiente
    const isVercel = process.env.VERCEL === '1'
    const isProduction = process.env.NODE_ENV === 'production' || isVercel
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      ambiente: {
        nodeEnv: process.env.NODE_ENV || 'undefined',
        vercel: isVercel ? 'Sí' : 'No',
        produccion: isProduction ? 'Sí' : 'No',
        runtime: 'nodejs', // Siempre Node.js para Prisma
      },
      cookie: {
        userId: userIdFromCookie || 'NO HAY COOKIE',
        nota: 'Solo userId se guarda en cookie, NO el rol',
        sessionSecretConfigurado: hasSessionSecret(),
        cookieNames: { primary, legacy },
        config: {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
        },
      },
      getCurrentUser: {
        usuario: user ? {
          id: user.id,
          email: user.email,
          rol: user.rol,
        } : null,
        esAdmin: isAdmin(user),
        fuente: 'getCurrentUser() -> Consulta DB vía Prisma',
      },
      consultaDirectaDB: {
        usuario: userFromDB ? {
          id: userFromDB.id,
          email: userFromDB.email,
          rol: userFromDB.rol,
          activo: userFromDB.activo,
        } : null,
        fuente: 'Consulta directa a DB para comparar',
      },
      validacion: {
        coinciden: user && userFromDB 
          ? user.rol === userFromDB.rol && user.id === userFromDB.id
          : false,
        mensaje: user && userFromDB && user.rol === userFromDB.rol
          ? '✅ FUENTE DE VERDAD CONSISTENTE: getCurrentUser y DB coinciden'
          : user && userFromDB
          ? '❌ INCONSISTENCIA DETECTADA: Los valores no coinciden'
          : '⚠️ No hay usuario autenticado',
      },
      conclusion: {
        fuenteVerdad: 'Base de Datos (PostgreSQL/SQLite vía Prisma)',
        cuandoSeConsulta: 'En cada request que llama a getCurrentUser()',
        dondeSeGuarda: 'Frontend: Estado React (actualizado vía /api/auth/me)',
        dondeNOSeGuarda: 'Cookie (solo userId, no rol)',
        ventaja: 'Si el rol cambia en DB, se refleja en el siguiente request',
      },
      usuariosEnDB: {
        total: todosLosUsuarios.length,
        lista: todosLosUsuarios,
        usuariosEsperados: {
          dueno: {
            email: 'dueno@resto.com',
            existe: todosLosUsuarios.some(u => u.email === 'dueno@resto.com'),
          },
          encargado: {
            email: 'encargado@resto.com',
            existe: todosLosUsuarios.some(u => u.email === 'encargado@resto.com'),
          },
        },
      },
    }

    return NextResponse.json(debugInfo, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[DEBUG] Error en /api/auth/debug:', error)
    return NextResponse.json(
      {
        error: 'Error al obtener información de debug',
        detalles: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
