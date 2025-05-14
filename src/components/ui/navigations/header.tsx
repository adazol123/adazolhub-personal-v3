import { Button } from '@/components/shared/elements/button'
import { IconInfoCircle } from '@tabler/icons-react'
import React from 'react'

const Header = () => {
  return (
    <nav className='flex justify-between container max-w-prose mx-auto py-2 items-center'>
      <h2 className='text-xs select-none'>Adazol | Personal</h2>

      {/* <Button
        size='icon'
        className='p-1 bg-transparent hover:bg-muted-background text-forest-green-700'
      >
        <IconCategory />
      </Button> */}
      <Button variant='link' size='icon'>
        <IconInfoCircle />
      </Button>
    </nav>
  )
}

export default Header
