'use client'
import React from 'react'
import CompetenciesItem from './competencies.item'
import { Badge } from '@/components/shared/elements/badge'
import Autoplay from 'embla-carousel-autoplay'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/shared/elements/carousel'

type Competencies = {
  title: string
  description: string
  thumbnail?: string
}

interface CoreCompetenciesProps {
  label: string
  competencies: Competencies[]
}

const CoreCompetencies = ({ label, competencies }: CoreCompetenciesProps) => {
  const plugin = React.useRef(
    Autoplay({ delay: 6000, stopOnInteraction: true })
  )

  return (
    <>
      <section itemScope itemType='https://schema.org/DefinedTermSet'>
        <div className='grid place-content-center'>
          <Badge className='text-xs' variant='secondary' asChild>
            <span itemProp='name' content={label}>
              {label}
            </span>
          </Badge>
        </div>
        <Carousel
          plugins={[plugin.current]}
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            align: 'center',
            loop: true
          }}
          className='w-full'
        >
          <CarouselContent className='w-full ml-0'>
            {competencies.map(competency => (
              <CarouselItem key={competency.title} className='pl-0'>
                <CompetenciesItem
                  name={competency.title}
                  description={competency.description}
                  thumbnail={competency?.thumbnail}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext className='absolute right-0 border-none opacity-50' />
          <CarouselPrevious className='absolute left-0 border-none opacity-50' />
        </Carousel>
      </section>
    </>
  )
}

export default CoreCompetencies
