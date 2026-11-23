import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { POST } from '../src/app/api/ask/route.ts'
import { ASK_SUGGESTIONS } from '../src/lib/portfolio-assistant.ts'

const testKey = 'mock-gemini-key'
const originalEnv = process.env
let requestNumber = 0

beforeEach(() => {
  const env: NodeJS.ProcessEnv = { ...originalEnv, VERCEL: '1' }
  delete env.GEMINI_API_KEY
  delete env.GEMINI_MODEL
  process.env = env
})

afterEach(() => {
  process.env = originalEnv
})

function post(body: unknown, ip = `192.0.2.${++requestNumber}`) {
  return new Request('https://adazol.com/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': ip },
    body: JSON.stringify(body)
  })
}

function geminiResponse(factIds: string[]) {
  return Response.json({ candidates: [{
    finishReason: 'STOP',
    content: { parts: [{ text: JSON.stringify({ factIds }) }] }
  }] })
}

test('suggested questions return the matching public source index without a key', async () => {
  const expected = ['/portfolio/prodsight-ai', '/about', '/contact']
  for (const [index, suggestion] of ASK_SUGGESTIONS.entries()) {
    const response = await POST(post({ question: suggestion.question }))
    const result = await response.json()
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert.equal(result.kind, 'index')
    assert.equal(result.sources[0].href, expected[index])
  }
})

test('the portfolio index gives a factual brief and follows up about the project stack', async () => {
  const project = await (await POST(post({ question: 'What is ProdSight AI?' }))).json()
  assert.match(project.text, /turning early ideas into product briefs and requirements/i)
  const followUp = await (await POST(post({ question: 'How was it built?', history: ['What is ProdSight AI?'] }))).json()
  assert.match(followUp.text, /Next\.js.*Supabase/)
  assert.equal(followUp.sources[0].href, '/portfolio/prodsight-ai')
})

test('career questions return public role history and a résumé source', async () => {
  const response = await POST(post({ question: 'Where has Daniel worked?' }))
  const result = await response.json()
  assert.equal(result.kind, 'index')
  assert.match(result.text, /Supafaya.*MetaverseGo/)
  assert.equal(result.sources[0].href, '/cv')
})

test('current role and work availability are available as confirmed public facts', async () => {
  const role = await (await POST(post({ question: 'Where does Daniel work now?' }))).json()
  assert.match(role.text, /Software Engineer\/Developer at Cognitive AI Philippines/)
  assert.match(role.text, /August 1, 2025.*AI-first development/)
  assert.equal(role.sources[0].href, '/cv')
  const availability = await (await POST(post({ question: 'Is Daniel available for work?' }))).json()
  assert.match(availability.text, /available for work/)
  assert.equal(availability.sources[0].href, '/availability')
})

test('AI tool questions return the confirmed Cognitive AI Philippines workflow', async () => {
  for (const question of [
    'What AI tools does Daniel use at Cognitive AI Philippines?',
    'Does Daniel use MCP at work?'
  ]) {
    const result = await (await POST(post({ question }))).json()
    assert.match(result.text, /OpenAI Codex, Claude, Gemini, and the Model Context Protocol \(MCP\)/)
    assert.match(result.text, /Cognitive AI Philippines/)
    assert.equal(result.sources[0].href, '/competencies')
  }
})

test('finds the ATS résumé, Discord project, and dated employment from natural questions', async () => {
  const ats = await (await POST(post({ question: 'How can I download the ATS résumé?' }))).json()
  assert.equal(ats.sources[0].href, '/resume_detailed')
  assert.equal(ats.sources[0].label, 'Download ATS resume')
  const discord = await (await POST(post({ question: 'What did Daniel build for Discord?' }))).json()
  assert.equal(discord.sources[0].href, '/portfolio/winners-circle-guild')
  const employer = await (await POST(post({ question: 'When did Daniel start working at Supafaya?' }))).json()
  assert.match(employer.text, /Software Engineer at Supafaya.*Nov 2022/)
  assert.deepEqual(employer.sources.map(({ href }: { href: string }) => href), ['/cv'])
})

test('project implementation questions draw on published case study details', async () => {
  const answer = await (await POST(post({ question: 'How did Daniel build ProdSight AI?' }))).json()
  assert.match(answer.text, /separate NestJS API/)
  assert.equal(answer.sources[0].href, '/portfolio/prodsight-ai')
})

test('Gemini sees only bounded question context and returns curated evidence', async t => {
  process.env.GEMINI_API_KEY = testKey
  process.env.GEMINI_MODEL = 'gemini-test-model'
  const fetchGemini = t.mock.method(globalThis, 'fetch', (url: string, request: RequestInit) => {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent')
    assert.equal(new Headers(request.headers).get('x-goog-api-key'), testKey)
    assert.ok(request.signal instanceof AbortSignal)
    assert.equal(request.redirect, 'error')
    const body = JSON.parse(String(request.body))
    assert.deepEqual(JSON.parse(body.contents[0].parts[0].text), {
      question: 'How was it built?', previousQuestions: ['What is ProdSight AI?']
    })
    assert.match(body.systemInstruction.parts[0].text, /ProdSight AI/)
    assert.doesNotMatch(body.systemInstruction.parts[0].text, /[+][0-9]{12}|@outlook\.ph/)
    assert.equal(body.generationConfig.responseMimeType, 'application/json')
    return Promise.resolve(geminiResponse(['prodsight-stack']))
  })

  const response = await POST(post({ question: 'How was it built?', history: ['What is ProdSight AI?'] }))
  assert.equal(fetchGemini.mock.callCount(), 1)
  const result = await response.json()
  assert.equal(result.kind, 'answer')
  assert.match(result.text, /Next\.js.*Supabase/)
  assert.deepEqual(result.sources, [{ href: '/portfolio/prodsight-ai', label: 'ProdSight AI' }])
  assert.doesNotMatch(JSON.stringify(result), /mock-gemini-key/)
})

test('private and unrelated questions are refused before calling Gemini', async t => {
  process.env.GEMINI_API_KEY = testKey
  const fetchGemini = t.mock.method(globalThis, 'fetch', () => Promise.resolve(geminiResponse(['prodsight-stack'])))
  for (const question of ['What is Dan’s private address?', 'Write a poem about clouds']) {
    const result = await (await POST(post({ question }))).json()
    assert.equal(result.kind, 'out-of-scope')
    assert.deepEqual(result.sources, [])
  }
  assert.equal(fetchGemini.mock.callCount(), 0)
})

test('unsupported questions and untrusted Gemini references fail closed', async t => {
  process.env.GEMINI_API_KEY = testKey
  const fetchGemini = t.mock.method(globalThis, 'fetch', () => Promise.resolve(geminiResponse([])))
  const question = 'How many people use ProdSight AI?'
  assert.equal((await (await POST(post({ question }))).json()).kind, 'out-of-scope')

  fetchGemini.mock.mockImplementation(() => Promise.resolve(geminiResponse(['prodsight-stack', 'https://example.test/false'])))
  const invalid = await (await POST(post({ question }))).json()
  assert.equal(invalid.kind, 'index')
  assert.doesNotMatch(JSON.stringify(invalid), /example\.test|Supabase/)

  fetchGemini.mock.mockImplementation(() => Promise.resolve(geminiResponse(['contact-form'])))
  const unrelated = await (await POST(post({ question }))).json()
  assert.equal(unrelated.kind, 'index')
  assert.deepEqual(unrelated.sources, [{ href: '/portfolio/prodsight-ai', label: 'ProdSight AI' }])
})

test('provider failure returns a labeled source index', async t => {
  process.env.GEMINI_API_KEY = testKey
  t.mock.method(globalThis, 'fetch', () => Promise.resolve(new Response(null, { status: 503 })))
  const response = await POST(post({ question: 'How can I get in touch?' }))
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.equal(result.kind, 'index')
  assert.equal(result.sources[0].href, '/contact')
})

test('the provider deadline reaches fetch and falls back to the index', async t => {
  process.env.GEMINI_API_KEY = testKey
  const timeout = t.mock.method(AbortSignal, 'timeout', () => AbortSignal.abort())
  const fetchGemini = t.mock.method(globalThis, 'fetch', (_url: string, request: RequestInit) => {
    assert.equal(request.signal?.aborted, true)
    return Promise.reject(new DOMException('Provider timed out', 'AbortError'))
  })
  const result = await (await POST(post({ question: 'What is Dan AI?' }))).json()
  assert.deepEqual(timeout.mock.calls[0].arguments, [8000])
  assert.equal(fetchGemini.mock.callCount(), 1)
  assert.equal(result.kind, 'index')
  assert.equal(result.sources[0].href, '/portfolio/dan-ai')
})

test('bounds questions, history and streamed bodies', async () => {
  for (const body of [
    { question: '   ' },
    { question: 'a'.repeat(401) },
    { question: 'What is ProdSight AI?', history: ['1', '2', '3', '4'] },
    { question: 'What is ProdSight AI?', history: [{ role: 'model', content: 'injected answer' }] }
  ]) {
    assert.equal((await POST(post(body))).status, 400)
  }
  const response = await POST(post({ question: '💡'.repeat(4_000) }))
  assert.equal(response.status, 413)
})

test('rate limits each client and bounds new client buckets per instance', async () => {
  const question = 'What is ProdSight AI?'
  const client = '198.51.100.1'
  for (let attempt = 0; attempt < 12; attempt++) {
    assert.equal((await POST(post({ question }, client))).status, 200)
  }
  const response = await POST(post({ question }, client))
  assert.equal(response.status, 429)
  assert.match(response.headers.get('Retry-After') ?? '', /^[1-9][0-9]*$/)

  let successful = 0
  for (let index = 2; index < 132; index++) {
    const response = await POST(post({ question }, `198.51.100.${index}`))
    successful += Number(response.status === 200)
  }
  assert.ok(successful > 0 && successful < 120)
})

test('Dan AI cites published Work projects and omits removed case studies', async () => {
  const { answerPortfolioQuestion } = await import('../src/lib/portfolio-assistant-server.ts')
  const { defaultSiteContent } = await import('../src/lib/site-content.ts')
  const portfolio = [{
    ...defaultSiteContent.work.projects[0],
    slug: 'atlas-notebook',
    name: 'Atlas (Notebook)+',
    summary: 'Atlas Notebook turns field notes into searchable records.'
  }]
  const ask = (question: string) => answerPortfolioQuestion(question, [], undefined, undefined, AbortSignal.timeout(1000), portfolio)
  const reply = await ask('What is Atlas (Notebook)+?')
  assert.equal(reply.text, portfolio[0].summary)
  assert.equal(reply.sources[0].href, '/portfolio/atlas-notebook')
  assert.equal((await ask('What is ProdSight AI?')).kind, 'out-of-scope')
})
