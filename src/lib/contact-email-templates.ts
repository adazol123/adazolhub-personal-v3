import { isContactEmail, type ContactFields } from './portfolio-contact.ts'

const submission = 'Name: {{name}}\nEmail: {{email}}\n\n{{message}}'

export const defaultContactTemplates = {
  notification: {
    subject: 'New portfolio contact message',
    replyTo: '{{email}}',
    text: submission,
    html: '',
    customHeaders: ''
  },
  confirmation: {
    subject: 'We received your portfolio contact message',
    replyTo: '',
    text: `Hi {{name}},\n\nThanks for reaching out. Here’s a copy of what you submitted.\n\n${submission}`,
    html: '',
    customHeaders: ''
  }
}

export type ContactTemplates = typeof defaultContactTemplates
type ContactTemplate = ContactTemplates['notification']
const placeholders = /{{([^{}]*)}}/g
const bodyFields = ['name', 'email', 'message']
const singleLine = /^[^\p{Cc}\p{Zl}\p{Zp}]+$/u

function readCustomHeaders(value: string) {
  const lines = value.split(/\r?\n/).filter(line => line.trim())
  if (lines.length > 12) return null
  const headers: Record<string, string> = {}
  const names = new Set<string>()
  for (const line of lines) {
    const match = /^(X-[a-z\d-]{1,62}): *(.*)$/i.exec(line)
    if (!match) return null
    const [, name, rawValue] = match
    const key = name.toLowerCase()
    const value = rawValue.trim()
    if (names.has(key) || !singleLine.test(value) || value.length > 512) return null
    names.add(key)
    headers[name] = value
  }
  return headers
}

// Substitutions in HTML are text. Keep them out of markup and raw-text elements.
function hasHtmlTextPlaceholders(html: string) {
  const text = html.replace(/<!--[^]*?-->|<(script|style|textarea|title|xmp|iframe|noembed|noframes|noscript|plaintext)\b[^>]*>[^]*?(?:<\/\1\s*>|$)|<(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, '')
  return !text.includes('<') && [...text.matchAll(placeholders)].length === [...html.matchAll(placeholders)].length
}

export function validateContactTemplates(templates: ContactTemplates) {
  for (const [key, template] of Object.entries(templates)) {
    const label = key === 'notification' ? 'Inbox notification' : 'Visitor summary'
    if (!template.subject.trim() || template.subject.length > 200 || !singleLine.test(template.subject) ||
        [...template.subject.matchAll(placeholders)].some(([, field]) => !['name', 'email'].includes(field))) {
      return `${label} needs a single-line subject of up to 200 characters. It can use {{name}} and {{email}}.`
    }
    const replyTo = template.replyTo.trim()
    if (replyTo && replyTo !== '{{email}}' && !isContactEmail(replyTo)) {
      return `${label} needs one Reply-To email address, {{email}}, or a blank value.`
    }
    if (!template.text.trim()) return `${label} needs a plain-text body.`
    if ([template.text, template.html].some(body => [...body.matchAll(placeholders)].some(([, field]) => !bodyFields.includes(field)))) {
      return `${label} body placeholders are {{name}}, {{email}}, and {{message}}.`
    }
    if (template.html && !hasHtmlTextPlaceholders(template.html)) {
      return `${label} HTML placeholders must appear in text between tags.`
    }
    if (!readCustomHeaders(template.customHeaders)) {
      return `${label} needs unique X- header names and a single-line value for each header (up to 12).`
    }
  }
  return null
}

const htmlEntities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function renderContactEmail(template: ContactTemplate, fields: ContactFields, addresses: { from: string; to: string }, confirmation = false) {
  const render = (source: string, transform: (value: string) => string = value => value) =>
    source.replace(placeholders, (token, field: string) => Object.hasOwn(fields, field) ? transform(fields[field as keyof ContactFields]) : token)
  const subject = render(template.subject, value => value.replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, ' ')).slice(0, 255).toWellFormed()
  const replyTo = template.replyTo.trim()
  const headers = readCustomHeaders(template.customHeaders) ?? {}
  if (confirmation) headers['Auto-Submitted'] = 'auto-replied'
  return {
    from: addresses.from,
    to: [confirmation ? fields.email : addresses.to],
    ...(replyTo && { reply_to: render(replyTo) }),
    subject,
    text: render(template.text),
    ...(template.html.trim() && { html: render(template.html, value => value.replace(/[&<>"']/g, char => htmlEntities[char])) }),
    ...(Object.keys(headers).length && { headers })
  }
}
