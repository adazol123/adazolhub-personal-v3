'use client'
import { useBannerState } from '@/hooks/useBannerState'
import { IconX } from '@tabler/icons-react'
import React from 'react'

const AnnouncementBanner = ({ children }: { children: React.ReactNode }) => {
  const { showBanner, toggleBanner } = useBannerState()
  return (
    <>
      {showBanner && (
        <div className='bg-forest-green-950 text-background'>
          <div className='container max-w-prose mx-auto px-4 sm:px-0 py-2.5'>
            <div className='flex items-center-safe sm:items-center justify-between gap-2 text-[0.65rem] sm:text-xs'>
              {children}
              <div className='flex items-center gap-2'>
                <button
                  className='p-1 hover:bg-forest-green-800 rounded-full transition-colors cursor-pointer'
                  aria-label='Close announcement'
                  onClick={() => toggleBanner(false)}
                >
                  <IconX className='h-3 w-3' />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AnnouncementBanner
