'use server'
import { headers } from 'next/headers'

export const getServerDomain = async () => {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol =
    headersList.get('x-forwarded-proto') ||
    (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  return `${protocol}://${host}`
}
