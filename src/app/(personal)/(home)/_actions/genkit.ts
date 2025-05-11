'use server'
import axios from 'axios'
export async function chat (userInput: string, history: string[] = []) {
  try {
    const response = await axios.post(`${process.env.API_URL}/chat`, {
      text: userInput,
      history
    })

    if (response.status !== 200) {
      throw response.data
    }
    const res = response.data
    return res
  } catch (error) {
    console.error(error)
    return {
      text: 'Something went wrong. Please try again in a few seconds.',
      action: '',
      history: [],
      sender: 'ai'
    }
  }
}
