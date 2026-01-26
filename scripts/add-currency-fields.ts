// Script para agregar campos de moneda a la tabla producto_proveedor
// Ejecutar: npx tsx scripts/add-currency-fields.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Agregando campos de moneda a producto_proveedor...')
  
  try {
    // Agregar columnas si no existen
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "producto_proveedor" 
      ADD COLUMN IF NOT EXISTS "moneda" TEXT DEFAULT 'UYU',
      ADD COLUMN IF NOT EXISTS "precioEnDolares" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "precioEnPesos" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "cotizacionUsada" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "fechaCotizacion" TIMESTAMP;
    `)
    
    console.log('✅ Campos de moneda agregados exitosamente')
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('✅ Los campos ya existen en la base de datos')
    } else {
      console.error('❌ Error al agregar campos:', error.message)
      throw error
    }
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
