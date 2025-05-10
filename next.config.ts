import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { hostname: 'localhost' },
      { hostname: 'adazol.com' },
      { hostname: 'ik.imagekit.io' }
    ]
  },

  async rewrites () {
    return [
      {
        source: '/_/assets/:path',
        destination: `https://ik.imagekit.io/adazol/assets/:path`
      },
      {
        source: '/resume',
        destination:
          'https://firebasestorage.googleapis.com/v0/b/daniel-lozada.appspot.com/o/resume%2FDaniel%20Lozada%20-%20SE.pdf?alt=media&token=e094bf3f-032b-4b31-b069-a0d98f475d60'
      },
      {
        source: '/old/:path',
        destination: 'https://daniel-lozada.web.app/:path'
      }
    ]
  }
}

export default nextConfig
