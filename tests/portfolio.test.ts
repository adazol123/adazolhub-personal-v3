import assert from 'node:assert/strict'
import test from 'node:test'
import { caseStudies, findCaseStudy, publicPagePaths, resumeDocuments } from '../src/lib/portfolio-content.ts'

test('every featured project resolves to its canonical case study', () => {
  const expected = ['prodsight-ai', 'dan-ai', 'winners-circle-guild']
  assert.deepEqual(caseStudies.map(({ slug }) => slug), expected)
  for (const slug of expected) {
    assert.equal(findCaseStudy(slug)?.path, `/portfolio/${slug}`)
  }
  assert.equal(findCaseStudy('unpublished'), undefined)
})

test('publishes the navigation routes and keeps both resume download labels unaccented', () => {
  for (const path of ['/', '/about', '/activity', '/availability', '/cv', '/portfolio', '/contact', '/testimonial', '/thread']) {
    assert.ok(publicPagePaths.includes(path))
  }
  assert.deepEqual(resumeDocuments.map(({ path }) => path), ['/resume', '/resume_detailed'])
  assert.deepEqual(resumeDocuments.map(({ label }) => label), ['Resume', 'ATS resume'])
  assert.notEqual(resumeDocuments[0].file, resumeDocuments[1].file)
})
