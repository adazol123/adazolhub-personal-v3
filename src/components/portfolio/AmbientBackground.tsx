'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type RefObject } from 'react'
import { isSceneTheme, type SiteTheme } from '@/lib/site-content'
import SkeletonImage from './SkeletonImage'

const RackPassage = dynamic(() => import('./RackPassage'), { ssr: false })
const contours = Array.from({ length: 17 }, (_, level) => level)

function SceneImage(props: Pick<ComponentProps<typeof SkeletonImage>, 'src' | 'sizes' | 'onLoad'>) {
  return <SkeletonImage {...props} alt="" fill quality={65} fetchPriority="low" loading="eager" />
}

function AisleScene({ animate, progress, renderFrame }: {
  animate: boolean
  progress: RefObject<number>
  renderFrame: RefObject<((progress: number) => void) | null>
}) {
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)

  return (
    <>
      <div className="scene-aisle-poster scene-preview">
        <SceneImage src="/themes/server-aisle.webp" sizes="(min-aspect-ratio: 16/9) 100vw, 178vh"
          onLoad={event => setPhoto(event.currentTarget)} />
      </div>
      {animate && photo && <RackPassage photo={photo} progress={progress} renderFrame={renderFrame} />}
    </>
  )
}

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
      {theme === 'server-aisle' && <AisleScene animate={animate} progress={progress} renderFrame={renderRack} />}
      {theme === 'exposed-cpu' && <div className="scene-cpu-stage scene-preview">
        <SceneImage src="/themes/cpu-board.webp" sizes="(min-aspect-ratio: 16/9) 111vw, 198vh" />
        <div className="scene-cpu-part scene-cpu-part--die">
          <SceneImage src="/themes/cpu-die.webp" sizes="(min-aspect-ratio: 16/9) 26vw, 46vh" />
        </div>
        <div className="scene-cpu-part scene-cpu-part--lid">
          <SceneImage src="/themes/cpu-lid.webp" sizes="(min-aspect-ratio: 16/9) 26vw, 46vh" />
        </div>
      </div>}
      {theme === 'fiber-patch-bay' && <>
        <div className="scene-fiber-panel scene-preview">
          <SceneImage src="/themes/fiber-bay.webp" sizes="(min-aspect-ratio: 16/9) 116vw, 205vh" />
        </div>
        <div className="scene-fiber-cables">
          <SceneImage src="/themes/fiber-cables.webp" sizes="(min-aspect-ratio: 16/9) 107vw, 145vh" />
        </div>
      </>}
    </div>
  )
}
