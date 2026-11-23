export const publicPagePaths = [
  '/', '/about', '/availability', '/cv', '/portfolio', '/contact', '/testimonial',
  '/thread', '/competencies', '/connect', '/activity'
]

export const siteOrigin = 'https://adazol.com'
export const publicEmail = 'daniel.lozada@outlook.ph'
export const currentRole = {
  role: 'Software Engineer/Developer',
  organization: 'Cognitive AI Philippines',
  startDate: 'August 1, 2025',
  focus: 'AI-first development',
  aiTools: 'OpenAI Codex, Claude, Gemini, and the Model Context Protocol (MCP)'
}
export const workAvailability = 'Available for work'
export const profiles = {
  LinkedIn: 'https://linkedin.com/in/daniel-josaphat-lozada',
  GitHub: 'https://github.com/adazol123',
  Figma: 'https://figma.com/@adazolhub',
  Behance: 'https://behance.net/adazolhub'
}

export const resumeDocuments = [
  { label: 'Resume', path: '/resume', file: '/documents/daniel-lozada-resume.pdf' },
  { label: 'ATS resume', path: '/resume_detailed', file: '/documents/daniel-lozada-resume-ats.pdf' }
]

const projectDetails = [
  {
    slug: 'prodsight-ai',
    name: 'ProdSight AI',
    category: 'Product planning',
    summary: 'An AI-assisted workspace for turning early ideas into product briefs and requirements.',
    role: 'Full-stack development',
    outcome: 'Teams can draft briefs and collect requirements in the same project workspace.',
    alt: 'ProdSight interface with a product development workspace',
    stack: ['Next.js', 'TypeScript', 'NestJS', 'Supabase', 'Gemini'],
    problem: 'Early product ideas often get spread across notes, chat threads and documents. ProdSight brings that initial planning into a project workspace.',
    implementation: 'The web app organizes projects and planning tools around distinct steps such as writing a brief and gathering requirements. A separate NestJS API supports the app. The public source documents the frontend and its integration with that API.',
    links: [{ label: 'View source', href: 'https://github.com/adazol123/prodsight-ai' }]
  },
  {
    slug: 'dan-ai',
    name: 'Dan AI',
    category: 'Portfolio assistant',
    summary: 'Ask a question about my work and follow the answer back to a case study or career page.',
    role: 'Portfolio and assistant development',
    outcome: 'Visitors can find relevant portfolio pages from an answer or through the public index when the assistant is unavailable.',
    alt: 'The original Dan AI chat widget on the Adazol portfolio',
    stack: ['Next.js', 'TypeScript', 'Gemini'],
    problem: 'A resume or project page can answer common questions, but a visitor may have to open several pages to put the details together.',
    implementation: 'This portfolio puts questions next to the work. Gemini selects relevant statements from a curated set of public portfolio facts. The server resolves the statements and their source links, and the same portfolio index can guide visitors during an outage.',
    links: [{ label: 'Ask Dan AI', href: '/#ask-dan' }]
  },
  {
    slug: 'winners-circle-guild',
    name: 'Winner’s Circle Guild Bot',
    category: 'Community tooling',
    summary: 'A Discord bot for checking Pegaxy race stats, history, and cooldowns in a guild channel.',
    role: 'Discord bot development',
    outcome: 'Guild members could look up race history, statistics, and cooldowns without leaving Discord.',
    alt: 'Winner’s Circle Guild’s Pegaxy Discord bot project artwork',
    stack: ['Node.js', 'JavaScript', 'Discord API', 'Firebase'],
    problem: 'Guild members needed quick access to race and stable information while coordinating in Discord.',
    implementation: 'Discord commands brought common Pegaxy lookups into the channel, including race history, statistics, and cooldowns. Guild-specific access kept the interaction in the community it was built for.',
    links: [{ label: 'View source', href: 'https://github.com/adazol123/winners-circle-guild' }]
  }
]

export function projectPath(slug: string) {
  return `/portfolio/${slug}`
}

export const caseStudies = projectDetails.map(project => ({
  ...project,
  path: projectPath(project.slug),
  image: `/work/${project.slug}.webp`
}))

export function shouldOptimizeProjectImage(image: string) {
  // The bundled covers are already sized and compressed for the site.
  return !image.startsWith('https://') && !caseStudies.some(project => project.image === image)
}

export function findCaseStudy(slug: string) {
  return caseStudies.find(project => project.slug === slug)
}

export const career = [
  {
    role: currentRole.role,
    organization: currentRole.organization,
    period: `${currentRole.startDate} – Present`,
    description: `Uses ${currentRole.aiTools} in AI-first development for full-stack applications and services. Works across TypeScript, NestJS, React, PostgreSQL, and AWS serverless services.`
  },
  {
    role: 'Software Engineer',
    organization: 'Supafaya',
    period: 'Nov 2022 – Aug 2025',
    description: 'Delivered frontend features, backend integrations, and deployments across Next.js, NestJS, Firebase, and Google Cloud.'
  },
  {
    role: 'Junior Software Developer',
    organization: 'MetaverseGo',
    period: 'May – Nov 2022',
    description: 'Worked across the React frontend, Fastify services, AWS Lambda, and third-party payment integrations.'
  },
  {
    role: 'System Engineer',
    organization: 'Tata Consultancy Services',
    period: 'Aug 2019 – Feb 2022',
    description: 'Handled first-line technical support and documented incidents and requests through resolution or escalation.'
  },
  {
    role: 'Technical Support Intern',
    organization: 'Maralabs',
    period: 'Mar – Jun 2019',
    description: 'Helped set up networks, monitor server infrastructure, and troubleshoot connectivity.'
  }
]

export const skills = [
  { label: 'AI-first development', description: `AI-assisted software development with ${currentRole.aiTools} at ${currentRole.organization}.` },
  { label: 'Product and frontend', description: 'React, Next.js, TypeScript, responsive UI, and integration from design to deployment.' },
  { label: 'Services and data', description: 'NestJS, Node.js, REST APIs, PostgreSQL, Firebase, and third-party integrations.' },
  { label: 'Cloud and operations', description: 'AWS Lambda, Cloud Run, Cloud Functions, incident investigation, and service support.' }
]

export const fieldNotes = [
  {
    slug: 'grounding-dan-ai',
    title: 'Giving portfolio answers a source',
    topic: 'Applied AI',
    summary: 'How this portfolio turns questions into links to the work.',
    paragraphs: [
      'A question like “What has Daniel built with Gemini?” belongs next to the work itself. The assistant can point to the relevant projects and show the exact portfolio pages behind its answer.',
      'The app keeps the set of public facts small and explicit. Gemini chooses which statements answer the question, while the server resolves each statement and source link from the portfolio index. The same index provides a route to the work when the provider is unavailable.'
    ],
    link: { label: 'Read the Dan AI case study', href: '/portfolio/dan-ai' }
  },
  {
    slug: 'support-to-software',
    title: 'What service desk work taught me about software',
    topic: 'Engineering practice',
    summary: 'Why clear failure states and useful handoffs belong in the product.',
    paragraphs: [
      'At the service desk, each incoming report needed enough context for the next person to reproduce the problem or pick up the investigation. That discipline also belongs in the applications people use every day.',
      'For the contact form on this site, the visitor keeps their draft if delivery fails. The interface gives them a direct email route and confirms the message only after the delivery service accepts it.'
    ],
    link: { label: 'Read the career timeline', href: '/cv' }
  }
]
