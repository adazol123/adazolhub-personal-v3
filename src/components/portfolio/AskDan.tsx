'use client'

import { ArrowUp, ArrowUpRight, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ASK_SUGGESTIONS, MAX_ASK_HISTORY, MAX_ASK_LENGTH } from '../../lib/portfolio-assistant.ts'
import type { AskReply } from '../../lib/portfolio-assistant.ts'
import { SkeletonLines } from './Skeleton'
import styles from './AskDan.module.css'

type Exchange = { id: number; question: string; reply: AskReply }

const responseLabels: Record<AskReply['kind'], string> = {
  answer: 'Gemini · sourced answer',
  index: 'Portfolio index',
  'out-of-scope': 'Portfolio scope'
}

export default function AskDan() {
  const [draft, setDraft] = useState('')
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const exchangeId = useRef(0)

  useEffect(() => {
    const transcript = transcriptRef.current
    if (transcript) transcript.scrollTop = transcript.scrollHeight
  }, [exchanges, pending])

  useEffect(() => () => {
    const request = activeRequest.current
    activeRequest.current = null
    request?.abort()
  }, [])

  async function ask(rawQuestion: string) {
    const question = rawQuestion.trim()
    if (!question || activeRequest.current) return

    const controller = new AbortController()
    activeRequest.current = controller
    setDraft(current => current.trim() === question ? '' : current)
    setError('')
    setPending(question)
    inputRef.current?.focus({ preventScroll: true })

    const timeout = window.setTimeout(() => controller.abort(), 20_000)
    let response: Response | undefined
    try {
      const history = exchanges
        .filter(exchange => exchange.reply.kind !== 'out-of-scope')
        .map(exchange => exchange.question)
        .slice(-MAX_ASK_HISTORY)
      response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
        signal: controller.signal
      })
      if (!response.ok) throw new Error('Ask request failed')

      const reply: AskReply = await response.json()
      if (activeRequest.current !== controller) return

      const exchange = { id: ++exchangeId.current, question, reply }
      setExchanges(current => [...current, exchange].slice(-MAX_ASK_HISTORY))
    } catch {
      if (activeRequest.current !== controller) return
      setDraft(current => current || question)
      setError(response?.status === 429
        ? 'Too many questions. Try again in a minute.'
        : controller.signal.aborted
          ? 'The answer took too long. Try again.'
          : 'The question didn’t go through. Try again.')
    } finally {
      window.clearTimeout(timeout)
      if (activeRequest.current === controller) {
        activeRequest.current = null
        setPending('')
      }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void ask(draft)
  }

  function reset() {
    const request = activeRequest.current
    activeRequest.current = null
    request?.abort()
    setExchanges([])
    setPending('')
    setDraft('')
    setError('')
    inputRef.current?.focus({ preventScroll: true })
  }

  const hasConversation = exchanges.length > 0 || Boolean(pending)

  return (
    <section id='ask-dan' aria-labelledby='ask-dan-heading' className={styles.section} tabIndex={-1}>
      <div className={styles.intro}>
        <h2 id='ask-dan-heading' className={styles.heading}>Ask Dan AI</h2>
        <p className={styles.description}>Ask about my projects, engineering background, or how to get in touch.</p>
        <ul className={styles.suggestions} aria-label='Suggested questions'>
          {ASK_SUGGESTIONS.map(suggestion => (
            <li key={suggestion.question}>
              <button type='button' disabled={Boolean(pending)} onClick={() => void ask(suggestion.question)}>
                {suggestion.label}
                <ArrowUpRight size={16} aria-hidden='true' />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.desk}>
        <div className={styles.deskHeader}>
          <span>Conversation</span>
          {(hasConversation || draft || error) && (
            <button type='button' className={styles.reset} onClick={reset}>
              <RotateCcw size={13} aria-hidden='true' /> Reset
            </button>
          )}
        </div>

        <div
          ref={transcriptRef}
          className={styles.transcript}
          role='log'
          aria-label='Ask Dan conversation'
          tabIndex={hasConversation ? 0 : undefined}
        >
          {!hasConversation && <p className={styles.empty}>Answers link back to the portfolio pages they draw on.</p>}
          {exchanges.map(({ id, question, reply }) => (
            <div key={id} className={styles.exchange}>
              <p className={styles.question}>{question}</p>
              <div className={styles.answer}>
                <p className={styles.responseLabel}>{responseLabels[reply.kind]}</p>
                <p>{reply.text}</p>
                {reply.sources.length > 0 && (
                  <ul className={styles.sources} aria-label={reply.kind === 'index' ? 'Related pages' : 'Sources'}>
                    {reply.sources.map(source => (
                      <li key={source.href}>
                        <Link href={source.href}>
                          {source.label}<ArrowUpRight size={13} aria-hidden='true' />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
          {pending && (
            <div className={styles.exchange}>
              <p className={styles.question}>{pending}</p>
              <div className={`${styles.answer} skeleton-answer`}>
                <p>Checking portfolio sources…</p>
                <SkeletonLines />
              </div>
            </div>
          )}
        </div>

        <div className={styles.composer}>
          {error && <p className={styles.error} role='alert'>{error}</p>}
          <form className={styles.form} onSubmit={submit}>
            <label htmlFor='ask-dan-question' className={styles.messageLabel}>Your message</label>
            <div className={styles.messageField}>
              <input
                ref={inputRef}
                id='ask-dan-question'
                type='text'
                value={draft}
                onChange={event => setDraft(event.target.value)}
                placeholder='Ask about a project…'
                maxLength={MAX_ASK_LENGTH}
                autoComplete='off'
                enterKeyHint='send'
                aria-describedby='ask-dan-hint'
              />
              <button type='submit' disabled={Boolean(pending) || !draft.trim()}>
                Send <ArrowUp aria-hidden='true' size={16} />
              </button>
            </div>
          </form>
          <p id='ask-dan-hint' className={styles.hint}>Questions may be processed by Gemini.</p>
        </div>
      </div>
    </section>
  )
}
