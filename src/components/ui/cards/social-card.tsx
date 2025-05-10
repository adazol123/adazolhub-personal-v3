import React, { createElement } from 'react'

type SocialCardProps = {
  label: string
  title: string
  description?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
} & React.ComponentProps<'div'>

const SocialCard = ({
  title,
  label,
  description,
  icon,
  ...rest
}: SocialCardProps) => {
  return (
    <div
      {...rest}
      className='flex justify-between min-w-3xs min-h-32 sm:max-w-96 bg-forest-green-900 text-background group hover:bg-gradient-to-tr hover:from-forest-green-700/40 p-4 rounded-2xl items-center transition-all'
    >
      <div className='flex flex-col h-full justify-between py-1'>
        <h4 className='text-xs text-neutral-600 group-hover:text-accent select-none'>
          {label}
        </h4>
        <div>
          <h3 className='font-semibold select-none'>{title}</h3>
          <p className='text-[0.6rem] text-neutral-500 select-none opacity-50'>
            {description}
          </p>
        </div>
      </div>
      {!!icon && (
        <div className='p-4'>
          {createElement(icon, {
            className:
              'size-12 transition-all stroke-1 group-hover:text-accent text-forest-green-400/10 group-hover:scale-[1.26]'
          })}
        </div>
      )}
    </div>
  )
}

export default SocialCard
