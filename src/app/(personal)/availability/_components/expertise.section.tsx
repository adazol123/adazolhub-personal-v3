import { Icon, IconProps } from '@tabler/icons-react'
import React from 'react'
type ExpertiseSectionProps = {
  label: string
  expertises: {
    title: string
    description: string
    icons?: React.ForwardRefExoticComponent<
      IconProps & React.RefAttributes<Icon>
    >
  }[]
}

const ExpertiseSection = ({ label, expertises }: ExpertiseSectionProps) => {
  return (
    <div className='container mx-auto max-w-prose my-4 p-4 bg-white rounded-2xl'>
      <h3 className='from-forest-green-700 mb-3 font-medium text-sm'>
        {label}
      </h3>
      <div className='grid gap-6 mt-4'>
        {expertises.map(expertise => (
          <div
            key={expertise.title}
            className='flex gap-3 group transition-all duration-500 items-center'
          >
            {!!expertise?.icons && (
              <div className=' bg-forest-green-700/5 h-fit w-fit grid place-content-center p-4 rounded-full'>
                <expertise.icons className='text-accent size-6 stroke-1.5' />
              </div>
            )}
            <div className='select-none'>
              <p className='text-forest-green-700 text-sm group-hover:text-accent transition-all duration-500'>
                <strong>{expertise.title}</strong>
              </p>
              <span className='text-sm inline-flex text-neutral-500'>
                {expertise.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExpertiseSection
