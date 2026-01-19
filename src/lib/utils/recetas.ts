// Utilidades para cálculo de costos de recetas

interface IngredienteConPrecio {
  productoId: string
  producto: {
    nombre: string
    unidad: string
    proveedores: Array<{
      precioCompra: number | null
      ordenPreferencia: number
      proveedor: {
        id: string
        nombre: string
      }
    }>
  }
  cantidad: number
  notas?: string | null
}

interface CostoIngrediente {
  productoId: string
  nombre: string
  cantidad: number
  unidad: string
  precioUnitario: number | null
  costoTotal: number | null
  proveedor: {
    id: string
    nombre: string
  } | null
  notas?: string | null
}

interface CostoReceta {
  costoTotal: number
  costoPorPorcion: number
  ingredientes: CostoIngrediente[]
  ingredientesSinPrecio: string[]
}

/**
 * Calcula el costo de una receta basándose en los precios de los proveedores
 * Usa el precio del proveedor con orden de preferencia 1, o el más barato si hay múltiples precios
 */
export function calcularCostoReceta(
  ingredientes: IngredienteConPrecio[],
  porciones: number = 1
): CostoReceta {
  let costoTotal = 0
  const ingredientesConCosto: CostoIngrediente[] = []
  const ingredientesSinPrecio: string[] = []

  ingredientes.forEach((ing) => {
    // Buscar el precio del proveedor preferido (orden 1) o el más barato disponible
    const proveedoresConPrecio = ing.producto.proveedores.filter(
      (pp) => pp.precioCompra !== null && pp.precioCompra > 0
    )

    if (proveedoresConPrecio.length === 0) {
      // No hay precio disponible
      ingredientesSinPrecio.push(ing.producto.nombre)
      ingredientesConCosto.push({
        productoId: ing.productoId,
        nombre: ing.producto.nombre,
        cantidad: ing.cantidad,
        unidad: ing.producto.unidad,
        precioUnitario: null,
        costoTotal: null,
        proveedor: null,
        notas: ing.notas || undefined,
      })
      return
    }

    // Ordenar por preferencia primero, luego por precio
    const proveedorSeleccionado = proveedoresConPrecio.sort((a, b) => {
      // Primero por orden de preferencia
      if (a.ordenPreferencia !== b.ordenPreferencia) {
        return a.ordenPreferencia - b.ordenPreferencia
      }
      // Si tienen el mismo orden, elegir el más barato
      return (a.precioCompra || 0) - (b.precioCompra || 0)
    })[0]

    const precioUnitario = proveedorSeleccionado.precioCompra!
    const costoIngrediente = ing.cantidad * precioUnitario
    costoTotal += costoIngrediente

    ingredientesConCosto.push({
      productoId: ing.productoId,
      nombre: ing.producto.nombre,
      cantidad: ing.cantidad,
      unidad: ing.producto.unidad,
      precioUnitario,
      costoTotal: costoIngrediente,
      proveedor: {
        id: proveedorSeleccionado.proveedor.id,
        nombre: proveedorSeleccionado.proveedor.nombre,
      },
      notas: ing.notas || undefined,
    })
  })

  const costoPorPorcion = porciones > 0 ? costoTotal / porciones : 0

  return {
    costoTotal,
    costoPorPorcion,
    ingredientes: ingredientesConCosto,
    ingredientesSinPrecio,
  }
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value)
}
