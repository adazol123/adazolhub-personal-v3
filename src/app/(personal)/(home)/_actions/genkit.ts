'use server'
import { genkit } from 'genkit'
import { googleAI, gemini20Flash } from '@genkit-ai/googleai'
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY!,
      apiVersion: ['v1beta']
    })
  ],
  model: gemini20Flash, // set default model
  promptDir: './prompts'
})

const askFlow = ai.prompt('danyel')

// Start the conversation with a greeting

function extractJSONFromResponse (response: string) {
  try {
    // Look for content between curly braces
    const match = response.match(/{[\s\S]*}/)
    if (match) {
      return JSON.parse(match[0])
    }
    return response
  } catch (error) {
    console.error('Error extracting JSON:', error)
    return null
  }
}

export async function chat (userInput: string, history: string[] = []) {
  try {
    const result = {
      text: '',
      action: '',
      history: [],
      sender: ''
    }
    if (userInput && typeof userInput === 'string') {
      const { text: response, output } = await askFlow({
        text: userInput,
        history
      })

      const res = extractJSONFromResponse(response)

      if (!!output) {
        if (output.text !== undefined) {
          result.text = output.text
          result.action = output?.action || ''
          result.history = output?.history || []
          result.sender = output?.sender || 'ai'
        } else {
          result.text = res?.text || res || ''
          result.action = res?.action || ''
          result.history = res?.history || []
          result.sender = res?.sender || 'ai'
        }
      } else {
        result.text = res?.text || res || ''
        result.action = res?.action || ''
        result.history = res?.history || []
        result.sender = res?.sender || 'ai'
      }

      return result
    }
  } catch (error) {
    console.error(error)
    return {
      text: 'Something went wrong. Please try again in a few minutes',
      action: '',
      history: [],
      sender: 'ai'
    }
  }
}
