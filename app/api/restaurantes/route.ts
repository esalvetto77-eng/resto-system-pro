// API Route para Restaurantes - Versión ultra simplificada
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: Listar todos los restaurantes
export async function GET() {
  try {
    const restaurantes = await prisma.restaurante.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(restaurantes)
  } catch (error: any) {
    console.error('Error en GET /api/restaurantes:', error?.message || String(error))
    return NextResponse.json([])
  }
}
