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

// Store only height. Every strip shares the same evenly spaced horizontal samples.
const intervals = 64
const stripCount = 69
const halfWidth = 224
const heightScale = 149
const horizontalStep = (2 * halfWidth) / intervals

export function sampleTerrain(type: TerrainType): Float32Array[] {
  return Array.from({ length: stripCount }, (_, row) => {
    const y = row * 2 / (stripCount - 1) - 1
    return Float32Array.from({ length: intervals + 1 }, (_, col) =>
      elevation(col * 2 / intervals - 1, y, type) * heightScale)
  })
}

export function interpolateTerrain(from: Float32Array[], target: Float32Array[], progress: number) {
  if (progress <= 0) return from
  if (progress >= 1) return target
  return target.map((row, index) => row.map((height, col) =>
    from[index][col] + (height - from[index][col]) * progress))
}

export function traceStrip(heights: Float32Array) {
  const points = ['M0 0']

  // Replace a run with one line when every sample stays within a fraction
  // of a viewBox pixel. Smooth flat areas need far fewer SVG coordinates.
  function appendSegment(start: number, end: number) {
    const slope = (heights[end] - heights[start]) / (end - start)
    let maxError = 0.35
    let split = start
    for (let i = start + 1; i < end; i++) {
      const error = Math.abs(heights[i] - (heights[start] + slope * (i - start)))
      if (error > maxError) {
        maxError = error
        split = i
      }
    }
    if (split !== start) {
      appendSegment(start, split)
      appendSegment(split, end)
      return
    }
    points.push((end * horizontalStep) + ' ' + Number((-heights[end]).toFixed(1)))
  }

  appendSegment(0, intervals)
  return { path: points.join(' '), peak: Math.max(...heights) / heightScale }
}

export function stripTransforms(turn: number) {
  const angle = (turn - 18) * Math.PI / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return Array.from({ length: stripCount }, (_, row) => {
    const y = row * 2 / (stripCount - 1) - 1
    const left = 320 - (cos + y * sin) * halfWidth
    const top = 226 + (y * cos - sin) * 69
    return `matrix(${cos.toFixed(5)} ${(sin * 69 / halfWidth).toFixed(5)} 0 1 ${left.toFixed(2)} ${top.toFixed(2)})`
  })
}
