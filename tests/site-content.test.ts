import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultSiteContent, validateSiteSection } from '../src/lib/site-content.ts'

test('publishes an empty notes list and rejects duplicate anchors', () => {
  const { notes } = defaultSiteContent
  assert.equal(validateSiteSection('notes', { ...notes, entries: [] }), null)
  assert.match(validateSiteSection('notes', { ...notes, entries: [notes.entries[0], notes.entries[0]] }) ?? '', /unique/)
})

test('accepts a hosted resume PDF and rejects unsafe or recursive download targets', () => {
  const resume = structuredClone(defaultSiteContent.resume)
  resume.standard.href = 'https://example.com/new-resume.pdf'
  assert.equal(validateSiteSection('resume', resume), null)
  resume.standard.href = '/documents/résumé-東京.pdf'
  assert.equal(validateSiteSection('resume', resume), null)
  for (const href of ['/a/..//example.com/file.pdf', 'javascript:alert(1)', '/\\example.com/file.pdf', '//example.com/file.pdf', '/resume_detailed?retry=1']) {
    resume.standard.href = href
    assert.ok(validateSiteSection('resume', resume), href)
  }
})

test('checks theme variants and rejects unexpected fields', () => {
  assert.equal(validateSiteSection('appearance', { ...defaultSiteContent.appearance, theme: 'light' }), null)
  assert.ok(validateSiteSection('appearance', { ...defaultSiteContent.appearance, theme: 'rainbow' }))
  assert.ok(validateSiteSection('appearance', { ...defaultSiteContent.appearance, extra: true }))
})

test('accepts new projects with optional covers and PDF links and rejects duplicate routes', () => {
  assert.ok(defaultSiteContent.work, 'Work should be editable')
  const work = structuredClone(defaultSiteContent.work)
  work.projects.push({
    ...work.projects[0],
    slug: 'published-project',
    name: 'Published project',
    image: '',
    alt: '',
    links: [{ label: 'Results PDF', href: '/documents/results.pdf' }]
  })
  assert.equal(validateSiteSection('work', work), null)
  work.projects.at(-1)!.slug = work.projects[0].slug
  assert.match(validateSiteSection('work', work) ?? '', /unique/)
})

test('rejects unsafe project cover URLs and slugs with path separators', () => {
  assert.ok(defaultSiteContent.work, 'Work should be editable')
  const work = structuredClone(defaultSiteContent.work)
  work.projects[0].image = 'javascript:alert(1)'
  assert.match(validateSiteSection('work', work) ?? '', /cover image/i)
  work.projects[0].image = 'https://example.test/cover.webp'
  assert.equal(validateSiteSection('work', work), null)
  work.projects[0].slug = 'project/subpage'
  assert.match(validateSiteSection('work', work) ?? '', /lowercase letters/)
})

test('the immersive themes can be published with motion enabled or disabled', () => {
  const appearance = defaultSiteContent.appearance
  for (const theme of ['server-aisle', 'exposed-cpu', 'fiber-patch-bay']) {
    assert.equal(validateSiteSection('appearance', { ...appearance, theme, scrollBackground: true }), null)
    assert.equal(validateSiteSection('appearance', { ...appearance, theme, scrollBackground: false }), null)
  }
  assert.match(validateSiteSection('appearance', { ...appearance, scrollBackground: 'off' }) ?? '', /on or off/)
})
