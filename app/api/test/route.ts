import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// CRÍTICO: Usar Node.js runtime para Prisma (no Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await prisma.test.findMany()
    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Error conectando a la base de datos" },
      { status: 500 }
    )
  }
}
