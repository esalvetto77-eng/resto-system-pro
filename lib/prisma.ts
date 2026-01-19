// Cliente de Prisma (singleton para evitar múltiples conexiones)
// IMPORTANTE: En Vercel, cada instancia puede tener su propio Prisma Client
// El singleton previene múltiples instancias en el mismo proceso
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// En producción (Vercel), no persistimos en global para evitar estado cruzado entre requests
// Cada request obtiene una nueva instancia si no existe en global
// Esto previene problemas de caché o estado compartido entre usuarios
const isDevelopment = process.env.NODE_ENV === 'development'
const isVercel = process.env.VERCEL === '1'

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  })

// Solo persistir en global en desarrollo (local)
// En Vercel/producción, no persistimos para evitar estado compartido entre requests
if (isDevelopment && !isVercel) {
  globalForPrisma.prisma = prisma
}
