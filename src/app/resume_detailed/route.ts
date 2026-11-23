import { resumeDownload } from '@/lib/resume-download'

export const dynamic = 'force-dynamic'

export function GET() {
  return resumeDownload('ats')
}
