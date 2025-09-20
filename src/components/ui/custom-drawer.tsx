import React from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/shared/ui/drawer'

type CustomDrawerProps = {
  title?: string
  description?: string
} & React.PropsWithChildren

const CustomDrawer = (props: CustomDrawerProps) => {
  return (
    <div>
      <Drawer>
        <DrawerTrigger>Open</DrawerTrigger>
        <CustomDrawerContent>{props.children}</CustomDrawerContent>
      </Drawer>
    </div>
  )
}

export const CustomDrawerContent = (props: CustomDrawerProps) => {
  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{props?.title || null}</DrawerTitle>
        {!!props?.description && (
          <DrawerDescription>{props.description}</DrawerDescription>
        )}
      </DrawerHeader>
      {props.children}
    </DrawerContent>
  )
}

export default CustomDrawer
