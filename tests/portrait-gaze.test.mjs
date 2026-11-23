import assert from 'node:assert/strict'
import test from 'node:test'

import { easeGaze, pointerGaze } from '../src/components/portfolio/portrait-gaze.ts'

const bounds = { left: 120, top: 50, width: 360, height: 240 }

test('looks straight ahead when the pointer is centered', () => {
  assert.deepEqual(pointerGaze(300, 170, bounds), { x: 0, y: 0 })
})

test('follows the screen axes with a centered, bounded tracking range', () => {
  assert.deepEqual(pointerGaze(30, 170, bounds), { x: -1, y: 0 })
  assert.deepEqual(pointerGaze(590, 170, bounds), { x: 1, y: 0 })
  assert.deepEqual(pointerGaze(300, 46, bounds), { x: 0, y: 1 })
  assert.deepEqual(pointerGaze(300, 510, bounds), { x: 0, y: -1 })
  const diagonal = pointerGaze(480, 50, bounds)
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 0.001)
})

test('eases back to exact center and stops responding after settling', () => {
  const center = { x: 0, y: 0 }
  const start = { x: -1, y: 0.5 }
  const firstFrame = easeGaze(start, center, 1 / 60)
  assert.ok(firstFrame.x > -1 && firstFrame.x < 0)
  assert.ok(firstFrame.y > 0 && firstFrame.y < 0.5)

  let current = firstFrame
  for (let frame = 0; frame < 60; frame++) {
    current = easeGaze(current, center, 1 / 60)
  }
  assert.deepEqual(current, center)
})

test('glides toward the pointer without a snap or overshoot', () => {
  const target = pointerGaze(30, 170, bounds)
  const firstFrame = easeGaze({ x: 0, y: 0 }, target, 1 / 60)
  assert.ok(firstFrame.x < 0 && firstFrame.x > target.x)
  assert.equal(firstFrame.y, 0)

  let current = firstFrame
  for (let frame = 0; frame < 60; frame++) {
    current = easeGaze(current, target, 1 / 60)
    assert.ok(current.x >= target.x)
  }
  assert.equal(current, target)
})
