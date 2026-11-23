import type { AskSource } from './portfolio-assistant.ts'
import { career, currentRole, findCaseStudy, projectPath, resumeDocuments, workAvailability } from './portfolio-content.ts'
import type { SiteContent } from './site-content.ts'

type Topic = {
  source: AskSource
  matches: RegExp
  facts: Record<string, string>
}

const projectTopics = {
  'prodsight-ai': {
    matches: /\bprod[-\s]*sight\b/i,
    facts: {
      'prodsight-purpose': 'ProdSight AI is an AI-assisted workspace for turning early ideas into product briefs and requirements.'
    },
    stackFact: 'prodsight-stack'
  },
  'dan-ai': {
    matches: /\b(?:ask dan|dan[\s-]*ai|dan\s*\(\s*ai|portfolio assistant|chatbot)\b/i,
    facts: {
      'dan-ai-purpose': 'Dan AI helps visitors find answers about Daniel’s resume, software projects, and engineering background from his portfolio.',
      'dan-ai-grounding': 'Gemini selects statements from curated portfolio facts, and the server resolves those statements and their source links.'
    },
    stackFact: 'dan-ai-stack'
  },
  'winners-circle-guild': {
    matches: /\b(?:winners?['’]?s? circle|pegaxy|discord|wcg)\b/i,
    facts: {
      'wcg-purpose': 'The Winner’s Circle Guild Discord bot lets guild members check Pegaxy stats, race history, and cooldowns in Discord.'
    },
    stackFact: 'wcg-stack'
  }
}

const list = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
const defaultProjects: Topic[] = Object.entries(projectTopics).flatMap(([slug, { facts, matches, stackFact }]) => {
  const study = findCaseStudy(slug)
  if (!study) return []
  return [{
    source: { href: study.path, label: study.name },
    matches,
    facts: {
      ...facts,
      [stackFact]: `The ${study.name} case study lists ${list.format(study.stack)} as its stack.`,
      [`${slug}-implementation`]: study.implementation,
      [`${slug}-problem`]: study.problem
    }
  }]
})

const overview: Topic = {
  source: { href: '/', label: 'Project overview' },
  matches: /\b(?:projects?|portfolio|examples? of (?:his|daniel['’]s) work|what .*\bbuilt|what does .*\bbuild|past work|selected work)\b/i,
  facts: {
    'featured-projects': 'Daniel’s portfolio features ProdSight AI for product planning, the Dan AI portfolio assistant, and a Discord bot for Winner’s Circle Guild.'
  }
}

const contact: Topic = {
  source: { href: '/contact', label: 'Contact Daniel' },
  matches: /\b(?:contact|reach|in touch|connect|linkedin|e-?mail|message|hire|collaborat\w+)\b/i,
  facts: {
    'contact-form': 'You can reach Daniel through the contact page for project inquiries and collaborations. It lists his public email and LinkedIn profile.'
  }
}

const availability: Topic = {
  source: { href: '/availability', label: 'Availability' },
  matches: /\b(?:availab\w+|freelanc\w+|opportunit\w+|hire|open to work|work together)\b/i,
  facts: {
    'availability-info': `Daniel is ${workAvailability.toLowerCase()}. His availability page invites you to discuss roles or collaborations involving full-stack products, APIs, or cloud services.`
  }
}

const resumeSource = { href: '/cv', label: 'Resume and experience' }

const currentPosition: Topic = {
  source: resumeSource,
  matches: /\b(?:current\w* .{0,22}(?:employer|job|role|title|work)|where .{0,22}work now|where (?:does|is) .{0,25}work(?:ing)?|cognitive ai(?: philippines)?|ai[- ](?:first|driven) development)\b/i,
  facts: {
    'current-position': `Daniel is a ${currentRole.role} at ${currentRole.organization}. He started on ${currentRole.startDate} and focuses on ${currentRole.focus}.`
  }
}

const aiSkills: Topic = {
  source: { href: '/competencies', label: 'Engineering skills' },
  matches: /\b(?:codex|claude|gemini|mcp|model context protocol|ai[- ](?:tools?|skills?|workflows?|assisted development)|use[sd]? ai)\b/i,
  facts: {
    'current-ai-tools': `Daniel uses ${currentRole.aiTools} for AI-first development at ${currentRole.organization}.`
  }
}

const atsResume: Topic = {
  source: { href: resumeDocuments[1].path, label: 'Download ATS resume' },
  matches: /\bats\b|applicant tracking/i,
  facts: {
    'ats-resume': 'The ATS resume is available as a separate PDF download.'
  }
}

const previousPositions: Topic[] = career.slice(1).map((job, index) => ({
  source: resumeSource,
  matches: new RegExp(`\\b${job.organization.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
  facts: {
    [`previous-position-${index}`]: `${job.role} at ${job.organization}: ${job.period}. ${job.description}`
  }
}))

const cv: Topic = {
  source: resumeSource,
  matches: /\b(?:cv|resume|career history|work history|where .{0,25}worked|previous roles?|past employers?|companies .{0,24}worked)\b|résumé/i,
  facts: {
    'cv-page': 'Daniel’s resume page includes his career timeline, engineering skills, and downloadable PDFs.',
    'career-history': `Daniel’s public career timeline includes ${list.format(career.slice(1, 4).map(job => `${job.role} at ${job.organization}`))}.`
  }
}

const about: Topic = {
  source: { href: '/about', label: 'About Daniel' },
  matches: /\b(?:background|bio|about (?:him|dan(?:iel)?)|who is dan(?:iel)?|skills?|expertise|career|experience|engineering|full[- ]stack|cloud|aws|gcp|stripe|xendit|stack|technolog\w+|typescript|javascript|postgres\w*|react|next\.?js|nest\.?js|node\.?js)\b/i,
  facts: {
    'engineering-focus': 'Daniel Lozada is a software engineer in the Philippines who builds across React interfaces, NestJS APIs, and cloud deployments.',
    'systems-support': 'Daniel started in systems support, working on a service desk before moving into software engineering.',
    'cloud-experience': 'Daniel’s public profile describes experience deploying serverless systems on AWS and Google Cloud.',
    'integration-experience': 'Daniel’s public profile describes his work on payments and mapping integrations.'
  }
}

function publishedProjectTopic(project: SiteContent['work']['projects'][number]): Topic {
  const curated = Object.hasOwn(projectTopics, project.slug)
    ? projectTopics[project.slug as keyof typeof projectTopics]
    : undefined
  const name = project.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const namePattern = `(?:^|\\W)${name}(?:$|\\W)`
  const matches = new RegExp(curated ? `${namePattern}|${curated.matches.source}` : namePattern, 'i')
  const facts: Record<string, string> = {
    [`${project.slug}-purpose`]: project.summary,
    [`${project.slug}-implementation`]: project.implementation,
    [`${project.slug}-problem`]: project.problem,
    [`${project.slug}-outcome`]: project.outcome
  }
  if (project.stack.length) facts[curated?.stackFact ?? `${project.slug}-stack`] =
    `The ${project.name} case study lists ${list.format(project.stack)} as its stack.`
  return { source: { href: projectPath(project.slug), label: project.name }, matches, facts }
}

// Keep personal contact details, private employer material, and site internals outside the corpus.
const excludedQuestion = /\b(?:private|confidential|passwords?|secrets?|api keys?|credentials?|access tokens?|system prompts?|raw prompts?|hidden (?:data|instructions)|(?:ignore|override) .{0,25}(?:instructions?|rules?)|home address|street address|(?:his|daniel['’]s) address|phone numbers?|birth ?date|born|salary)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i
const contextualQuestion = /\b(?:it|its|that project|this project|the bot|the stack|more detail)\b|^and\b/i

export function isExcludedQuestion(question: string) {
  return excludedQuestion.test(question)
}

function directTopics(question: string, projects: Topic[], projectOverview: Topic | null) {
  const namedProjects = projects.filter(project => project.matches.test(question))
  const general = [availability, currentPosition, contact, atsResume, ...previousPositions, cv].filter(topic => topic.matches.test(question))
  const matchedSkills = aiSkills.matches.test(question) ? [aiSkills] : []
  if (namedProjects.length) return [...namedProjects, ...general, ...matchedSkills]
  if (projectOverview?.matches.test(question)) return [...general, projectOverview, ...projects.slice(0, 5), ...matchedSkills]
  const profile = [...matchedSkills, ...general]
  return about.matches.test(question) ? [...profile, about] : profile
}

export function topicsForQuestion(question: string, history: string[], published?: SiteContent['work']['projects']) {
  const projects = published ? published.map(publishedProjectTopic) : defaultProjects
  const projectOverview = !published ? overview : projects.length ? {
    ...overview,
    facts: { 'featured-projects': `Selected work includes ${list.format(published.slice(0, 5).map(project => project.name))}.` }
  } : null
  const direct = directTopics(question, projects, projectOverview)
  const hasNamedProject = projects.some(project => project.matches.test(question))
  if (hasNamedProject || !contextualQuestion.test(question) || direct.some(topic => topic !== about)) return direct

  const prior = history.slice().reverse().map(prior => directTopics(prior, projects, projectOverview)).find(topics => topics.length)
  return prior ?? direct
}

export function indexExcerpt(question: string, topic: Topic) {
  const preferences = [
    [/\bhow (?:did|does|is) .{0,60}(?:build|built|work)\b/i, /-implementation$/],
    [/\b(?:why|problem|purpose)\b/i, /-problem$/],
    [/\b(?:what stack|how .{0,25}built|how .{0,25}works?|technolog\w+)\b/i, /-stack$/],
    [/\b(?:aws|gcp|cloud)\b/i, /^cloud-experience$/],
    [/\b(?:stripe|xendit|payment\w*|mapping|integration\w*)\b/i, /^integration-experience$/],
    [/\b(?:where|employer\w*|companies|jobs|roles?|work history|career history)\b/i, /^career-history$/]
  ] as const
  const facts = Object.entries(topic.facts)
  for (const [questionPattern, factPattern] of preferences) {
    const fact = questionPattern.test(question) && facts.find(([id]) => factPattern.test(id))
    if (fact) return fact[1]
  }
  return facts[0][1]
}
