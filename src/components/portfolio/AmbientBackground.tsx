'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, type CSSProperties } from 'react'
import { isSceneTheme, type SiteTheme } from '@/lib/site-content'

const RackPassage = dynamic(() => import('./RackPassage'), { ssr: false })
const contours = Array.from({ length: 17 }, (_, level) => level)

export default function AmbientBackground({ theme, animate }: { theme: SiteTheme; animate: boolean }) {
  const background = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const renderRack = useRef<((progress: number) => void) | null>(null)
  const scenic = isSceneTheme(theme)

  useEffect(() => {
    const layer = background.current
    if (!layer || !animate) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const scroller = document.scrollingElement ?? document.documentElement
    const pageSize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(scheduleDraw)
    let frame = 0

    function draw() {
      frame = 0
      const viewportHeight = scroller.clientHeight
      const distance = Math.max(1, scroller.scrollHeight - viewportHeight, viewportHeight * (scenic ? .5 : .25))
      progress.current = Math.min(1, Math.max(0, scroller.scrollTop / distance))
      layer?.style.setProperty('--scroll-progress', String(progress.current))
      renderRack.current?.(progress.current)
    }

    function scheduleDraw() {
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw)
    }

    function stop() {
      window.removeEventListener('scroll', scheduleDraw)
      window.removeEventListener('resize', scheduleDraw)
      document.removeEventListener('visibilitychange', scheduleDraw)
      pageSize?.disconnect()
      cancelAnimationFrame(frame)
      frame = 0
      progress.current = 0
      layer?.style.removeProperty('--scroll-progress')
    }

    function syncMotion() {
      stop()
      if (motion.matches) return
      window.addEventListener('scroll', scheduleDraw, { passive: true })
      window.addEventListener('resize', scheduleDraw, { passive: true })
      document.addEventListener('visibilitychange', scheduleDraw)
      pageSize?.observe(document.body)
      scheduleDraw()
    }

    syncMotion()
    motion.addEventListener('change', syncMotion)
    return () => {
      motion.removeEventListener('change', syncMotion)
      stop()
    }
  }, [animate, scenic, theme])

  if (!scenic) {
    return (
      <div className="ambient-background" aria-hidden="true" ref={background}>
        <div className="ambient-terrain">
          {contours.map(level => (
            <span key={level} style={{ '--level': level } as CSSProperties} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`ambient-background ambient-background--scene ambient-background--${theme}`} data-motion={animate ? 'scroll' : 'still'} aria-hidden="true" ref={background}>
      {theme === 'server-aisle' && <>
        <div className="scene-aisle-poster" />
        {animate && <RackPassage progress={progress} renderFrame={renderRack} />}
      </>}
      {theme === 'exposed-cpu' && <div className="scene-cpu-stage">
        <div className="scene-cpu-part scene-cpu-part--die" />
        <div className="scene-cpu-part scene-cpu-part--lid" />
      </div>}
      {theme === 'fiber-patch-bay' && <>
        <div className="scene-fiber-panel" />
        <div className="scene-fiber-cables" />
      </>}
    </div>
  )
}
