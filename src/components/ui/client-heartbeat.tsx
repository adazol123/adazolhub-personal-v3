'use client'
import { registerServiceWorker, triggerHeartbeat } from '@/lib/config.worker'
import React from 'react'

const ClientHeartbeat = () => {
  React.useEffect(() => {
    registerServiceWorker().then(() => {
      triggerHeartbeat()
    })
  }, [])

  return null
}

export default ClientHeartbeat
