import { career, caseStudies, currentRole, fieldNotes, profiles, skills, workAvailability } from './portfolio-content.ts'
import { defaultContactTemplates, validateContactTemplates, type ContactTemplates } from './contact-email-templates.ts'

export const sceneThemes = {
  'server-aisle': { label: 'Server Aisle', description: 'Move through a live rack aisle, past mesh panels, status LEDs and overhead cable trays.' },
  'exposed-cpu': { label: 'Exposed CPU', description: 'Separate a processor’s heat spreader, bare silicon and motherboard socket as you scroll.' },
  'fiber-patch-bay': { label: 'Fiber Patch Bay', description: 'Glide past fiber bundles and their connectors at different depths.' }
} as const

export type SceneTheme = keyof typeof sceneThemes
export const siteThemes = ['forest', 'graphite', 'light', ...Object.keys(sceneThemes) as SceneTheme[]] as const
export type SiteTheme = typeof siteThemes[number]

export function isSceneTheme(theme: string): theme is SceneTheme {
  return Object.hasOwn(sceneThemes, theme)
}

export const defaultSiteContent = {
  appearance: {
    theme: 'server-aisle' as SiteTheme,
    ambientBackground: true,
    scrollBackground: true,
    visitorCount: true
  },
  landing: {
    role: 'Software engineer',
    location: 'Philippines',
    firstName: 'Daniel',
    lastName: 'Lozada.',
    introduction: `I build web products, APIs, and cloud services at ${currentRole.organization}, drawing on a background in systems support and a focus on ${currentRole.focus}.`,
    workButton: 'Explore my work',
    assistantButton: 'Ask Dan AI',
    selectedWorkHeading: 'Selected work',
    portfolioLink: 'Browse portfolio',
    notesHeading: 'Field notes',
    notesLink: 'All notes',
    contactHeading: 'Have something in mind?',
    contactButton: 'Get in touch',
    showPortrait: true,
    showActivity: true,
    showNotes: true
  },
  about: {
    title: 'About',
    titleAccent: 'me.',
    introduction: 'I’m Daniel Lozada, a software engineer based in the Philippines.',
    careerHeading: 'From systems support to software',
    careerParagraphs: [
      `I’m a ${currentRole.role} at ${currentRole.organization}, where I focus on ${currentRole.focus}. I joined on ${currentRole.startDate}.`,
      'I started on a service desk, learning how a system feels to the people who rely on it when something goes wrong. Today I build across the stack, from React interfaces and NestJS APIs to cloud deployments and the integrations between them.',
      'My work has included payment and mapping integrations, serverless services on AWS and Google Cloud, and product workflows that move between design and implementation. I care about clarity at each handoff, from the interface a visitor uses to the logs someone needs to diagnose a failure.'
    ],
    siteHeading: 'About this site',
    siteDescription: 'This edition uses Next.js for the pages, Three.js for the portrait, and Gemini for the questions desk. The case studies and resume have their own pages, so you can follow up on a response or browse directly.',
    notesLink: 'Read the field notes',
    skillsLink: 'Explore engineering skills',
    resumeLink: 'See my experience'
  },
  work: {
    metadataTitle: 'Selected work',
    title: 'Selected',
    titleAccent: 'work.',
    introduction: 'Selected projects from different parts of my practice.',
    emptyMessage: 'No projects have been published yet.',
    projects: caseStudies.map(({ slug, name, category, summary, role, outcome, alt, stack, problem, implementation, links, image }) =>
      ({ slug, name, category, summary, role, outcome, problem, implementation, image, alt, stack, links })
    )
  },
  notes: {
    title: 'Field',
    titleAccent: 'notes.',
    introduction: 'Short write-ups on the choices behind the work.',
    emptyMessage: 'No field notes have been published yet.',
    entries: fieldNotes.map(({ slug, title, topic, paragraphs, link }) => ({ slug, title, topic, paragraphs, link }))
  },
  resume: {
    title: 'Resume',
    introduction: 'Daniel Lozada · Full-stack software engineering and systems support',
    standard: { label: 'Resume', href: '' },
    ats: { label: 'ATS resume', href: '' },
    experienceHeading: 'Experience',
    career,
    skillsHeading: 'Engineering skills',
    skills
  },
  site: {
    availability: workAvailability,
    availabilityIntroduction: 'For roles or collaborations involving full-stack products, APIs, or cloud services, get in touch to discuss scope and timing.',
    availabilityHeading: 'What to include',
    availabilityDetails: 'Tell me what you’re building, what kind of help you need, and when you want to get started. For a role, a link to the job description helps.',
    footerName: 'Daniel Lozada',
    footerRole: 'Software engineer',
    profiles
  }
}

export type SiteContent = typeof defaultSiteContent

export const defaultAssistantSettings = {
  model: 'gemini-3.5-flash-lite',
  prompt: 'You select facts for a question-and-answer desk about the public portfolio of software engineer Daniel Lozada.'
}

export type AssistantSettings = typeof defaultAssistantSettings
export const defaultEditorContent = { ...defaultSiteContent, assistant: defaultAssistantSettings, contactTemplates: defaultContactTemplates }
export type EditorContent = typeof defaultEditorContent
export type SiteSection = keyof EditorContent

export function isGeminiModel(value: string) {
  return /^gemini-[a-z0-9.-]{1,63}$/i.test(value)
}

export const siteSections: Record<SiteSection, string> = {
  appearance: 'Appearance',
  landing: 'Landing page',
  about: 'About page',
  work: 'Work',
  notes: 'Field notes',
  resume: 'Resume',
  site: 'Site details',
  assistant: 'Dan AI',
  contactTemplates: 'Contact email templates'
}

export function isSiteSection(value: string): value is SiteSection {
  return Object.hasOwn(siteSections, value)
}

export function fieldLabel(key: string) {
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2')
  return ({ scrollBackground: 'Animate background on scroll', href: 'Link URL', slug: 'URL anchor', image: 'Cover image URL', alt: 'Cover image alt text', standard: 'Standard PDF', ats: 'ATS PDF', model: 'Gemini model', prompt: 'Custom prompt' } as Record<string, string>)[key]
    ?? spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function isSiteLink(value: string, httpsOnly = false) {
  if (/[\\\s\u0000-\u001f\u007f]/u.test(value)) return false
  try {
    if (!httpsOnly && value.startsWith('/') && !value.startsWith('//')) {
      return !new URL(value, 'https://adazol.com').pathname.startsWith('//')
    }
    if (!value.startsWith('https://')) return false
    const url = new URL(value)
    return !url.username && !url.password && Boolean(url.hostname)
  } catch {
    return false
  }
}

export function isResumeTarget(value: string) {
  if (!isSiteLink(value)) return false
  const { pathname } = new URL(value, 'https://adazol.com')
  try {
    return !/^\/resume(?:_detailed)?\/?$/i.test(decodeURIComponent(pathname))
  } catch {
    return false
  }
}

function validateField(template: unknown, value: unknown, path: string[]): string | null {
  const key = path.at(-1)!
  const name = path.slice(1).map(part => /^\d+$/.test(part) ? `#${Number(part) + 1}` : fieldLabel(part)).join(' / ')
  const section = path[0]
  if (typeof template === 'boolean') return typeof value === 'boolean' ? null : `${name} must be on or off.`
  if (typeof template === 'string') {
    if (typeof value !== 'string' || value.length > 6000) return `${name} must be text up to 6,000 characters.`
    if (section === 'contactTemplates') return null
    if (section === 'assistant') {
      if (key === 'model' && value.trim() && !isGeminiModel(value.trim())) return 'Enter a Gemini model ID starting with gemini-.'
      return null
    }
    if ((section === 'resume' && (key === 'href' || key === 'organization')) && value === '') return null
    if (section === 'work' && (key === 'image' || key === 'alt') && value === '') return null
    if (!value.trim()) return `${name} is required.`
    if (key === 'theme' && !siteThemes.some(theme => theme === value)) return 'Choose an available theme.'
    if (key === 'slug' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return `${name} must use lowercase letters, numbers and single hyphens.`
    if (section === 'work' && key === 'slug' && value.length > 100) return `${name} must be at most 100 characters.`
    if (key === 'image' || key === 'href' || path.includes('profiles')) {
      const valid = section === 'resume' ? isResumeTarget(value) : isSiteLink(value, path.includes('profiles'))
      if (!valid) return `${name} must be a valid ${path.includes('profiles') ? 'HTTPS link' : 'HTTPS link or site path'}.`
    }
    return null
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length > 50) return `${name} must contain at most 50 items.`
    if (key === 'paragraphs' && value.length === 0) return `${name} needs at least one paragraph.`
    for (const [index, item] of value.entries()) {
      const error = validateField(template[0], item, [...path, String(index)])
      if (error) return error
    }
    return null
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return `${name || 'Content'} must be an object.`
  const fields = Object.entries(template as Record<string, unknown>)
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== fields.length || fields.some(([field]) => !Object.hasOwn(record, field))) {
    return `${name || 'Content'} contains unexpected or missing fields.`
  }
  for (const [field, sample] of fields) {
    const error = validateField(sample, record[field], [...path, field])
    if (error) return error
  }
  return null
}

export const maxSectionBytes = 90_000

export function validateSiteSection(section: SiteSection, value: unknown): string | null {
  const error = validateField(defaultEditorContent[section], value, [section])
  if (error) return error
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > maxSectionBytes) return 'This section is too large to publish.'
  if (section === 'contactTemplates') return validateContactTemplates(value as ContactTemplates)
  if (section === 'work') {
    const { projects } = value as SiteContent['work']
    if (new Set(projects.map(project => project.slug)).size !== projects.length) return 'Every project needs a unique URL slug.'
  }
  if (section === 'notes') {
    const { entries } = value as SiteContent['notes']
    const slugs = new Set(entries.map(note => note.slug))
    if (slugs.size !== entries.length) return 'Every field note needs a unique URL anchor.'
    if ([...slugs].some(slug => slug === 'main-content' || slugs.has(`${slug}-heading`))) {
      return 'Choose URL anchors that are distinct from page and note heading IDs.'
    }
  }
  return null
}
