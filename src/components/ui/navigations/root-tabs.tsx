'use client'
import React from 'react'
import { Button } from '../../shared/elements/button'
import {
  IconAddressBook,
  IconBriefcase2,
  IconSmartHome,
  IconUserSquareRounded
} from '@tabler/icons-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import ChatWidget from '../chat/chat-widget'

const list = [
  {
    label: 'Overview',
    path: '/',
    icon: IconSmartHome,
    id: 'overview'
  },
  {
    label: 'Availability',
    path: '/availability',
    icon: IconUserSquareRounded,
    id: 'availability'
  },
  {
    label: 'Portfolio',
    path: '/portfolio',
    icon: IconBriefcase2,
    id: 'portfolio'
  },
  {
    label: 'Contact',
    path: '/contact',
    icon: IconAddressBook,
    id: 'contact'
  }
]

const RootTabs = () => {
  const segment = usePathname()

  return (
    <div className='fixed bottom-4 left-0 w-full z-50 px-4 sm:px-4'>
      <ChatWidget />
      <nav className='container relative min-w-fit max-w-prose mx-auto rounded-2xl border border-solid border-forest-green-200 p-1 sm:p-0.5 flex gap-0.5 sm:gap-1 transition-all bg-background'>
        {list.map(item => (
          <Button
            key={item.id}
            variant='navigation'
            data-state={segment.endsWith(item.path) ? 'active' : null}
            className={`flex-1 rounded-[12px] px-0.5 sm:px-1 hover:cursor-pointer py-2 sm:py-4 flex flex-col items-center gap-0.5 sm:flex-row group ${
              segment.endsWith(item.path)
                ? 'bg-[#22332b] text-forest-green-50'
                : 'bg-forest-green-50 text-[#22332b]'
            }`}
            asChild
          >
            <Link
              href={item.path}
              replace
              // className='flex flex-col items-center gap-0.5 sm:gap-1 p-1 sm:p-3'
            >
              <item.icon className='h-5 w-5 sm:h-6 sm:w-6' />
              <span
                className={`text-[0.55rem] text-neutral-300 sm:sm sm:text-inherit ${
                  segment.endsWith(item.path)
                    ? 'text-forest-green-50'
                    : 'text-forest-green-800'
                } `}
              >
                {item.label}
              </span>
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  )
}

export default RootTabs
