'use client'

import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { publicEmail } from '@/lib/portfolio-content'
import { contactDraftHref, contactLimits, validateContactFields, type ContactErrors, type ContactFields } from '@/lib/portfolio-contact'
import { Skeleton } from './Skeleton'
import styles from './ContactForm.module.css'

const sendError = 'I couldn’t confirm your message was sent. Please try again or email me directly.'
const subscribeToHydration = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

function readFields(values: FormData) {
  return validateContactFields({
    name: values.get('name'),
    email: values.get('email'),
    message: values.get('message')
  })
}

export default function ContactForm({ enabled }: { enabled: boolean }) {
  const hydrated = useSyncExternalStore(subscribeToHydration, clientSnapshot, serverSnapshot)
  const formRef = useRef<HTMLFormElement>(null)
  const pending = useRef(false)
  const retry = useRef<{ body: string, requestId: string }>(null)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [sending, setSending] = useState(false)
  const [receipt, setReceipt] = useState('')
  const [problem, setProblem] = useState('')
  const [draftOpened, setDraftOpened] = useState(false)

  useEffect(() => {
    const firstError = Object.keys(errors)[0]
    if (firstError) {
      const field = formRef.current?.elements.namedItem(firstError)
      if (field instanceof HTMLElement) field.focus()
    }
  }, [errors])

  function openDraft(form: HTMLFormElement) {
    if (pending.current) return
    const { fields, errors: validation } = readFields(new FormData(form))
    setErrors(validation)
    setDraftOpened(false)
    if (Object.keys(validation).length) return

    window.location.href = contactDraftHref(publicEmail, fields)
    setDraftOpened(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const form = event.currentTarget
    if (!enabled) {
      openDraft(form)
      return
    }

    const values = new FormData(form)
    const { fields, errors: validation } = readFields(values)
    setErrors(validation)
    setReceipt('')
    setProblem('')
    setDraftOpened(false)
    if (Object.keys(validation).length) return

    pending.current = true
    setSending(true)
    try {
      const submission = { ...fields, website: values.get('website') ?? '' }
      const body = JSON.stringify(submission)
      // An unchanged retry uses the same delivery key if the provider accepted
      // the original request before its response reached this form.
      if (retry.current?.body !== body) {
        retry.current = { body, requestId: crypto.randomUUID() }
      }
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...submission, requestId: retry.current.requestId }),
        signal: AbortSignal.timeout(20_000)
      })
      const result = await response.json()
      if (response.status === 202 && result.status === 'accepted') {
        form.reset()
        retry.current = null
        setReceipt(result.summary === 'accepted'
          ? 'Thanks for reaching out. Your message was accepted for delivery. Check your inbox for a copy.'
          : 'Thanks for reaching out. Your message was accepted for delivery. We couldn’t confirm delivery of your email copy.')
      } else if (result.errors && typeof result.errors === 'object') {
        setErrors(result.errors)
      } else {
        setProblem(typeof result.message === 'string' ? result.message : sendError)
      }
    } catch {
      setProblem(sendError)
    } finally {
      pending.current = false
      setSending(false)
    }
  }

  function fieldProps(name: keyof ContactFields) {
    return {
      id: `contact-${name}`,
      name,
      required: true,
      maxLength: contactLimits[name],
      readOnly: sending,
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': errors[name] ? `contact-error-${name}` : undefined
    }
  }

  return (
    <form data-reveal ref={formRef} action="/api/contact" method="post" noValidate onSubmit={submit} className={styles.form}>
      {!enabled && (
        <p className={styles.unavailable} id="contact-unavailable">
          Online sending is currently unavailable. You can open a draft in your email app below.
        </p>
      )}
      <noscript><p>Enable JavaScript to use this form, or <a href={`mailto:${publicEmail}`}>email me directly</a>.</p></noscript>
      <fieldset disabled={!hydrated} aria-describedby={enabled ? undefined : 'contact-unavailable'} aria-busy={sending}>
        <legend className={styles.visuallyHidden}>Contact form</legend>
        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="contact-name">Name</label>
            <input {...fieldProps('name')} type="text" autoComplete="name" />
            {errors.name && <p className={styles.fieldError} id="contact-error-name">{errors.name}</p>}
          </div>
          <div className={styles.field}>
            <label htmlFor="contact-email">Email address</label>
            <input {...fieldProps('email')} type="email" autoComplete="email" />
            {errors.email && <p className={styles.fieldError} id="contact-error-email">{errors.email}</p>}
          </div>
          <div className={`${styles.field} ${styles.message}`}>
            <label htmlFor="contact-message">Message</label>
            <textarea {...fieldProps('message')} rows={6} />
            {errors.message && <p className={styles.fieldError} id="contact-error-message">{errors.message}</p>}
          </div>
        </div>
        <div hidden>
          <label htmlFor="contact-website">Leave this field empty</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <button className={styles.submit} type="submit" aria-disabled={sending || undefined}>
          {sending ? 'Sending…' : enabled ? 'Send message' : 'Open email draft'}
          {sending ? <Skeleton className={styles.sendingIndicator} /> : <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </fieldset>
      <p role="alert" className={styles.alert}>{problem}</p>
      {enabled && problem && (
        <button className={styles.draftButton} type="button" onClick={event => openDraft(event.currentTarget.form)}>
          Open email draft
        </button>
      )}
      <p role="status" className={styles.status}>
        {sending && <span className={styles.visuallyHidden}>Sending your message.</span>}
        {receipt}
        {draftOpened && 'If your email app opened, review and send the draft there.'}
      </p>
    </form>
  )
}
