import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import RootTabs from '@/components/ui/navigations/root-tabs'
import Header from '@/components/ui/navigations/header'
import Footer from '@/components/ui/navigations/footer'
import AnnouncementBanner from '@/components/ui/banners/annoucement.banner'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Daniel Josaphat Lozada | Adazol - Personal',
  description:
    "Software Engineer with 3+ years' experience in full-stack development and 2+ years as a System Engineer providing technical support services. Specialized in backend technologies, cloud services, and scalable application development. Skilled in troubleshooting complex systems, delivering user-centric solutions, and collaborating with cross-functional teams to drive high-quality outcomes.",
  other: {
    'google-adsense-account': 'ca-pub-3357103377634730'
  }
}

export default function RootLayout ({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, user-scalable=no'
        />
        <meta name='google-adsense-account' content='ca-pub-3357103377634730' />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}
      >
        {/* Announcement Banner */}
        <AnnouncementBanner>
          <p className='sm:text-left text-xs'>
            🚧 This site is currently being upgraded from old{' '}
            <a
              href='https://daniel-lozada.web.app'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-4 hover:text-forest-green-100'
            >
              daniel.adazol.com
            </a>
          </p>
        </AnnouncementBanner>
        <main className='px-4 snap-y snap-mandatory'>
          <Header />
          {children}
          <RootTabs />
          <Footer />
        </main>
        {/* Gradient Background */}
        <div className='fixed inset-0 select-none -z-1' aria-hidden>
          <div className='absolute inset-x-0 -bottom-1/2 flex items-center justify-center'>
            <div className='w-[200vw] h-[200vw] max-w-[1200px] max-h-[1200px] rounded-full bg-gradient-radial from-forest-green-200  to-transparent opacity-0 animate-pulse-light transition-all'></div>
          </div>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
