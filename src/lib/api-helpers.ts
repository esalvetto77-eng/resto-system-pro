// Helpers para API Routes
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { formatZodErrors } from './validations'

// Tipos de respuesta de error estándar
export interface ApiError {
  error: string
  details?: string[]
  code?: string
}

// Crear respuesta de error estandarizada
export function errorResponse(
  message: string,
  status: number = 500,
  details?: string[],
  code?: string
): NextResponse<ApiError> {
  const error: ApiError = { error: message }
  if (details && details.length > 0) {
    error.details = details
  }
  if (code) {
    error.code = code
  }
  return NextResponse.json(error, { status })
}

// Manejar errores de validación Zod
export function validationErrorResponse(error: z.ZodError): NextResponse<ApiError> {
  const details = formatZodErrors(error)
  return errorResponse('Error de validación', 400, details, 'VALIDATION_ERROR')
}

// Manejar errores de base de datos (Prisma)
export function handleDatabaseError(error: unknown): NextResponse<ApiError> {
  console.error('Error de base de datos:', error)
  
  // Errores conocidos de Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any }
    
    switch (prismaError.code) {
      case 'P2002':
        return errorResponse(
          'Ya existe un registro con este valor único',
          409,
          undefined,
          'UNIQUE_CONSTRAINT_VIOLATION'
        )
      case 'P2025':
        return errorResponse(
          'Registro no encontrado',
          404,
          undefined,
          'RECORD_NOT_FOUND'
        )
      case 'P2003':
        return errorResponse(
          'Error de integridad referencial',
          400,
          undefined,
          'FOREIGN_KEY_CONSTRAINT'
        )
    }
  }
  
  // Error genérico
  const message = error instanceof Error ? error.message : 'Error desconocido de base de datos'
  return errorResponse(message, 500, undefined, 'DATABASE_ERROR')
}

// Manejar errores generales
export function handleError(error: unknown, context: string): NextResponse<ApiError> {
  console.error(`Error en ${context}:`, error)
  
  // Si es un error de validación Zod
  if (error instanceof z.ZodError) {
    return validationErrorResponse(error)
  }
  
  // Si es un error de base de datos, usar el helper específico
  if (error && typeof error === 'object' && 'code' in error) {
    return handleDatabaseError(error)
  }
  
  // Error genérico
  const message = error instanceof Error ? error.message : `Error desconocido en ${context}`
  return errorResponse(message, 500)
}

// Verificar que el body sea JSON válido
export async function parseJsonBody<T = unknown>(request: Request): Promise<T | null> {
  try {
    return await request.json()
  } catch (error) {
    return null
  }
}
