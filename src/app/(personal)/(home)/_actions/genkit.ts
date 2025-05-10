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
  model: gemini20Flash // set default model
})

const askFlow = ai.prompt(process.env.PROMPT_CHATBOT!)

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

export async function chat (userInput: string) {
  try {
    let text = ''
    if (userInput && typeof userInput === 'string') {
      const { text: response, output } = await askFlow({
        text: userInput
      })

      const res = extractJSONFromResponse(response)

      if (!!output) {
        if (output.text !== undefined) text = output.text
        else text = res?.text || res || ''
      } else text = res?.text || res || ''

      return text
    }
  } catch (error) {
    console.error(error)
    return 'Something went wrong. Please try again in a few minutes'
  }
}
