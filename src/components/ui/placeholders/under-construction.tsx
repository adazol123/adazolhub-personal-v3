import { IconBackhoe } from '@tabler/icons-react'
import React from 'react'

const UnderConstructionPlaceholder = ({
  description = "We're working hard to bring you something amazing! This page is currently under development and will be available soon. Thank you for your patience."
}) => {
  return (
    <div className='container grid place-content-center min-h-[50svh] mx-auto'>
      <div className='bg-forest-green-50 p-8 rounded-2xl grid place-content-center gap-4 text-center max-w-md'>
        <IconBackhoe className='h-16 w-16 stroke-1 mx-auto text-forest-green-600 animate-pulse' />
        <div className='space-y-2'>
          <h1 className='text-2xl font-semibold text-forest-green-800'>
            Under Construction
          </h1>
          <p className='text-forest-green-800 text-sm leading-relaxed'>
            {description}
          </p>
          <p className='text-xs text-neutral-400 mt-4'>
            Expected completion: Coming Soon
          </p>
        </div>
      </div>
    </div>
  )
}

export default UnderConstructionPlaceholder
