'use client'

import { useActionState, useEffect, useId, useState, useTransition, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { defaultSiteContent, fieldLabel, isSceneTheme, sceneThemes, siteSections, siteThemes, type SiteContent, type SiteSection } from '@/lib/site-content'
import styles from './admin.module.css'

export function LoginForm({ action }: { action: (previous: string, form: FormData) => Promise<string> }) {
  const [message, submit, pending] = useActionState(action, '')
  return (
    <form action={submit} className={styles.fields}>
      <label>Username<input name="username" autoComplete="username" required maxLength={100} /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
      {message && <p role="alert" className={styles.error}>{message}</p>}
      <button className={styles.primary} disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}

type FieldValue = string | boolean | FieldValue[] | { [key: string]: FieldValue }
type ChangeField = (value: FieldValue) => void

function blankField(template: FieldValue): FieldValue {
  if (typeof template === 'string') return ''
  if (typeof template === 'boolean') return false
  if (Array.isArray(template)) return template.length ? [blankField(template[0])] : []
  return Object.fromEntries(Object.entries(template).map(([key, value]) => [key, key === 'links' || key === 'stack' ? [] : blankField(value)]))
}

function ThemeField({ value, onChange }: { value: string; onChange: ChangeField }) {
  const id = useId()
  const description = isSceneTheme(value) ? sceneThemes[value].description : null
  return (
    <div className={styles.fields}>
      <label>Theme
        <select value={value} aria-describedby={description ? id : undefined} onChange={event => onChange(event.target.value)}>
          {siteThemes.map(theme => <option key={theme} value={theme}>{isSceneTheme(theme) ? sceneThemes[theme].label : fieldLabel(theme)}</option>)}
        </select>
      </label>
      {description && <small id={id}>{description}</small>}
    </div>
  )
}

function Field({ name, value, template, onChange, path }: {
  name: string
  value: FieldValue
  template: FieldValue
  onChange: ChangeField
  path: string[]
}) {
  const projectSlug = name === 'slug' && path[0] === 'work'
  const label = projectSlug ? 'Project URL slug' : fieldLabel(name)
  const currentPath = [...path, name]
  if (typeof value === 'boolean') {
    return <label className={styles.check}><input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)} />{label}</label>
  }
  if (typeof value === 'string') {
    if (name === 'theme') return <ThemeField value={value} onChange={onChange} />
    const pdf = name === 'href' && (path.includes('standard') || path.includes('ats'))
    const long = typeof template === 'string' && (template.length > 100 || ['paragraph', 'description', 'summary', 'outcome', 'problem', 'implementation'].includes(name))
    return (
      <label>{label}
        {pdf && <small>Use a site path or HTTPS URL. Leave blank to use the default download.</small>}
        {name === 'slug' && <small>Use lowercase letters, numbers and hyphens. Changing this changes the {projectSlug ? 'case-study URL' : 'note link'}.</small>}
        {name === 'image' && <small>Optional. Use a site path or an HTTPS image URL.</small>}
        {long
          ? <textarea rows={4} maxLength={6000} value={value} onChange={event => onChange(event.target.value)} />
          : <input maxLength={6000} value={value} onChange={event => onChange(event.target.value)} />}
      </label>
    )
  }
  if (Array.isArray(value) && Array.isArray(template)) {
    const sample = template[0]
    const itemLabel = ({ entries: 'note', projects: 'project', stack: 'technology', links: 'link', career: 'role', skills: 'skill', paragraphs: 'paragraph', careerParagraphs: 'paragraph' } as Record<string, string>)[name] ?? 'item'
    function move(index: number, offset: number) {
      const next = [...value as FieldValue[]]
      const target = index + offset
      const item = next[index]
      next[index] = next[target]
      next[target] = item
      onChange(next)
    }
    return (
      <fieldset className={styles.group}>
        <legend>{name === 'entries' ? 'Notes' : label}</legend>
        {name === 'projects' && <small>The first project is featured on the homepage and Work page.</small>}
        {value.map((item, index) => {
          const headingField = ({ note: 'title', project: 'name', role: 'role', skill: 'label', link: 'label' } as Record<string, string>)[itemLabel]
          const heading = typeof item === 'object' && !Array.isArray(item) ? item[headingField] : null
          const itemName = typeof heading === 'string' && heading ? heading : `${fieldLabel(itemLabel)} ${index + 1}`
          return (
            <fieldset className={styles.item} key={index}>
              <legend>{itemName}</legend>
              <div className={styles.rowActions}>
                <button type="button" className={styles.button} aria-label={`Move ${itemName} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={17} aria-hidden="true" /></button>
                <button type="button" className={styles.button} aria-label={`Move ${itemName} down`} disabled={index === value.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17} aria-hidden="true" /></button>
                <button type="button" className={styles.button} aria-label={`Remove ${itemName}`} onClick={() => onChange(value.filter((_, position) => position !== index))}>Remove</button>
              </div>
              <Field name={itemLabel} value={item} template={sample} path={currentPath}
                onChange={updated => onChange(value.map((prior, position) => position === index ? updated : prior))} />
            </fieldset>
          )
        })}
        <button type="button" className={styles.button} disabled={value.length >= 50} onClick={() => onChange([...value, blankField(sample)])}>
          <Plus size={17} aria-hidden="true" /> Add {itemLabel}
        </button>
      </fieldset>
    )
  }
  const fields = template as Record<string, FieldValue>
  const record = value as Record<string, FieldValue>
  const children = Object.entries(fields).map(([key, sample]) => (
    <Field key={key} name={key} value={record[key]} template={sample} path={currentPath} onChange={updated => onChange({ ...record, [key]: updated })} />
  ))
  if (path.length === 0 || ['note', 'project', 'role', 'skill'].includes(name)) return <div className={styles.fields}>{children}</div>
  return <fieldset className={styles.group}><legend>{label}</legend>{children}</fieldset>
}

type PublishResult = { error: string; revision?: never } | { revision: string; error?: never }

export function Editor({ content, revisions, publish, credentials }: {
  content: SiteContent
  credentials: ReactNode
  revisions: Record<SiteSection, string>
  publish: (section: string, revision: string, json: string) => Promise<PublishResult>
}) {
  const [section, setSection] = useState<SiteSection>('appearance')
  const [showCredentials, setShowCredentials] = useState(false)
  const [draft, setDraft] = useState(content)
  const [saved, setSaved] = useState(content)
  const [versions, setVersions] = useState(revisions)
  const [feedback, setFeedback] = useState<{ section: SiteSection; error: boolean; text: string }>()
  const [pending, startTransition] = useTransition()
  const sections = Object.keys(siteSections) as SiteSection[]
  const changed = (key: SiteSection) => JSON.stringify(draft[key]) !== JSON.stringify(saved[key])
  const hasUnsavedChanges = sections.some(changed)
  useEffect(() => {
    if (!hasUnsavedChanges) return
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  function submit() {
    setFeedback(undefined)
    const value = draft[section]
    startTransition(async () => {
      try {
        const result = await publish(section, versions[section], JSON.stringify(value))
        if (result.error !== undefined) {
          setFeedback({ section, text: result.error, error: true })
          return
        }
        setSaved(prior => ({ ...prior, [section]: value }))
        setVersions(prior => ({ ...prior, [section]: result.revision }))
        setFeedback({ section, text: 'Published to the portfolio.', error: false })
      } catch {
        setFeedback({ section, text: 'The request was interrupted. Reload to check the published version.', error: true })
      }
    })
  }

  return (
    <div className={styles.editor}>
      <nav aria-label="Editable sections" className={styles.sections}>
        {sections.map(key => (
          <button key={key} type="button" aria-pressed={!showCredentials && key === section} onClick={() => { setShowCredentials(false); setSection(key) }}>
            {siteSections[key]}{changed(key) && <span className={styles.unsaved}> · Unsaved</span>}
          </button>
        ))}
        <button type="button" aria-pressed={showCredentials} onClick={() => setShowCredentials(true)}>Service credentials</button>
      </nav>
      {showCredentials ? credentials : <form className={styles.content} onSubmit={event => { event.preventDefault(); if (!pending && changed(section)) submit() }}>
        <div className={styles.sectionHeader}>
          <h2>{siteSections[section]}</h2>
          <button type="submit" className={styles.primary} disabled={pending || !changed(section)}>{pending ? 'Publishing…' : 'Publish changes'}</button>
        </div>
        {feedback?.section === section && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? styles.error : styles.success}>{feedback.text}</p>}
        <fieldset disabled={pending} className={styles.formFields} key={section}>
          <Field name={section} template={defaultSiteContent[section]} value={draft[section]} path={[]}
            onChange={value => {
              setDraft(prior => ({ ...prior, [section]: value }))
              setFeedback(undefined)
            }} />
        </fieldset>
      </form>}
    </div>
  )
}
