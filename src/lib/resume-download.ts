import { resumeDocuments } from './portfolio-content'
import { isResumeTarget } from './site-content'
import { getSiteContent } from './site-content-store'

export async function resumeDownload(variant: 'standard' | 'ats') {
  const { resume } = await getSiteContent()
  const env = variant === 'standard' ? process.env.RESUME_URL : process.env.RESUME_DETAILED_URL
  const configured = env?.trim()
  const file = resumeDocuments[variant === 'standard' ? 0 : 1].file
  const target = resume[variant].href || (configured && isResumeTarget(configured) ? configured : file)
  const url = new URL(target, 'https://adazol.com')
  // Keep bundled and custom site paths on the host that handled the request.
  const location = target.startsWith('/') ? url.pathname + url.search + url.hash : url.href
  return new Response(null, {
    status: 307,
    headers: { Location: location, 'Cache-Control': 'no-store' }
  })
}
