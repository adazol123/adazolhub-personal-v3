import { availabilityPayload } from '@/_temp/information.temp'
import { Button } from '@/components/shared/elements/button'
import { IconArrowRight } from '@tabler/icons-react'
import Link from 'next/link'
import React from 'react'

const GetInTouchSection = () => {
  return (
    <div className='-mx-4 min-h-[20-dvh] bg-gradient-to-bl from-foreground/80 via-foreground to-foreground/80 text-background py-10'>
      <div className='flex justify-between flex-wrap gap-4 container max-w-prose px-4 sm:px-0 mx-auto'>
        <div>
          <h1 className='font-bold text-2xl max-w-[20ch]'>
            {availabilityPayload.cta2.title}
          </h1>
          <p className='text-sm text-neutral-500 max-w-[60ch] leading-relaxed'>
            {availabilityPayload.cta2.description}
          </p>
        </div>
        <Button asChild className='bg-accent'>
          <Link href='/contact'>
            Get in touch <IconArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default GetInTouchSection
