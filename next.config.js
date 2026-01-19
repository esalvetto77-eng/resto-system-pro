const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configurar para servir archivos estáticos desde uploads
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/octet-stream',
          },
        ],
      },
    ]
  },

  // Optimizaciones para producción
  swcMinify: true,
  
  // Configuración de imágenes (si usas next/image en el futuro)
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Configurar webpack para resolver alias @/* correctamente en Vercel
  webpack: (config) => {
    const rootPath = path.resolve(__dirname)
    config.resolve.alias = {
      ...config.resolve.alias,
      // Alias específicos para resolver correctamente desde cualquier ubicación
      '@/components': path.resolve(rootPath, 'components'),
      '@/contexts': path.resolve(rootPath, 'src/contexts'),
      '@/lib': path.resolve(rootPath, 'src/lib'),
      '@': rootPath, // Fallback para otros casos
    }
    return config
  },
}

module.exports = nextConfig
