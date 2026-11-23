import { createContactHandler, getContactConfig } from '@/lib/portfolio-contact-server'

export const runtime = 'nodejs'

export const POST = createContactHandler({ getConfig: getContactConfig })
