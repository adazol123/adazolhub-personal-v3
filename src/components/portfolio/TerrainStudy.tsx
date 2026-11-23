'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { animate, motion, MotionConfig, useReducedMotion } from 'motion/react'
import { MoveHorizontal, Mountain, RotateCcw } from 'lucide-react'
import { projectTerrain, sampleTerrain, terrainTypes, type TerrainType } from './terrain-geometry'

const clampTurn = (angle: number) => Math.max(-24, Math.min(42, angle))

export default function TerrainStudy() {
  const [type, setType] = useState<TerrainType>('Ridgeline')
  const [turn, setTurn] = useState(0)
  const drag = useRef<{ x: number; angle: number } | null>(null)
  const help = useId()
  const id = useId()
  const reduceMotion = useReducedMotion()
  const target = useMemo(() => sampleTerrain(type), [type])
  const [surface, setSurface] = useState(target)
  const displayed = useRef(surface)
  const rows = useMemo(() => projectTerrain(surface, turn), [surface, turn])

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
        update(target.map((row, r) => row.map((point, c) => ({
          x: point.x, y: point.y, z: from[r][c].z + (point.z - from[r][c].z) * progress
        }))))
      },
      onComplete: () => update(target)
    })
    return () => morph.stop()
  }, [target, reduceMotion])

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, angle: turn }
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !event.isPrimary) return
    setTurn(clampTurn(drag.current.angle + (event.clientX - drag.current.x) * 0.2))
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    const turns: Record<string, number> = { ArrowRight: turn + 4, ArrowUp: turn + 4, ArrowLeft: turn - 4, ArrowDown: turn - 4, Home: -24, End: 42 }
    if (!(event.key in turns)) return
    event.preventDefault()
    setTurn(clampTurn(turns[event.key]))
  }

  return <MotionConfig reducedMotion="user">
    <figure className="terrain-study">
      <figcaption><span><Mountain size={17} aria-hidden="true" /> Terrain study</span><span className="terrain-format">Interactive 3D</span></figcaption>
      <div className="terrain-plot" role="slider" tabIndex={0} aria-label="Terrain rotation" aria-describedby={help}
        aria-valuemin={-24} aria-valuemax={42} aria-valuenow={Math.round(turn)} aria-valuetext={Math.round(turn) + ' degrees'}
        onKeyDown={keyDown} onPointerDown={startDrag} onPointerMove={move} onLostPointerCapture={() => { drag.current = null }}>
        <svg className="terrain-surface" viewBox="0 0 640 353" aria-hidden="true">
          <defs>
            <linearGradient id={id} x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" className="plot-highlight" /><stop offset="52%" className="plot-mid" /><stop offset="100%" className="plot-shadow" />
            </linearGradient>
          </defs>
          {rows.map(({path, peak}, i) => <path key={i} d={path} className="plot-face" stroke={'url(#' + id + ')'}
            strokeWidth={0.95 + peak * 0.45} strokeOpacity={0.62 + peak * 0.33} />)}
        </svg>
      </div>
      <div className="terrain-toolbar">
        <div className="terrain-options" role="group" aria-label="Landform">
          {terrainTypes.map(name => <button key={name} type="button" aria-pressed={name === type} onClick={() => setType(name)}>
            {name === type && <motion.span className="terrain-selection" layoutId={id + '-selection'} transition={{type: 'spring', stiffness: 420, damping: 36}} />}
            <span>{name}</span>
          </button>)}
        </div>
        <button className="terrain-reset" type="button" aria-label="Reset terrain rotation" onClick={() => setTurn(0)}><RotateCcw size={15}/></button>
      </div>
      <p className="terrain-help" id={help}><MoveHorizontal size={15} aria-hidden="true"/> Drag to rotate<span className="sr-only"> or use the arrow keys when the terrain is focused</span></p>
    </figure>
  </MotionConfig>
}
