export type Gaze = { x: number; y: number }
type Bounds = Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>

export const centeredGaze: Gaze = { x: 0, y: 0 }

export function pointerGaze(clientX: number, clientY: number, bounds: Bounds): Gaze {
  const { left, top, width, height } = bounds
  if (width <= 0 || height <= 0) return centeredGaze

  const x = 2 * (clientX - left) / width - 1
  const y = 1 - 2 * (clientY - top) / height
  const radius = Math.max(1, Math.hypot(x, y))
  return { x: x / radius, y: y / radius }
}

export function easeGaze(current: Gaze, target: Gaze, seconds: number): Gaze {
  const remaining = Math.exp(-9 * seconds)
  const x = target.x + (current.x - target.x) * remaining
  const y = target.y + (current.y - target.y) * remaining

  return Math.hypot(target.x - x, target.y - y) < 0.001 ? target : { x, y }
}
