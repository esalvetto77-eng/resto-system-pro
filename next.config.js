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
      '@': rootPath,
    }
    // Agregar módulos para que webpack busque en raíz y src
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      rootPath,
      path.resolve(rootPath, 'src'),
    ]
    return config
  },
}

module.exports = nextConfig
