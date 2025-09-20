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
    debouncedScrollY,
    [10, 100],
    ['rgba(223,236,229,0.02)', 'rgba(223,236,229,1)']
  )

  // Interpolate backdrop blur
  const backdropBlur = useTransform(
    debouncedScrollY,
    [0, 100],
    ['blur(1px)', 'blur(3px)']
  )

  // Interpolate font size and description position
  const fontSize = useTransform(debouncedScrollY, [19, 20], ['2rem', '1rem'])
  // const displayDescriptionTransition = useTransform(debouncedScrollY, [2, 50], ['block', 'none'])
  // const opacityDescriptionTransition = useTransform(debouncedScrollY, [2, 100], ["1", "0"])

  return (
    <>
      <div className='bg-background sticky top-0 py-4 gap-6 transition-all z-20 -mx-4 px-4'>
        <motion.div
          id='heading__container'
          className='flex w-full justify-between max-w-prose mx-auto items-center container '
          style={{
            backgroundColor,
            // WebkitBackdropFilter: backdropBlur, // For Safari support
            backdropFilter: backdropBlur
          }}
        >
          <header aria-label='Information'>
            <h3
              aria-label='Job Description'
              className='text-xs text-neutral-400 mb-1'
            >
              {infoPayload.job}
            </h3>
            <motion.h1
              aria-label='Name'
              className='font-extrabold text-3xl transition-all antialiased animate-collapsible-down text-forest-green-700'
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
      </div>
    </>
  )
}

export default HeadingSection
