import Image from 'next/image'
import React from 'react'

type CompetenciesItemProps = {
  name: string
  description: string
  thumbnail?: string
  itemScope?: boolean
}
const CompetenciesItem = ({
  name,
  description,
  thumbnail
}: CompetenciesItemProps) => {
  const seoItemType = 'https://schema.org/DefinedTerm'
  return (
    <li
      itemType={seoItemType}
      className='grid place-content-center text-center p-6 select-none w-full'
    >
      <div className='p-4 bg-forest-green-100 mx-auto rounded-full mb-8'>
        {!!thumbnail && (
          <Image
            src={thumbnail}
            alt={name}
            width={56}
            height={56}
            className='aspect-square object-center mx-auto rounded-lg mix-blend-darken'
          />
        )}
      </div>
      <h4 itemProp='name' className='font-bold text-base mb-3'>
        {name}
      </h4>
      <p
        itemProp='description'
        className='text-sm leading-relaxed text-neutral-400 max-w-[40ch] px-2 mb-8'
      >
        {description}
      </p>
    </li>
  )
}

export default CompetenciesItem
