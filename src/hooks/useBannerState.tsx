import React from 'react'

export const useBannerState = () => {
  const [showBanner, setShowBanner] = React.useState(false)

  React.useEffect(() => {
    // Check localStorage on mount
    const stored = localStorage.getItem('banner')
    if (stored !== null) {
      setShowBanner(JSON.parse(stored))
    } else {
      setShowBanner(true)
    }
  }, [])

  const toggleBanner = (value: boolean) => {
    setShowBanner(value)
    localStorage.setItem('banner', JSON.stringify(value))
  }

  return { showBanner, toggleBanner }
}
