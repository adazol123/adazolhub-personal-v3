'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { centeredGaze, easeGaze, pointerGaze } from './portrait-gaze'
import type { createPortraitRenderer } from './portrait-model'
import styles from './Portrait.module.css'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
const precisePointerQuery = '(any-hover: hover) and (any-pointer: fine)'

export default function Portrait() {
  const frameRef = useRef<HTMLElement>(null)
  const stillRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const frame = frameRef.current
    const still = stillRef.current
    const mount = canvasRef.current
    if (!frame || !still || !mount) return
    const stillStyle = still.style

    const motion = window.matchMedia(reducedMotionQuery)
    let hasPointer = window.matchMedia(precisePointerQuery).matches
    let renderer: ReturnType<typeof createPortraitRenderer> | undefined
    let activeFrame: number | null = null
    let visible = typeof IntersectionObserver === 'undefined'
    let starting = false
    let unmounted = false
    let failed = false
    let previousTime: number | undefined
    let current = centeredGaze
    let target = centeredGaze

    function shouldRender() {
      return !unmounted && visible && !document.hidden && hasPointer && !motion.matches
    }

    function pause() {
      if (activeFrame !== null) cancelAnimationFrame(activeFrame)
      activeFrame = null
      previousTime = undefined
      target = centeredGaze
      current = centeredGaze
      stillStyle.removeProperty('--portrait-gaze-x')
      stillStyle.removeProperty('--portrait-gaze-y')
    }

    function disposeRenderer() {
      pause()
      if (!renderer) return

      renderer.canvas.removeEventListener('webglcontextlost', onContextLost)
      renderer.canvas.remove()
      renderer.dispose()
      renderer = undefined
    }

    function onContextLost() {
      failed = true
      disposeRenderer()
      setLive(false)
    }

    function draw(time: number) {
      activeFrame = null
      if (!shouldRender()) return

      const delta = previousTime === undefined ? 1 / 60 : Math.min((time - previousTime) / 1000, 0.05)
      previousTime = time
      current = easeGaze(current, target, delta)
      if (renderer) {
        renderer.draw(current)
      } else {
        stillStyle.setProperty('--portrait-gaze-x', String(current.x))
        stillStyle.setProperty('--portrait-gaze-y', String(current.y))
      }
      if (current !== target) activeFrame = requestAnimationFrame(draw)
      else previousTime = undefined
    }

    function requestDraw() {
      if (activeFrame === null && shouldRender()) {
        activeFrame = requestAnimationFrame(draw)
      }
    }

    function resize() {
      if (!renderer || !shouldRender()) return

      const { clientWidth, clientHeight } = frame
      if (!clientWidth || !clientHeight) return

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.65)
      renderer.resize(clientWidth, clientHeight, pixelRatio)
      renderer.draw(current)
    }

    async function activate() {
      if (!shouldRender()) {
        pause()
        return
      }
      if (renderer) {
        resize()
        return
      }
      if (starting || failed) return

      starting = true
      try {
        const { createPortraitRenderer } = await import('./portrait-model')
        if (!shouldRender()) return

        renderer = createPortraitRenderer()
        renderer.canvas.addEventListener('webglcontextlost', onContextLost)
        mount.append(renderer.canvas)
        resize()
        setLive(true)
        requestDraw()
      } catch {
        failed = true
        disposeRenderer()
      } finally {
        starting = false
      }
    }

    function center() {
      if (target === centeredGaze) return

      target = centeredGaze
      requestDraw()
    }

    function syncMotion() {
      if (motion.matches) {
        disposeRenderer()
        setLive(false)
      } else {
        void activate()
      }
    }

    function track(event: PointerEvent) {
      if (event.pointerType === 'touch') return
      hasPointer = true
      if (!shouldRender()) return

      target = pointerGaze(event.clientX, event.clientY, frame.getBoundingClientRect())
      requestDraw()
      if (!renderer) void activate()
    }

    const intersection = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        void activate()
      },
    )
    intersection?.observe(frame)
    const size = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize)
    size?.observe(frame)

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', track, { passive: true })
    document.documentElement.addEventListener('pointerleave', center)
    window.addEventListener('blur', center)
    document.addEventListener('visibilitychange', activate)
    motion.addEventListener('change', syncMotion)
    void activate()

    return () => {
      unmounted = true
      intersection?.disconnect()
      size?.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', track)
      document.documentElement.removeEventListener('pointerleave', center)
      window.removeEventListener('blur', center)
      document.removeEventListener('visibilitychange', activate)
      motion.removeEventListener('change', syncMotion)
      disposeRenderer()
    }
  }, [])

  return (
    <figure className={styles.frame} ref={frameRef} role="img" aria-label="Stylized 3D portrait of Daniel Lozada">
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.orbit} aria-hidden="true" />
      <Image
        ref={stillRef}
        className={styles.still}
        data-hidden={live}
        src="/portrait/daniel.webp"
        alt=""
        fill
        sizes="(max-width: 760px) 94vw, 46vw"
        priority
        unoptimized
      />
      <div className={styles.canvas} ref={canvasRef} data-visible={live} aria-hidden="true" />
      <div className={styles.markings} aria-hidden="true" />
    </figure>
  )
}
