import { Button } from '@/components/shared/elements/button'
import UnderConstructionPlaceholder from '@/components/ui/placeholders/under-construction'
import { IconExternalLink } from '@tabler/icons-react'
import Link from 'next/link'
import React from 'react'

const PortfolioPage = () => {
  return (
    <div>
      <UnderConstructionPlaceholder />
      <div className='container mx-auto max-w-prose text-center px-6'>
        <p className='text-sm text-forest-green-600 mb-4'>
          While we&apos;re working on bringing you an enhanced portfolio
          experience, you might want to check out my previous work showcase:
        </p>
        <Button variant='outline' asChild>
          <Link
            href='https://daniel-lozada.web.app/projects'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2'
          >
            Visit Previous Portfolio
            <IconExternalLink className='h-4 w-4' />
          </Link>
        </Button>
      </div>
    </div>
  )
}

//https://daniel-lozada.web.app/projects
export default PortfolioPage
