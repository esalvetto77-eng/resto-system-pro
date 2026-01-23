const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración experimental para manejar mejor las dependencias
  experimental: {
    serverComponentsExternalPackages: ['@vercel/blob'],
  },
  
  // Headers de seguridad
  async headers() {
    const cspReportOnly = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      // Next.js suele necesitar inline/eval (especialmente en dev); lo dejamos en Report-Only para no romper.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "object-src 'none'",
    ].join('; ')

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
      {
        // Aplicar headers de seguridad a todas las rutas
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            // CSP en modo Report-Only para máximo compatibilidad sin romper UI
            key: 'Content-Security-Policy-Report-Only',
            value: cspReportOnly,
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
  webpack: (config, { isServer }) => {
    const rootPath = path.resolve(__dirname)
    config.resolve.alias = {
      ...config.resolve.alias,
      // Alias específicos para resolver correctamente desde cualquier ubicación
      '@/components': path.resolve(rootPath, 'components'),
      '@/contexts': path.resolve(rootPath, 'src/contexts'),
      '@/lib': path.resolve(rootPath, 'src/lib'),
      // Alias específico para guards
      '@/components/guards': path.resolve(rootPath, 'components/guards'),
      '@': rootPath, // Fallback para otros casos
    }
    // Asegurar que webpack pueda resolver extensiones .tsx
    config.resolve.extensions = [...(config.resolve.extensions || []), '.ts', '.tsx', '.js', '.jsx']
    
    // Configurar para manejar mejor @vercel/blob y sus dependencias
    if (isServer) {
      // En el servidor, excluir undici del bundle
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('undici')
      } else if (typeof config.externals === 'object') {
        config.externals.undici = 'commonjs undici'
      }
    }
    
    return config
  },
}

module.exports = nextConfig
