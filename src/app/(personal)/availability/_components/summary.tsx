'use client'
import { cn } from '@/lib/utils'
import React from 'react'

type SummarySectionProps = {
  label: string
  summary: string
}

const SummarySection = ({ label, summary }: SummarySectionProps) => {
  const [seeMore, setSeeMore] = React.useState(false)
  const toggleReadMore = () => {
    setSeeMore(state => !state)
  }
  return (
    <div className='container max-w-prose mx-auto my-4 bg-white p-4 rounded-2xl transition-all'>
      <h3 className='text-forest-green-800 mb-2 font-medium text-sm'>
        {label}
      </h3>
      <p className='leading-relaxed text-neutral-500'>
        <span className={cn(seeMore ? 'line-clamp-none' : 'line-clamp-3')}>
          {summary}
        </span>
        <span
          className='underline text-accent underline-offset-2 cursor-pointer'
          onClick={toggleReadMore}
        >
          {seeMore ? 'Read less' : 'Read more'}
        </span>
      </p>
    </div>
  )
}

export default SummarySection
