'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [results, setResults] = useState<any>({})

  async function testAPI(endpoint: string) {
    try {
      console.log(`Probando ${endpoint}...`)
      const response = await fetch(endpoint)
      const data = await response.json()
      
      setResults((prev: any) => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          ok: response.ok,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A',
          data: Array.isArray(data) ? data.slice(0, 2) : data, // Primeros 2 items
          error: !response.ok ? data : null,
        },
      }))
    } catch (error: any) {
      setResults((prev: any) => ({
        ...prev,
        [endpoint]: {
          error: error.message,
          stack: error.stack,
        },
      }))
    }
  }

  async function testAll() {
    setResults({})
    await Promise.all([
      testAPI('/api/empleados'),
      testAPI('/api/productos?activo=true'),
      testAPI('/api/proveedores'),
      testAPI('/api/inventario'),
      testAPI('/api/restaurantes'),
      testAPI('/api/pedidos'),
    ])
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Diagnóstico de APIs</h1>
      
      <button
        onClick={testAll}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Probar Todas las APIs
      </button>

      <div className="space-y-4">
        {Object.entries(results).map(([endpoint, result]: [string, any]) => (
          <div key={endpoint} className="border p-4 rounded">
            <h2 className="font-semibold">{endpoint}</h2>
            {result.error ? (
              <div className="text-red-600">
                <p>❌ Error: {result.error}</p>
                {result.stack && <pre className="text-xs mt-2">{result.stack}</pre>}
              </div>
            ) : (
              <div className="text-sm space-y-1">
                <p>Status: {result.status} {result.ok ? '✅' : '❌'}</p>
                <p>Es Array: {result.isArray ? '✅' : '❌'}</p>
                <p>Cantidad: {result.length}</p>
                {result.data && (
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
