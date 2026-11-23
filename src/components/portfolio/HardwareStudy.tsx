'use client'

import { useId, useState } from 'react'
import { CircuitBoard, Cpu, Layers2, ZoomIn, ZoomOut } from 'lucide-react'

const parts = [
  { id: 'package', label: 'Package', title: 'Mold compound', icon: Layers2,
    detail: 'A molded resin body protects the silicon and fine wires. The recessed dot marks the pin-one corner.' },
  { id: 'die', label: 'Die & wires', title: 'Silicon die & wire bonds', icon: Cpu,
    detail: 'Fine bond wires arc from pads on the silicon die to the lead frame, carrying power and signals to the package pins.' },
  { id: 'board', label: 'Board', title: 'PCB traces & vias', icon: CircuitBoard,
    detail: 'Copper traces fan out from the solder lands. Plated holes called vias carry connections between board layers.' }
] as const

type Part = typeof parts[number]['id']
const drawOrder: Part[] = ['board', 'die', 'package']
const explodedCenters = { board: 206, die: 137, package: 58 }
const assembledCenters = { board: 169, die: 165, package: 160 }
const closeups = { package: 2.75, die: 2.8, board: 1.35 }
const artwork = '/hardware/mcu.svg'
const features = {
  package: { label: 'Pin-one mark', x: 250, y: 74 },
  die: { label: 'Memory array', x: 254, y: 126 },
  board: { label: 'Plated via', x: 66, y: 124 }
}

export default function HardwareStudy() {
  const [selection, select] = useState<Part>('die')
  const [exploded, setExploded] = useState(true)
  const [magnified, magnify] = useState(false)
  const instructions = useId()
  const current = parts.find(part => part.id === selection)!
  const centers = exploded ? explodedCenters : assembledCenters
  const showOverview = exploded && !magnified

  function inspect(part: Part) {
    select(part)
    if (part === 'die') setExploded(true)
  }

  function toggleAssembly() {
    magnify(false)
    setExploded(!exploded)
    if (exploded) select('package')
  }

  return (
    <figure className="hardware-study">
      <figcaption>
        <span><Cpu size={18} aria-hidden="true" /> Microcontroller anatomy</span>
        <span className="hardware-caption">Illustrated cutaway</span>
      </figcaption>
      <div className="hardware-stage">
        <svg viewBox="0 0 560 300" role="img" aria-label={magnified ? 'Magnified ' + current.title : (exploded ? 'Exploded' : 'Assembled') + ' view of a microcontroller on a circuit board'}>
          <g className="hardware-annotation" data-visible={showOverview} pointerEvents="none">
            <path className="hardware-guides" d="M217 69v133m104-146v126" />
          </g>
          {drawOrder.map(part => (
            <g key={part} className="hardware-layer" data-hidden={magnified && part !== selection}
              style={{ transform: magnified
                ? `translate(280px, 146px) scale(${closeups[part]})`
                : `translate(270px, ${centers[part]}px) scale(1)` }}
              onClick={() => inspect(part)}>
              <g transform="matrix(1.22 .32 -.89 .57 0 0)"><use href={artwork + '#' + part} /></g>
            </g>
          ))}
          <g className="hardware-callouts hardware-annotation" data-visible={showOverview} aria-hidden="true" pointerEvents="none">
            <g data-selected={selection === 'package'}><path d="M319 58l30-20h39"/><circle cx="319" cy="58" r="2.3"/><text x="393" y="41">Mold compound</text></g>
            <g data-selected={selection === 'die'}><path d="M221 130l-27-23h-50"/><circle cx="221" cy="130" r="2.3"/><text x="138" y="110" textAnchor="end">Bond wires</text></g>
            <g data-selected={selection === 'board'}><path d="M363 224l25 27h45"/><circle cx="363" cy="224" r="2.3"/><text x="438" y="254">Copper traces</text></g>
          </g>
          {drawOrder.map(part => {
            const feature = features[part]
            return <g key={part} className="hardware-callouts hardware-lens-label hardware-annotation"
              data-visible={magnified && selection === part} aria-hidden="true" pointerEvents="none">
              <path d={`M${feature.x} ${feature.y} L${feature.x - 42} 42 h-22`}/>
              <circle cx={feature.x} cy={feature.y} r="2.7"/>
              <text x={part === 'board' ? 16 : feature.x - 69} y={part === 'board' ? 33 : 45}
                textAnchor={part === 'board' ? 'start' : 'end'}>{feature.label}</text>
            </g>
          })}
        </svg>
      </div>
      <div className="hardware-controls" role="group" aria-label="View controls">
        <button type="button" onClick={toggleAssembly} aria-pressed={exploded}><Layers2 size={15} aria-hidden="true"/> Exploded view</button>
        <button type="button" onClick={() => { if (!magnified && selection === 'die') setExploded(true); magnify(!magnified) }}
          aria-pressed={magnified}>{magnified ? <ZoomOut size={15} aria-hidden="true"/> : <ZoomIn size={15} aria-hidden="true"/>} Magnify</button>
      </div>
      <div className="hardware-detail">
        <div className="hardware-parts" role="group" aria-label="Inspect a component" aria-describedby={instructions}>
          {parts.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => inspect(id)} aria-pressed={selection === id}>
            <Icon size={15} aria-hidden="true"/>{label}
          </button>)}
        </div>
        <div className="hardware-reading">
          {parts.map(part => <div key={part.id} aria-hidden={part.id !== selection}>
            <strong>{part.title}</strong><p>{part.detail}</p>
          </div>)}
        </div>
        <span className="sr-only" role="status">{current.title}. {current.detail}</span>
        <p className="sr-only" id={instructions}>Select a component, then use Magnify for a closer view.</p>
      </div>
    </figure>
  )
}
