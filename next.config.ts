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
        destination: `${process.env.MEDIA_URL}/assets/:path`
      },
      {
        source: '/resume',
        destination: process.env.RESUME_URL
      },
      {
        source: '/old/:path',
        destination: `${process.env.DOMAIN_OLD_URL}/:path`
      },
      {
        source: '/_/chat',
        destination: `${process.env.API_URL}/chat`
      }
    ]
  }
}

export default nextConfig
