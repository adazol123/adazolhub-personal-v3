'use client'
import { Button } from '@/components/shared/elements/button'
import { IconRobot, IconX } from '@tabler/icons-react'
import React, { useState } from 'react'
import ChatBox from './chat-box'

const ChatWidget = () => {
  const [openWidget, setOpenWidget] = useState(false)

  const widgetRef = React.useRef<HTMLDivElement>(null)

  // Handle scroll lock
  React.useEffect(() => {
    if (openWidget) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [openWidget])

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        setOpenWidget(false)
      }
    }

    if (openWidget) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openWidget])

  const handleToggleWidget = () => {
    setOpenWidget(prev => !prev)
  }
  return (
    <>
      {!openWidget ? (
        <Button
          size='icon'
          className='z-60 rounded-2xl p-1 absolute right-4 -top-14 cursor-pointer shadow-sm hover:shadow-xl size-11 transition-all'
          onClick={handleToggleWidget}
          title='Open Chat Widget'
          aria-label='Open chat widget'
        >
          <IconRobot className='size-6' />
          <div
            id='status__indicator'
            className='rounded-full bg-accent absolute z-[61] bottom-0 right-0 size-2.5 border border-forest-green-100'
          />
        </Button>
      ) : (
        <>
          {/* Backdrop blur overlay */}
          <div
            className='fixed inset-0 bg-neutral-950/50 backdrop-blur-xs z-50'
            // onClick={handleToggleWidget}
          />
          <div
            ref={widgetRef}
            className='z-60 px-4 rounded-2xl w-full sm:max-w-lg absolute bottom-2 right-0'
          >
            <div
              role='button'
              className='text-center text-xs py-2 mb-1'
              onClick={handleToggleWidget}
              aria-label='close widget modal'
            >
              <span className='block py-2 px-6 bg-white/10 backdrop-blur-[1px] w-fit mx-auto rounded-full text-white cursor-pointer hover:bg-white/20 transition-all'>
                Close
              </span>
            </div>
            <div className='bg-neutral-50 z-60 rounded-2xl p-4'>
              <nav className='flex justify-between items-center bg-neutral-50 pb-2'>
                <div className='flex gap-1 items-center'>
                  <div className='bg-forest-green-700 rounded-md p-1 w-fit'>
                    <IconRobot className='text-xs size-3 text-forest-green-50' />
                  </div>
                  <h3 className='text-xs text-forest-green-600 '>PattyBOT</h3>
                </div>
                <div>
                  <Button
                    variant='link'
                    size='icon'
                    onClick={handleToggleWidget}
                    className='cursor-pointer'
                  >
                    <IconX />
                  </Button>
                </div>
              </nav>
              {/* <div className=''> */}
              <ChatBox />
              {/* </div> */}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default ChatWidget
