'use client'

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from 'react'
import { animate } from 'motion/react'
import { MoveHorizontal, Mountain, RotateCcw } from 'lucide-react'
import { interpolateTerrain, sampleTerrain, stripTransforms, terrainTypes, traceStrip, type TerrainType } from './terrain-geometry'

const minTurn = -24
const maxTurn = 42
const clampTurn = (angle: number) => Math.max(minTurn, Math.min(maxTurn, angle))

const motionPreference = '(prefers-reduced-motion: reduce)'
function subscribeToMotionPreference(update: () => void) {
  const query = window.matchMedia(motionPreference)
  query.addEventListener('change', update)
  return () => query.removeEventListener('change', update)
}

export default function TerrainStudy() {
  const [type, setType] = useState<TerrainType>('Ridgeline')
  const [turn, setTurn] = useState(0)
  const drag = useRef<{ x: number; angle: number; moved: boolean } | null>(null)
  const help = useId()
  const id = useId()
  const reduceMotion = useSyncExternalStore(subscribeToMotionPreference,
    () => window.matchMedia(motionPreference).matches, () => true)
  const target = useMemo(() => sampleTerrain(type), [type])
  const [surface, setSurface] = useState(target)
  const displayed = useRef(surface)
  const rows = useMemo(() => surface.map(traceStrip), [surface])
  const transforms = useMemo(() => stripTransforms(turn), [turn])

  useEffect(() => {
    const from = displayed.current
    if (from === target) return
    function update(next: typeof target) {
      displayed.current = next
      setSurface(next)
    }
    if (reduceMotion) {
      update(target)
      return
    }
    const morph = animate(0, 1, {
      duration: 0.46, ease: 'easeInOut',
      onUpdate(progress) {
        update(interpolateTerrain(from, target, progress))
      },
      onComplete: () => update(target)
    })
    return () => morph.stop()
  }, [target, reduceMotion])

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, angle: turn, moved: false }
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !event.isPrimary) return
    const distance = event.clientX - drag.current.x
    if (Math.abs(distance) > 4) drag.current.moved = true
    if (drag.current.moved) setTurn(clampTurn(drag.current.angle + distance * 0.2))
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !event.isPrimary) return
    if (!drag.current.moved) {
      const bounds = event.currentTarget.getBoundingClientRect()
      const fraction = (event.clientX - bounds.left) / bounds.width
      setTurn(clampTurn(minTurn + fraction * (maxTurn - minTurn)))
    }
    drag.current = null
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    const turns: Record<string, number> = { ArrowRight: turn + 4, ArrowUp: turn + 4, ArrowLeft: turn - 4, ArrowDown: turn - 4, Home: minTurn, End: maxTurn }
    if (!(event.key in turns)) return
    event.preventDefault()
    setTurn(clampTurn(turns[event.key]))
  }

  return (
    <figure className="terrain-study">
      <figcaption><span><Mountain size={17} aria-hidden="true" /> Terrain study</span><span className="terrain-format">Interactive 3D</span></figcaption>
      <div className="terrain-plot" role="slider" tabIndex={0} aria-label="Terrain rotation" aria-describedby={help}
        aria-valuemin={minTurn} aria-valuemax={maxTurn} aria-valuenow={Math.round(turn)} aria-valuetext={Math.round(turn) + ' degrees'}
        onKeyDown={keyDown} onPointerDown={startDrag} onPointerMove={move} onPointerUp={endDrag} onLostPointerCapture={() => { drag.current = null }}>
        <svg className="terrain-surface" viewBox="0 0 640 353" aria-hidden="true">
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="60" y1="-130" x2="400" y2="15">
              <stop offset="0%" className="plot-highlight" /><stop offset="52%" className="plot-mid" /><stop offset="100%" className="plot-shadow" />
            </linearGradient>
          </defs>
          {rows.map(({path, peak}, i) => <path key={i} d={path} transform={transforms[i]} className="plot-face" stroke={'url(#' + id + ')'}
            strokeWidth={0.95 + peak * 0.45} strokeOpacity={0.62 + peak * 0.33} />)}
        </svg>
      </div>
      <div className="terrain-toolbar">
        <div className="terrain-options" role="group" aria-label="Landform">
          <span aria-hidden="true" className="terrain-selection" style={{ transform: `translateX(${terrainTypes.indexOf(type) * 100}%)` }} />
          {terrainTypes.map(name => <button key={name} type="button" aria-pressed={name === type} onClick={() => setType(name)}>
            {name}
          </button>)}
        </div>
        <button className="terrain-reset" type="button" aria-label="Reset terrain rotation" onClick={() => setTurn(0)}><RotateCcw size={15}/></button>
      </div>
      <p className="terrain-help" id={help}><MoveHorizontal size={15} aria-hidden="true"/> Tap or drag to rotate<span className="sr-only"> or use the arrow keys when the terrain is focused</span></p>
    </figure>
  )
}
