import { infoPayload } from '@/_temp/information.temp'
import React from 'react'

const SummarySection = () => {
  return (
    <div className='container max-w-prose mx-auto'>
      <h3 className='text-xs text-neutral-400 mb-1'>
        {infoPayload.summary_label}
      </h3>
      <p>{infoPayload.summary}</p>
    </div>
  )
}

export default SummarySection
