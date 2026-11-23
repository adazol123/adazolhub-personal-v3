export const terrainTypes = ['Ridgeline', 'Caldera', 'Dunes'] as const
export type TerrainType = typeof terrainTypes[number]

function gaussian(x: number, y: number, width: number, depth: number) {
  return Math.exp(-(x * x / width + y * y / depth))
}

function elevation(x: number, y: number, type: TerrainType) {
  const ripple = Math.sin(11 * x + 5 * y) * Math.cos(8 * y - x)
  const fold = Math.sin(7 * x - 4 * y + Math.sin(y * 8))
  const taper = Math.max(0, 1 - x ** 6) * Math.max(0, 1 - y ** 6)

  if (type === 'Caldera') {
    const radius = Math.hypot(x, y * 1.15)
    return taper * (0.81 + ripple * 0.07) * Math.exp(-((radius - 0.5 - 0.03 * fold) ** 2) / 0.023)
  }
  if (type === 'Dunes') {
    const wave = (1 + Math.sin(10 * x + 3 * y + 2.2 * Math.sin(2 * y))) / 2
    return taper * (0.1 + 0.66 * wave ** 2) * gaussian(x, y, 1.2, 1.6)
  }

  const crest = 0.2 * Math.sin(4 * x) - 0.28 * x
  const spine = gaussian(x + 0.06, y - crest, 0.51, 0.11)
  const shoulder = gaussian(x - 0.45, y + 0.3, 0.11, 0.13)
  return taper * (spine * (0.95 + 0.14 * fold + 0.07 * ripple) + 0.45 * shoulder)
}

const resolution = 92
const strips = 68

export function sampleTerrain(type: TerrainType) {
  return Array.from({ length: strips + 1 }, (_, row) => {
    const y = row * 2 / strips - 1
    return Array.from({ length: resolution + 1 }, (_, col) => {
      const x = col * 2 / resolution - 1
      return { x, y, z: elevation(x, y, type) }
    })
  })
}

export function projectTerrain(rows: ReturnType<typeof sampleTerrain>, turn: number) {
  const angle = (turn - 18) * Math.PI / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return rows.map(row => {
    let path = ''
    let peak = 0
    for (const point of row) {
      const x = 320 + (point.x * cos - point.y * sin) * 226
      const y = 226 + (point.x * sin + point.y * cos) * 69 - point.z * 149
      path += (path ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)
      peak = Math.max(peak, point.z)
    }
    return { path, peak }
  })
}
