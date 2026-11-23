import * as THREE from 'three'
import type { Gaze } from './portrait-gaze'

type Point = [x: number, y: number, z: number]
type Profile = [y: number, width: number, front: number, back: number, center: number]
type Strand = [x: number, y: number, z: number, width: number, depth: number]
type Pigment = (point: THREE.Vector3, u: number, v: number) => THREE.Color

const TAU = Math.PI * 2
const { clamp, lerp, smoothstep } = THREE.MathUtils

const FACE: Profile[] = [
  [-0.98, 0.04, 0.05, 0.09, 0.31],
  [-0.91, 0.31, 0.26, 0.31, 0.22],
  [-0.79, 0.47, 0.35, 0.47, 0.17],
  [-0.60, 0.57, 0.46, 0.55, 0.11],
  [-0.38, 0.72, 0.55, 0.66, 0.06],
  [-0.15, 0.79, 0.59, 0.73, 0.025],
  [0.05, 0.81, 0.62, 0.76, -0.01],
  [0.29, 0.82, 0.66, 0.75, -0.035],
  [0.54, 0.80, 0.64, 0.72, -0.06],
  [0.76, 0.69, 0.57, 0.62, -0.10],
  [0.94, 0.48, 0.43, 0.46, -0.13],
  [1.06, 0.24, 0.22, 0.26, -0.15],
  [1.09, 0.02, 0.02, 0.04, -0.16],
]

const JACKET: Profile[] = [
  [-2.51, 2.29, 0.62, 0.58, -0.18],
  [-2.17, 2.20, 0.68, 0.60, -0.19],
  [-1.82, 2.08, 0.66, 0.61, -0.19],
  [-1.43, 1.88, 0.58, 0.59, -0.20],
  [-1.18, 1.56, 0.50, 0.55, -0.22],
  [-0.94, 0.91, 0.46, 0.48, -0.24],
  [-0.69, 0.49, 0.40, 0.43, -0.23],
]

function profileAt(rows: Profile[], y: number): Profile {
  const upper = rows.findIndex(([height]) => height >= y)
  const i = upper === -1 ? rows.length - 2 : Math.max(0, upper - 1)
  const [a, b] = [rows[i], rows[i + 1]]
  const before = rows[Math.max(0, i - 1)]
  const after = rows[Math.min(rows.length - 1, i + 2)]
  const t = clamp((y - a[0]) / (b[0] - a[0]), 0, 1)
  const h00 = (2 * t - 3) * t * t + 1
  const h10 = ((t - 2) * t + 1) * t
  const h01 = (3 - 2 * t) * t * t
  const h11 = (t - 1) * t * t

  return [y, ...([1, 2, 3, 4].map(column => (
    h00 * a[column] + h10 * 0.5 * (b[column] - before[column])
    + h01 * b[column] + h11 * 0.5 * (after[column] - a[column])
  )))] as Profile
}

function gaussian(value: number, spread: number) {
  return Math.exp(-((value / spread) ** 2))
}

function faceRelief(x: number, y: number) {
  const cheek = 0.055 * gaussian(Math.abs(x) - 0.43, 0.25) * gaussian(y + 0.30, 0.26)
  const socket = -0.054 * gaussian(Math.abs(x) - 0.37, 0.26) * gaussian(y - 0.015, 0.16)
  const bridge = 0.100 * gaussian(x, 0.16) * gaussian(y + 0.10, 0.29)
  const nose = 0.112 * gaussian(x, 0.143) * gaussian(y + 0.275, 0.143)
  const nostrils = 0.026 * gaussian(Math.abs(x) - 0.095, 0.065) * gaussian(y + 0.33, 0.088)
  const lips = 0.042 * gaussian(x, 0.20) * gaussian(y + 0.58, 0.087)
  const chin = 0.017 * gaussian(x, 0.22) * gaussian(y + 0.77, 0.08)

  return cheek + socket + bridge + nose + nostrils + lips + chin
}

function frontSurface(rows: Profile[], x: number, y: number, exponent: number) {
  const [, width, front, , center] = profileAt(rows, y)
  const arc = Math.sqrt(Math.max(0, 1 - (x / width) ** 2))
  return center + front * arc ** exponent
}

function faceSurface(x: number, y: number) {
  return frontSurface(FACE, x, y, 0.64) + faceRelief(x, y)
}

function jacketSurface(x: number, y: number) {
  return frontSurface(JACKET, x, y, 0.79)
}

function surfaceGeometry(
  columns: number,
  rows: number,
  pointAt: (u: number, v: number) => THREE.Vector3,
  pigment?: Pigment,
  flip = false,
) {
  const positions = []
  const colors = []
  const indices = []

  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const u = column / columns
      const v = row / rows
      const point = pointAt(u, v)
      positions.push(point.x, point.y, point.z)
      if (pigment) {
        const shade = pigment(point, u, v)
        colors.push(shade.r, shade.g, shade.b)
      }
      if (row === rows || column === columns) continue

      const a = row * (columns + 1) + column
      const b = a + 1
      const c = a + columns + 1
      const d = c + 1
      indices.push(...(flip ? [a, c, b, b, c, d] : [a, b, c, b, d, c]))
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (pigment) geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function profileMesh(
  parent: THREE.Group,
  rows: Profile[],
  material: THREE.Material,
  exponent: number,
  pigment: Pigment,
  relief?: (x: number, y: number) => number,
) {
  const geometry = surfaceGeometry(72, 70, (u, v) => {
    const y = lerp(rows[0][0], rows[rows.length - 1][0], v)
    const [, width, front, back, center] = profileAt(rows, y)
    const angle = u * TAU + Math.PI
    const arc = Math.cos(angle)
    const x = width * Math.sin(angle)
    const z = arc >= 0
      ? center + front * arc ** exponent + (relief?.(x, y) ?? 0) * smoothstep(arc, 0, 0.2)
      : center + back * arc
    return new THREE.Vector3(x, y, z)
  }, pigment)
  const mesh = new THREE.Mesh(geometry, material)
  parent.add(mesh)
  return mesh
}

function material(color: string, roughness = 0.73, vertexColors = false) {
  return new THREE.MeshStandardMaterial({ color, roughness, vertexColors })
}

function ellipsoid(
  parent: THREE.Group,
  skin: THREE.Material,
  at: Point,
  size: Point,
  angle = 0,
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skin)
  mesh.position.set(...at)
  mesh.scale.set(...size)
  mesh.rotation.z = angle
  parent.add(mesh)
  return mesh
}

// Swept oval sections let the hair and seams taper without leaving cylindrical ends.
function strand(
  parent: THREE.Group,
  pigment: THREE.Material,
  sections: Strand[],
  shade?: Pigment,
  resolution = 24,
) {
  const path = new THREE.CatmullRomCurve3(
    sections.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.45,
  )
  const geometry = surfaceGeometry(14, resolution, (u, v) => {
    const center = path.getPoint(v)
    const tangent = path.getTangent(v)
    const across = new THREE.Vector3(tangent.y, -tangent.x, 0).normalize()
    const depth = new THREE.Vector3().crossVectors(across, tangent).normalize()
    const segment = v * (sections.length - 1)
    const i = Math.min(Math.floor(segment), sections.length - 2)
    const width = lerp(sections[i][3], sections[i + 1][3], segment - i)
    const thickness = lerp(sections[i][4], sections[i + 1][4], segment - i)
    const angle = u * TAU
    return center.addScaledVector(across, width * Math.cos(angle))
      .addScaledVector(depth, thickness * Math.sin(angle))
  }, shade, true)
  parent.add(new THREE.Mesh(geometry, pigment))
}

function createHead(head: THREE.Group) {
  const clay = new THREE.Color('#cb885e')
  const warm = new THREE.Color('#b66147')
  const blush = new THREE.Color('#d97360')
  const lips = new THREE.Color('#ab6051')
  const skin = material('#ffffff', 0.75, true)
  profileMesh(head, FACE, skin, 0.64, (point, u) => {
    const { x, y } = point
    const front = smoothstep(-Math.cos(u * TAU), 0, 0.4)
    const color = clay.clone()
    color.lerp(warm, 0.24 * gaussian(y + 0.82, 0.21))
    color.lerp(blush, front * 0.37 * gaussian(Math.abs(x) - 0.52, 0.28) * gaussian(y + 0.27, 0.16))
    color.lerp(warm, front * 0.16 * gaussian(x, 0.21) * gaussian(y + 0.31, 0.13))
    color.lerp(lips, front * 0.74 * gaussian(x, 0.142) * gaussian(y + 0.585, 0.055))
    color.lerp(warm, front * 0.25 * gaussian(Math.abs(x) - 0.38, 0.25) * gaussian(y - 0.095, 0.09))
    return color
  }, faceRelief)

  const ear = material('#bb7b55')
  const earDepth = material('#98533f')
  const earRidge = material('#c88961')
  const nostril = material('#995d45')
  for (const side of [-1, 1]) {
    ellipsoid(head, ear, [side * 0.777, -0.235, -0.035], [0.20, 0.296, 0.155], side * -0.23)
    ellipsoid(head, earDepth, [side * 0.862, -0.222, 0.089], [0.090, 0.163, 0.034], side * -0.30)
    strand(head, earRidge, [
      [side * 0.81, -0.34, 0.123, 0.013, 0.016],
      [side * 0.873, -0.235, 0.133, 0.032, 0.023],
      [side * 0.845, -0.142, 0.104, 0.013, 0.014],
    ])
    const nostrilX = side * 0.088
    ellipsoid(head, nostril, [nostrilX, -0.369, faceSurface(nostrilX, -0.369) + 0.0005],
      [0.018, 0.007, 0.006], side * 0.27)
  }

  const mouthLine = material('#743e37')
  const mouth: Strand[] = [
    [-0.215, -0.537, 0, 0.002, 0.005],
    [-0.116, -0.571, 0, 0.009, 0.009],
    [-0.045, -0.568, 0, 0.008, 0.008],
    [0.006, -0.574, 0, 0.011, 0.008],
    [0.083, -0.567, 0, 0.012, 0.008],
    [0.160, -0.553, 0, 0.007, 0.005],
    [0.214, -0.521, 0, 0.002, 0.003],
  ]
  strand(head, mouthLine, mouth.map(([x, y, , w, d]) => [x, y, faceSurface(x, y) + 0.004, w, d]))
}

function irisTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Portrait requires a 2D canvas for its iris texture')

  context.fillStyle = '#f4e7d3'
  context.fillRect(0, 0, 128, 128)
  const iris = context.createRadialGradient(62, 69, 5, 64, 64, 25)
  iris.addColorStop(0, '#69432e')
  iris.addColorStop(0.54, '#85522f')
  iris.addColorStop(0.78, '#b27e49')
  iris.addColorStop(0.90, '#6b4836')
  iris.addColorStop(1, '#382d29')
  context.fillStyle = iris
  context.beginPath()
  context.ellipse(64, 64, 25, 26, 0, 0, TAU)
  context.fill()

  for (let index = 0; index < 44; index++) {
    const angle = index * TAU / 44
    const length = 2 * Math.sin(index * 35.1)
    context.strokeStyle = index % 3 ? '#e6ad66a0' : '#432d22b0'
    context.lineWidth = 0.65
    context.beginPath()
    context.moveTo(64 + 14 * Math.cos(angle), 64 + 14 * Math.sin(angle))
    context.lineTo(64 + (21 + length) * Math.cos(angle + 0.03), 64 + (22 + length) * Math.sin(angle + 0.03))
    context.stroke()
  }
  context.fillStyle = '#231e1b'
  context.beginPath()
  context.ellipse(63, 63, 12, 13, 0, 0, TAU)
  context.fill()
  context.fillStyle = '#fff9e9'
  context.beginPath()
  context.ellipse(56, 55, 6.5, 5, -0.4, 0, TAU)
  context.ellipse(73, 74, 2.9, 2.25, -0.4, 0, TAU)
  context.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createEye(head: THREE.Group, side: number) {
  const eyeWidth = 0.246
  const eyeX = side * 0.349
  const eyeY = 0.007
  const iris = irisTexture()
  const whites = new THREE.MeshStandardMaterial({ map: iris, roughness: 0.69 })
  const liner = material('#36241e', 0.63)
  const lowerLid = material('#9b5645')
  const eyebrows = material('#312921')

  function outline(angle: number, radius: number) {
    const horizontal = Math.cos(angle)
    const vertical = Math.sin(angle)
    const x = eyeX + side * radius * eyeWidth * horizontal
    const arch = (vertical >= 0 ? 0.126 : 0.096) * Math.sign(vertical) * Math.abs(vertical) ** 1.45
    const y = eyeY + radius * (0.027 * horizontal + arch)
    const z = faceSurface(x, y) + 0.016 + 0.064 * (1 - radius ** 2)
    return new THREE.Vector3(x, y, z)
  }

  const whitesGeometry = surfaceGeometry(48, 12, (u, v) => outline(u * TAU, v), undefined, side > 0)
  const positions = whitesGeometry.getAttribute('position')
  const uv = []
  for (let i = 0; i < positions.count; i++) {
    uv.push(0.5 + (positions.getX(i) - eyeX) / 0.47, 0.5 + (positions.getY(i) - eyeY) / 0.47)
  }
  whitesGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  head.add(new THREE.Mesh(whitesGeometry, whites))
  for (const upper of [true, false]) {
    const rim: Strand[] = []
    for (let i = 0; i <= 12; i++) {
      const fraction = i / 12
      const { x, y, z } = outline(fraction * Math.PI + (upper ? 0 : Math.PI), 1)
      const w = (upper ? 0.019 : 0.007) * Math.sin(fraction * Math.PI) + 0.003
      rim.push([x, y, z + 0.004, w, upper ? 0.017 : 0.009])
    }
    strand(head, upper ? liner : lowerLid, rim, undefined, 30)
  }

  strand(head, eyebrows, [
    [0.137, 0.211, 0.025, 0.018, 0.016],
    [0.237, 0.263, 0.023, 0.035, 0.028],
    [0.365, 0.283, 0.021, 0.034, 0.022],
    [0.493, 0.268, 0.017, 0.024, 0.019],
    [0.594, 0.218, 0.010, 0.004, 0.009],
  ].map(([x, y, height, width, depth]) => [side * x, y, faceSurface(side * x, y) + height, width, depth]))

  return (gaze: Gaze) => {
    iris.offset.set(-(gaze.x * 0.105 + side * 0.010) / 0.47, -gaze.y * 0.049 / 0.47)
  }
}

const LOCKS: Strand[][] = [
  [[0.58, 0.91, -0.28, 0.17, 0.19], [0.78, 0.71, -0.12, 0.16, 0.17], [0.93, 0.38, -0.01, 0.14, 0.12], [0.95, 0.04, 0.01, 0.066, 0.066], [0.86, -0.29, 0.025, 0.004, 0.006]],
  [[-0.55, 0.87, -0.24, 0.15, 0.17], [-0.77, 0.66, -0.17, 0.15, 0.16], [-0.91, 0.36, -0.08, 0.117, 0.12], [-0.95, 0.04, -0.015, 0.06, 0.06], [-0.85, -0.32, 0.03, 0.003, 0.004]],
  [[0.59, 0.91, -0.45, 0.14, 0.15], [0.79, 0.55, -0.42, 0.15, 0.14], [0.90, 0.17, -0.38, 0.116, 0.10], [0.82, -0.44, -0.26, 0.004, 0.004]],
  [[-0.46, 0.99, -0.37, 0.15, 0.14], [-0.76, 0.61, -0.37, 0.16, 0.15], [-0.90, 0.16, -0.41, 0.12, 0.10], [-0.78, -0.48, -0.30, 0.004, 0.004]],
  [[0.73, 0.91, 0.09, 0.16, 0.14], [0.82, 0.67, 0.36, 0.14, 0.14], [0.84, 0.40, 0.44, 0.115, 0.11], [0.84, 0.10, 0.39, 0.06, 0.066], [0.78, -0.16, 0.27, 0.003, 0.004]],
  [[-0.54, 1.00, 0.13, 0.16, 0.15], [-0.71, 0.71, 0.42, 0.17, 0.14], [-0.81, 0.34, 0.45, 0.11, 0.11], [-0.82, 0.07, 0.37, 0.05, 0.05], [-0.76, -0.14, 0.30, 0.004, 0.005]],
  [
    [0.42, 1.15, -0.21, 0.16, 0.13],
    [0.15, 1.26, -0.07, 0.19, 0.13],
    [-0.12, 1.27, 0.12, 0.20, 0.15],
    [-0.36, 1.15, 0.28, 0.19, 0.15],
    [-0.57, 1.05, 0.44, 0.15, 0.13],
    [-0.73, 0.88, 0.49, 0.11, 0.09],
    [-0.85, 0.72, 0.45, 0.042, 0.051],
    [-0.95, 0.72, 0.35, 0.004, 0.006],
  ],
  [
    [0.64, 1.13, -0.08, 0.15, 0.15],
    [0.38, 1.25, 0.17, 0.19, 0.15],
    [0.11, 1.20, 0.41, 0.21, 0.15],
    [-0.12, 1.03, 0.57, 0.20, 0.14],
    [-0.33, 0.91, 0.65, 0.18, 0.13],
    [-0.53, 0.89, 0.66, 0.13, 0.10],
    [-0.65, 0.75, 0.65, 0.10, 0.09],
    [-0.68, 0.59, 0.62, 0.076, 0.07],
    [-0.77, 0.53, 0.56, 0.042, 0.047],
    [-0.86, 0.64, 0.48, 0.004, 0.005],
  ],
  [
    [0.73, 1.10, 0.07, 0.13, 0.13],
    [0.51, 1.18, 0.33, 0.16, 0.14],
    [0.28, 1.09, 0.56, 0.18, 0.14],
    [0.08, 0.91, 0.70, 0.18, 0.14],
    [-0.08, 0.80, 0.77, 0.16, 0.13],
    [-0.27, 0.80, 0.79, 0.13, 0.11],
    [-0.39, 0.66, 0.78, 0.095, 0.085],
    [-0.42, 0.49, 0.75, 0.071, 0.067],
    [-0.54, 0.41, 0.71, 0.043, 0.047],
    [-0.65, 0.53, 0.61, 0.004, 0.006],
  ],
  [
    [0.80, 1.00, 0.13, 0.12, 0.13],
    [0.62, 1.09, 0.40, 0.15, 0.12],
    [0.45, 0.98, 0.59, 0.17, 0.14],
    [0.39, 0.81, 0.70, 0.17, 0.13],
    [0.25, 0.65, 0.78, 0.13, 0.11],
    [0.11, 0.62, 0.81, 0.11, 0.09],
    [0.03, 0.50, 0.80, 0.081, 0.071],
    [0.03, 0.37, 0.76, 0.064, 0.058],
    [-0.06, 0.30, 0.71, 0.046, 0.042],
    [-0.16, 0.37, 0.68, 0.027, 0.030],
    [-0.17, 0.46, 0.66, 0.003, 0.005],
  ],
  [
    [0.82, 0.97, 0.12, 0.11, 0.11],
    [0.81, 0.83, 0.41, 0.13, 0.12],
    [0.73, 0.68, 0.62, 0.12, 0.11],
    [0.63, 0.55, 0.70, 0.10, 0.097],
    [0.64, 0.42, 0.71, 0.076, 0.078],
    [0.70, 0.30, 0.64, 0.055, 0.061],
    [0.65, 0.21, 0.59, 0.036, 0.045],
    [0.55, 0.29, 0.58, 0.004, 0.005],
  ],
]

function createHair(head: THREE.Group) {
  const hair = material('#fffdf3', 0.61, true)
  const root = new THREE.Color('#161918')
  const shine = new THREE.Color('#333733')
  const light = new THREE.Color('#615f51')
  const base = surfaceGeometry(64, 30, (u, v) => {
    const phi = u * TAU + Math.PI
    const front = 0.5 + 0.5 * Math.cos(phi)
    const fringe = 1.28 + 1.30 * (1 - front ** 4) + 0.042 * Math.sin(5 * phi + 0.5)
    const theta = lerp(0.014, fringe, v)
    const volume = 1 + 0.035 * Math.sin(6 * phi + 2 * theta) * Math.sin(theta)
    return new THREE.Vector3(
      0.90 * volume * Math.sin(theta) * Math.sin(phi),
      0.27 + 0.97 * volume * Math.cos(theta),
      -0.135 + 0.83 * volume * Math.sin(theta) * Math.cos(phi),
    )
  }, (point) => root.clone().lerp(shine, 0.25 + 0.28 * smoothstep(point.y, 0.45, 1.25)), true)
  head.add(new THREE.Mesh(base, hair))

  for (const [i, sections] of LOCKS.entries()) {
    strand(head, hair, sections, (point, u, v) => {
      const curve = (Math.sin(TAU * u) + 1) * 0.5
      const taper = 0.68 + 0.20 * Math.sin(v * Math.PI)
      const color = root.clone().lerp(shine, curve * taper + (i % 3) * 0.047)
      const glint = gaussian(Math.sin(TAU * u) - 0.78, 0.24) * gaussian(v - 0.47, 0.33)
      return color.lerp(light, glint * 0.15 * smoothstep(point.y, 0.3, 1.1))
    }, 34)
  }
}

type GarmentPoint = [x: number, y: number, offset: number, width: number]

function garmentSeam(body: THREE.Group, skin: THREE.Material, points: GarmentPoint[], depth: number) {
  strand(body, skin, points.map(([x, y, offset, width]) => (
    [x, y, jacketSurface(x, y) + offset, width, depth]
  )))
}

function garmentPanel(
  body: THREE.Group,
  skin: THREE.Material,
  shape: [x: number, y: number][],
  offset: number,
) {
  const contour = shape.map(([x, y]) => new THREE.Vector2(x, y))
  const faces = THREE.ShapeUtils.triangulateShape(contour, [])
  const vertices = shape.flatMap(([x, y]) => [x, y, jacketSurface(x, y) + offset])
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(faces.flat())
  geometry.computeVertexNormals()
  body.add(new THREE.Mesh(geometry, skin))
}

function createTorso(body: THREE.Group) {
  const forest = new THREE.Color('#425b40')
  const olive = new THREE.Color('#667e56')
  const shadow = new THREE.Color('#27392f')
  const jacket = material('#f7f9ec', 0.92, true)
  profileMesh(body, JACKET, jacket, 0.79, ({ x, y }, u) => {
    const front = smoothstep(-Math.cos(u * TAU), -0.15, 0.72)
    const color = forest.clone().lerp(shadow, (1 - front) * 0.55)
    color.lerp(olive, 0.56 * gaussian(y + 1.33, 0.81) * gaussian(Math.abs(x) - 1.13, 0.92))
    color.lerp(shadow, 0.48 * gaussian(x, 0.28) * gaussian(y + 1.21, 0.92))
    color.multiplyScalar(0.89 + 0.11 * smoothstep(y, -2.48, -1.6))
    return color
  })

  const neck = material('#b77a54')
  ellipsoid(body, neck, [0.0, -0.20, -0.044], [0.397, 0.64, 0.357])

  const collar = material('#344a3b')
  const collarTop = material('#748363')
  const inner = material('#243430')
  const innerEdge = material('#42564a')
  const canvas = material('#4d6150')
  const canvasSide = material('#3b5242')
  const stitching = material('#97a780')
  const zip = material('#283631')
  const teeth = material('#9aa583', 0.62)
  const copper = material('#d99859', 0.52)

  ellipsoid(body, inner, [0, -0.60, -0.19], [0.48, 0.21, 0.47])
  for (const side of [-1, 1]) {
    strand(body, collar, [
      [side * 0.18, -0.46, -0.50, 0.12, 0.10],
      [side * 0.42, -0.49, -0.30, 0.15, 0.12],
      [side * 0.52, -0.52, 0.008, 0.16, 0.125],
      [side * 0.47, -0.64, 0.27, 0.16, 0.115],
      [side * 0.33, -0.81, 0.39, 0.11, 0.112],
      [side * 0.14, -1.06, 0.41, 0.04, 0.045],
    ])
    strand(body, collarTop, [
      [side * 0.25, -0.34, -0.44, 0.014, 0.020],
      [side * 0.44, -0.35, -0.26, 0.025, 0.028],
      [side * 0.51, -0.38, 0.017, 0.021, 0.029],
      [side * 0.414, -0.51, 0.29, 0.021, 0.027],
      [side * 0.275, -0.70, 0.44, 0.026, 0.020],
      [side * 0.15, -0.92, 0.47, 0.015, 0.019],
      [side * 0.12, -1.06, 0.434, 0.002, 0.006],
    ])
    garmentSeam(body, innerEdge, [
      [side * 0.68, -0.923, 0.031, 0.035],
      [side * 0.87, -1.070, 0.025, 0.081],
      [side * 1.11, -1.208, 0.010, 0.099],
      [side * 1.41, -1.361, 0.013, 0.104],
      [side * 1.67, -1.525, 0.030, 0.074],
      [side * 1.91, -1.785, 0.011, 0.040],
      [side * 2.04, -1.970, 0.017, 0.025],
    ], 0.038)
    garmentSeam(body, stitching, [
      [side * 0.69, -0.983, 0.046, 0.009],
      [side * 0.86, -1.120, 0.053, 0.012],
      [side * 1.12, -1.286, 0.041, 0.012],
      [side * 1.41, -1.443, 0.036, 0.011],
      [side * 1.67, -1.638, 0.029, 0.010],
      [side * 1.84, -1.824, 0.025, 0.008],
    ], 0.009)
    garmentSeam(body, canvasSide, [
      [side * 1.35, -1.459, 0.046, 0.038],
      [side * 1.46, -1.649, 0.026, 0.079],
      [side * 1.52, -1.906, 0.026, 0.100],
      [side * 1.60, -2.191, 0.025, 0.116],
      [side * 1.68, -2.500, 0.025, 0.12],
    ], 0.045)
    garmentSeam(body, stitching, [
      [side * 1.32, -1.496, 0.043, 0.004],
      [side * 1.37, -1.679, 0.039, 0.008],
      [side * 1.43, -1.923, 0.041, 0.009],
      [side * 1.49, -2.224, 0.041, 0.006],
      [side * 1.55, -2.50, 0.041, 0.006],
    ], 0.008)
  }

  const panelSide = new THREE.MeshStandardMaterial({ color: '#3b5242', roughness: 0.92, side: THREE.DoubleSide })
  garmentPanel(body, panelSide, [[0.42, -1.38], [1.10, -1.49], [1.15, -1.86], [0.98, -2.00], [0.41, -1.90]], 0.046)
  garmentPanel(body, panelSide, [[-0.40, -1.35], [-0.99, -1.46], [-1.07, -1.95], [-0.87, -2.08], [-0.40, -1.95]], 0.044)
  garmentSeam(body, canvas, [[0.43, -1.44, 0.07, 0.031], [0.76, -1.48, 0.063, 0.041], [1.07, -1.54, 0.07, 0.019]], 0.028)
  garmentSeam(body, canvas, [[-1.00, -1.54, 0.066, 0.017], [-0.73, -1.49, 0.055, 0.044], [-0.44, -1.44, 0.065, 0.030]], 0.028)

  garmentSeam(body, zip, [[0, -0.63, 0.050, 0.032], [0, -0.97, 0.078, 0.058], [0.035, -1.45, 0.073, 0.045], [0.067, -2.5, 0.04, 0.045]], 0.033)
  garmentSeam(body, teeth, [[0, -0.78, 0.09, 0.009], [0, -0.98, 0.111, 0.012], [0.032, -1.47, 0.111, 0.014], [0.067, -2.5, 0.074, 0.011]], 0.008)
  ellipsoid(body, copper, [0.01, -0.991, jacketSurface(0.01, -0.991) + 0.123], [0.026, 0.075, 0.015], 0.24)

  garmentSeam(body, stitching, [[-0.86, -1.74, 0.075, 0.010], [-0.77, -1.65, 0.075, 0.012], [-0.70, -1.72, 0.075, 0.011], [-0.62, -1.64, 0.075, 0.012], [-0.53, -1.72, 0.075, 0.009]], 0.007)
}

export function createPortraitScene() {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-2.8, 2.8, 2.55, -2.55, 0.1, 30)
  camera.position.set(0, 0.17, 9)
  camera.lookAt(0, 0.17, 0)

  const bust = new THREE.Group()
  bust.rotation.y = -0.115
  scene.add(bust)
  const torso = new THREE.Group()
  torso.position.y = 0.18
  torso.scale.y = 1.08
  bust.add(torso)
  createTorso(torso)

  const head = new THREE.Group()
  head.position.y = 1.00
  head.scale.setScalar(1.11)
  head.rotation.order = 'YXZ'
  bust.add(head)
  createHead(head)
  const leftEye = createEye(head, -1)
  const rightEye = createEye(head, 1)
  createHair(head)

  const ambient = new THREE.HemisphereLight('#fff4d8', '#71877a', 2.12)
  const key = new THREE.DirectionalLight('#fff1df', 2.4)
  key.position.set(-3, 4.3, 5)
  const fill = new THREE.DirectionalLight('#e6fff4', 1.15)
  fill.position.set(4, 0.6, 4.0)
  const rim = new THREE.DirectionalLight('#daffd8', 2.7)
  rim.position.set(1.9, 3, -4)
  scene.add(ambient, key, fill, rim)

  function look(gaze: Gaze) {
    head.rotation.set(-gaze.y * 0.22 + 0.012, gaze.x * 0.35 + 0.058, -gaze.x * 0.028)
    leftEye(gaze)
    rightEye(gaze)
  }

  look({ x: 0, y: 0 })

  return { scene, camera, look }
}

export function createPortraitRenderer() {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
    stencil: false,
  })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.02

  const { scene, camera, look } = createPortraitScene()

  return {
    canvas: renderer.domElement,
    resize(width: number, height: number, pixelRatio: number) {
      const halfWidth = camera.top * width / height
      camera.left = -halfWidth
      camera.right = halfWidth
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height, false)
    },
    draw(gaze: Gaze) {
      look(gaze)
      renderer.render(scene, camera)
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      const textures = new Set<THREE.Texture>()
      scene.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        geometries.add(node.geometry)
        const surfaces = Array.isArray(node.material) ? node.material : [node.material]
        for (const surface of surfaces) {
          materials.add(surface)
          if (surface instanceof THREE.MeshStandardMaterial && surface.map) textures.add(surface.map)
        }
      })
      for (const geometry of geometries) geometry.dispose()
      for (const surface of materials) surface.dispose()
      for (const texture of textures) texture.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
