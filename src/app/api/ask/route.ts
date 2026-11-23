import { isIP } from 'node:net'
import { MAX_ASK_HISTORY, MAX_ASK_LENGTH } from '../../../lib/portfolio-assistant.ts'
import { readServiceToken } from '../../../lib/service-credentials.ts'
import { isExcludedQuestion } from '../../../lib/portfolio-assistant-sources.ts'
import { defaultEditorContent, defaultSiteContent } from '../../../lib/site-content.ts'
import { readAssistantContent } from '../../../lib/site-content-store.ts'
import { answerPortfolioQuestion } from '../../../lib/portfolio-assistant-server.ts'

export const runtime = 'nodejs'

const maxBodyBytes = 12_000
const rateWindowMs = 60_000
const requestsPerClient = 12
const requestsPerInstance = 120

let windowEnds = 0
let windowRequests = 0
const clientRequests = new Map<string, number>()

function timeUntilRetry(request: Request) {
  const now = Date.now()
  if (now >= windowEnds) {
    windowEnds = now + rateWindowMs
    windowRequests = 0
    clientRequests.clear()
  }

  // The edge supplies this header on Vercel. Other runtimes share the anonymous budget.
  const forwardedIp = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.trim() : null
  const client = forwardedIp && isIP(forwardedIp) ? forwardedIp : 'anonymous'
  const requests = clientRequests.get(client) ?? 0
  if (windowRequests >= requestsPerInstance || requests >= requestsPerClient) {
    return Math.max(1, Math.ceil((windowEnds - now) / 1000))
  }
  clientRequests.set(client, requests + 1)
  windowRequests++
  return 0
}

class BodyTooLarge extends Error {}

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > maxBodyBytes) throw new BodyTooLarge()
  if (!request.body) return null

  const reader = request.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let length = 0
  let text = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBodyBytes) throw new BodyTooLarge()
      text += decoder.decode(value, { stream: true })
    }
    return JSON.parse(text + decoder.decode())
  } catch (error) {
    void reader.cancel().catch(() => {})
    throw error
  } finally {
    reader.releaseLock()
  }
}

function parseQuestion(value: unknown) {
  if (typeof value !== 'string' || value.length > MAX_ASK_LENGTH) return ''
  const question = value.normalize('NFKC').replace(/\s+/g, ' ').trim()
  return question.length <= MAX_ASK_LENGTH ? question : ''
}

function parseInput(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const { question, history = [] } = body as { question?: unknown; history?: unknown }
  const parsedQuestion = parseQuestion(question)
  if (!parsedQuestion || !Array.isArray(history) || history.length > MAX_ASK_HISTORY) return null
  const parsedHistory = history.map(parseQuestion)
  if (parsedHistory.some(prior => !prior)) return null
  return { question: parsedQuestion, history: parsedHistory }
}

function reply(data: unknown, status = 200, retryAfter?: number) {
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  if (retryAfter) headers.set('Retry-After', String(retryAfter))
  return Response.json(data, { status, headers })
}

export async function POST(request: Request) {
  const retryAfter = timeUntilRetry(request)
  if (retryAfter) return reply({ error: 'Too many questions. Try again in a minute.' }, 429, retryAfter)
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return reply({ error: 'Send your question as JSON.' }, 415)
  }

  let body: unknown
  try {
    body = await readBody(request)
  } catch (error) {
    return error instanceof BodyTooLarge
      ? reply({ error: 'The request is too large.' }, 413)
      : reply({ error: 'The request could not be read.' }, 400)
  }

  const input = parseInput(body)
  if (!input) return reply({ error: `Send a question of up to ${MAX_ASK_LENGTH} characters with up to ${MAX_ASK_HISTORY} previous questions.` }, 400)

  const excluded = isExcludedQuestion(input.question)
  const [{ work, assistant }, apiKey] = excluded ? [defaultEditorContent, undefined] : await Promise.all([
    readAssistantContent(),
    readServiceToken('gemini')
  ])
  return reply(await answerPortfolioQuestion(
    input.question,
    input.history,
    apiKey,
    assistant,
    request.signal,
    work === defaultSiteContent.work ? undefined : work.projects
  ))
}
