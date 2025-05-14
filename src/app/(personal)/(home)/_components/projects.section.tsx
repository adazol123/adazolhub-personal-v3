import { Badge } from '@/components/shared/elements/badge'
import { Button } from '@/components/shared/elements/button'
import UnderConstructionPlaceholder from '@/components/ui/placeholders/under-construction'
import { IconArrowRight } from '@tabler/icons-react'
import Link from 'next/link'
import React from 'react'

const ProjectSection = () => {
  return (
    <section>
      <div className='grid place-content-center'>
        <Badge className='text-xs' variant='secondary' asChild>
          <span>Projects</span>
        </Badge>
      </div>
      <UnderConstructionPlaceholder />
      <div className='grid place-content-center'>
        <Button asChild>
          <Link href='/portfolio'>
            Check Portfolio <IconArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  )
}

export default ProjectSection
