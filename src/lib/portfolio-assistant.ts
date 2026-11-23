export const MAX_ASK_LENGTH = 400
export const MAX_ASK_HISTORY = 3

export const ASK_SUGGESTIONS = [
  { label: 'Explore ProdSight AI', question: 'What is ProdSight AI?' },
  { label: 'Engineering background', question: 'What is Daniel’s technical background?' },
  { label: 'Get in touch', question: 'How can I get in touch with Daniel?' }
]

export type AskSource = { href: string; label: string }

export type AskReply = {
  kind: 'answer' | 'index' | 'out-of-scope'
  text: string
  sources: AskSource[]
}
