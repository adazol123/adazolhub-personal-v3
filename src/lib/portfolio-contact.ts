export const contactLimits = { name: 100, email: 254, message: 5000 }

export type ContactFields = { name: string, email: string, message: string }
export type ContactErrors = Partial<Record<keyof ContactFields, string>>

export function contactMessage ({ name, email, message }: ContactFields) {
  return `Name: ${name}\nEmail: ${email}\n\n${message}`
}

export function contactDraftHref (recipient: string, fields: ContactFields) {
  const subject = encodeURIComponent('Portfolio contact message')
  const body = encodeURIComponent(contactMessage(fields).replace(/\r\n?|\n/g, '\r\n').toWellFormed())
  return `mailto:${recipient}?subject=${subject}&body=${body}`
}

const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i

export function isContactEmail (email: string) {
  if (email.length > contactLimits.email || !emailPattern.test(email)) return false
  const local = email.slice(0, email.indexOf('@'))
  return local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..')
}

export function readContactAddresses (sender: unknown, recipient: unknown) {
  if (typeof sender !== 'string' || typeof recipient !== 'string') return null
  const from = sender.trim()
  const to = recipient.trim()
  if (!isContactEmail(to) || /[\r\n]/.test(from)) return null

  // Resend accepts a single sender with an optional display name.
  const senderAddress = /^[^<>]+<([^<>]+)>$/.exec(from)?.[1] ?? from
  return isContactEmail(senderAddress) ? { from, to } : null
}

export function validateContactFields ({ name, email, message }: Partial<Record<keyof ContactFields, unknown>>) {
  const fields = {
    name: typeof name === 'string' ? name.trim() : '',
    email: typeof email === 'string' ? email.trim() : '',
    message: typeof message === 'string' ? message.trim() : ''
  }
  const errors: ContactErrors = {}
  if (!fields.name || fields.name.length > contactLimits.name || /[\r\n]/.test(fields.name)) {
    errors.name = `Enter your name in ${contactLimits.name} characters or fewer.`
  }
  if (!isContactEmail(fields.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!fields.message || fields.message.length > contactLimits.message) {
    errors.message = `Enter a message in ${contactLimits.message.toLocaleString('en-US')} characters or fewer.`
  }
  return { fields, errors }
}
