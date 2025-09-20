import AnnouncementBanner from '@/components/ui/banners/annoucement.banner'
import React from 'react'

const AnnouncementsSection = () => {
  return (
    <AnnouncementBanner>
      <p className='sm:text-left text-xs'>
        🚧 This site is currently being upgraded from old{' '}
        <a
          href={`${process.env.DOMAIN_OLD_URL}/introduction`}
          target='_blank'
          rel='noopener noreferrer'
          className='underline underline-offset-4 hover:text-forest-green-100'
        >
          daniel.adazol.com
        </a>
      </p>
    </AnnouncementBanner>
  )
}

export default AnnouncementsSection
