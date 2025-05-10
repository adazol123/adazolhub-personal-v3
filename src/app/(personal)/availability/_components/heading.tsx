'use client'
import { infoPayload } from '@/_temp/information.temp'
import { Button } from '@/components/shared/elements/button'
import { IconFileDownload } from '@tabler/icons-react'
import { useScroll, useSpring, useTransform, motion } from 'motion/react'
import Link from 'next/link'
import React from 'react'

const HeadingSection = () => {
  const { scrollY } = useScroll()
  const debouncedScrollY = useSpring(scrollY, {
    damping: 20,
    stiffness: 300,
    mass: 0.5
  })

  // Interpolate background color from transparent to black
  const backgroundColor = useTransform(
    scrollY,
    [10, 100],
    ['rgba(255,255,255,0)', 'oklch(0.931 0.016 164)']
  )

  // Interpolate backdrop blur
  //   const backdropBlur = useTransform(
  //     scrollY,
  //     [0, 100],
  //     ['blur(0px)', 'blur(10px)']
  //   )

  // Interpolate font size and description position
  const fontSize = useTransform(debouncedScrollY, [19, 20], ['2rem', '1rem'])
  // const displayDescriptionTransition = useTransform(debouncedScrollY, [2, 50], ['block', 'none'])
  // const opacityDescriptionTransition = useTransform(debouncedScrollY, [2, 100], ["1", "0"])

  return (
    <motion.div
      className='flex mt-6 justify-between items-baseline bg-forest-green-50 sticky top-0 container max-w-prose mx-auto py-4 gap-6 transition-all'
      style={{
        zIndex: 20,
        backgroundColor
        // WebkitBackdropFilter: backdropBlur, // For Safari support
        // backdropFilter: backdropBlur
      }}
    >
      <header aria-label='Information'>
        <h3 aria-label='Role' className='text-xs text-neutral-400 mb-1'>
          {infoPayload.job}
        </h3>
        <motion.h1
          aria-label='Name'
          className='font-bold text-3xl transition-all antialiased animate-collapsible-down'
          style={{ fontSize }}
        >
          {infoPayload.name}
        </motion.h1>
      </header>
      <div>
        <Button size='sm' asChild title='Download Resume'>
          <Link href='/resume'>
            <IconFileDownload />
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}

export default HeadingSection
