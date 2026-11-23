'use client'

import { useEffect, useRef, type RefObject } from 'react'

const vertex = `
  attribute vec2 position;
  varying vec2 frameUv;

  void main() {
    frameUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

// Match the real photograph's rear wall, then project the rack faces, floor and
// ceiling onto separate planes so a forward camera move produces depth.
const fragment = `
  precision highp float;
  varying vec2 frameUv;
  uniform sampler2D photo;
  uniform vec2 viewport;
  uniform float progress;

  void main() {
    const float aspect = 16.0 / 9.0;
    const vec2 vanishingPoint = vec2(0.498, 0.502);
    const vec4 backWall = vec4(0.441, 0.550, 0.371, 0.635);
    vec2 sensor = vec2(aspect, 1.0);
    float ratio = viewport.x / viewport.y;
    vec2 cover = min(vec2(1.0), vec2(ratio / aspect, aspect / ratio));
    vec2 photoUv = (frameUv - 0.5) * cover + 0.5;

    float travel = progress * (1.48 - 0.48 * progress);
    vec3 camera = vec3(0.020 * sin(travel * 2.7), -0.009 * travel, 0.67 * travel);
    vec3 ray = vec3((photoUv - vanishingPoint) * sensor, 1.0);

    vec2 wall = (vec2(
      ray.x < 0.0 ? backWall.x : backWall.y,
      ray.y < 0.0 ? backWall.z : backWall.w
    ) - vanishingPoint) * sensor;
    vec2 crossings = abs(wall - camera.xy) / max(abs(ray.xy), vec2(0.0001));
    float distance = min(1.0 - camera.z, min(crossings.x, crossings.y));
    vec3 hit = camera + ray * distance;
    vec2 projected = vanishingPoint + hit.xy / (hit.z * sensor);

    gl_FragColor = texture2D(photo, clamp(projected, 0.001, 0.999));
  }
`

function compile(gl: WebGLRenderingContext, program: WebGLProgram, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return false
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  const ready = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (ready) gl.attachShader(program, shader)
  gl.deleteShader(shader)
  return Boolean(ready)
}

function prepareRenderer(canvas: HTMLCanvasElement, photo: HTMLImageElement) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' })
  if (!gl) return null

  const program = gl.createProgram()
  const points = gl.createBuffer()
  const texture = gl.createTexture()
  function dispose() {
    gl.deleteTexture(texture)
    gl.deleteBuffer(points)
    gl.deleteProgram(program)
  }

  if (!program || !points || !texture ||
    !compile(gl, program, gl.VERTEX_SHADER, vertex) || !compile(gl, program, gl.FRAGMENT_SHADER, fragment)) {
    dispose()
    return null
  }

  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose()
    return null
  }

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, points)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo)
  if (gl.getError() !== gl.NO_ERROR) {
    dispose()
    return null
  }

  const viewport = gl.getUniformLocation(program, 'viewport')
  const progress = gl.getUniformLocation(program, 'progress')
  return {
    dispose,
    draw(width: number, height: number, travel: number) {
      gl.viewport(0, 0, width, height)
      gl.uniform2f(viewport, width, height)
      gl.uniform1f(progress, travel)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
  }
}

export default function RackPassage({ photo, progress, renderFrame }: {
  photo: HTMLImageElement
  progress: RefObject<number>
  renderFrame: RefObject<((progress: number) => void) | null>
}) {
  const screen = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const element = screen.current
    if (!element) return
    const canvas = element

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let renderer: ReturnType<typeof prepareRenderer> = null

    function stop() {
      delete canvas.dataset.ready
      renderFrame.current = null
      renderer?.dispose()
      renderer = null
    }

    function start() {
      if (motion.matches || renderer || !photo.complete || !photo.naturalWidth) return
      renderer = prepareRenderer(canvas, photo)
      if (!renderer) return
      renderFrame.current = travel => {
        if (!renderer) return
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        if (!width || !height) return
        const scale = Math.min(window.devicePixelRatio || 1, 1.4, Math.sqrt(1_450_000 / (width * height)))
        const pixelsWide = Math.max(1, Math.round(width * scale))
        const pixelsHigh = Math.max(1, Math.round(height * scale))
        if (canvas.width !== pixelsWide || canvas.height !== pixelsHigh) {
          canvas.width = pixelsWide
          canvas.height = pixelsHigh
        }
        renderer.draw(pixelsWide, pixelsHigh, travel)
        canvas.dataset.ready = ''
      }
      renderFrame.current(progress.current)
    }

    function syncMotion() {
      if (motion.matches) stop()
      else start()
    }

    function contextLost(event: Event) {
      event.preventDefault()
      stop()
    }

    motion.addEventListener('change', syncMotion)
    canvas.addEventListener('webglcontextlost', contextLost)
    canvas.addEventListener('webglcontextrestored', start)
    start()
    return () => {
      motion.removeEventListener('change', syncMotion)
      canvas.removeEventListener('webglcontextlost', contextLost)
      canvas.removeEventListener('webglcontextrestored', start)
      stop()
    }
  }, [photo, progress, renderFrame])

  return <canvas className="scene-aisle-camera" ref={screen} />
}
