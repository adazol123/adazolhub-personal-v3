import type { NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

const nextConfig = (phase: string): NextConfig => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  async headers() {
    return [{
      source: '/admin/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' }
      ]
    }]
  },
  async redirects() {
    const legacy = process.env.DOMAIN_OLD_URL || 'https://daniel-lozada.web.app'
    return [{ source: '/old/:path*', destination: `${legacy.replace(/\/$/, '')}/:path*`, permanent: false }]
  }
})

export default nextConfig
