import React from 'react'

interface BannerState {
  value: boolean
  expiresAt: number
}

// 0.5 = 12 hours
export const useBannerState = (options = { expirationInDays: 0.5 }) => {
  const [showBanner, setShowBanner] = React.useState(false)

  React.useEffect(() => {
    // Check localStorage on mount
    const stored = localStorage.getItem('banner')
    if (stored !== null) {
      const bannerState: BannerState = JSON.parse(stored)
      const now = Date.now()

      if (now > bannerState.expiresAt) {
        // Banner expired, remove from storage and show banner
        localStorage.removeItem('banner')
        setShowBanner(true)
      } else {
        setShowBanner(bannerState.value)
      }
    } else {
      setShowBanner(true)
    }
  }, [])

  const toggleBanner = (value: boolean) => {
    const expirationDate = options?.expirationInDays || 1
    const expiresAt = Date.now() + expirationDate * 24 * 60 * 60 * 1000
    const bannerState: BannerState = { value, expiresAt }

    setShowBanner(value)
    localStorage.setItem('banner', JSON.stringify(bannerState))
  }

  return { showBanner, toggleBanner }
}
