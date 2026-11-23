import assert from 'node:assert/strict'
import test from 'node:test'
import { interpolateTerrain, sampleTerrain, terrainTypes, traceStrip } from '../src/components/portfolio/terrain-geometry.ts'

test('compact terrain paths follow each sampled landform to within half a viewBox pixel', () => {
  for (const type of terrainTypes) {
    for (const heights of sampleTerrain(type)) {
      const coordinates = traceStrip(heights).path.slice(1).split(' ').map(Number)
      const lastX = coordinates.at(-2)!
      let right = 2
      for (let col = 0; col < heights.length; col++) {
        const x = col / (heights.length - 1) * lastX
        while (coordinates[right] < x) right += 2
        const left = right - 2
        const fraction = (x - coordinates[left]) / (coordinates[right] - coordinates[left])
        const y = coordinates[left + 1] + fraction * (coordinates[right + 1] - coordinates[left + 1])
        assert.ok(Math.abs(y + heights[col]) < 0.5, type)
      }
    }
  }
})

test('interrupted landform morphs resume from the currently visible surface', () => {
  const ridge = sampleTerrain('Ridgeline')
  const dunes = sampleTerrain('Dunes')
  const caldera = sampleTerrain('Caldera')
  const midway = interpolateTerrain(ridge, dunes, 0.5)
  assert.deepEqual(interpolateTerrain(midway, caldera, 0), midway)
  assert.deepEqual(interpolateTerrain(midway, caldera, 1), caldera)
  assert.notDeepEqual(midway, dunes)
})
