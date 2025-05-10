'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Calendar, Loader } from 'lucide-react'
import { IconSend2 } from '@tabler/icons-react'
import { chat } from '@/app/(personal)/(home)/_actions/genkit'

// Gemini AI API integration
// const getGeminiResponse = async (message: string, apiKey: string) => {
//   try {
//     // Updated Gemini API endpoint for Gemini 2.0 Flash
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           contents: [
//             {
//               parts: [
//                 {
//                   text: `You are a helpful AI assistant that helps users book appointments through Calendly.
//                        The user message is: "${message}"
//                        If the user is asking about booking or scheduling, suggest showing Calendly options.
//                        Respond in a friendly, concise manner.`
//                 }
//               ]
//             }
//           ],
//           generationConfig: {
//             temperature: 0.7,
//             maxOutputTokens: 200
//           }
//         })
//       }
//     )

//     const data = await response.json()

//     // Extract the text response from Gemini
//     let textResponse = ''
//     try {
//       textResponse = data.candidates[0].content.parts[0].text
//     } catch (e) {
//       console.error('Error parsing Gemini response:', e)
//       textResponse =
//         'I had trouble processing that. How can I help you with scheduling?'
//     }

//     // Determine if we should show Calendly options
//     const shouldShowCalendly =
//       message.toLowerCase().includes('schedule') ||
//       message.toLowerCase().includes('book') ||
//       message.toLowerCase().includes('appointment') ||
//       message.toLowerCase().includes('meeting') ||
//       message.toLowerCase().includes('calendly') ||
//       textResponse.toLowerCase().includes('schedule') ||
//       textResponse.toLowerCase().includes('book') ||
//       textResponse.toLowerCase().includes('appointment') ||
//       textResponse.toLowerCase().includes('calendly')

//     return {
//       text: textResponse,
//       action: shouldShowCalendly ? 'show_calendly_options' : null
//     }
//   } catch (error) {
//     console.error('Error with Gemini API:', error)
//     return {
//       text: "I'm having trouble connecting to my AI services. Would you like to schedule an appointment anyway?",
//       action: null
//     }
//   }
// }

// Fallback to mock response if API key is not provided or API fails
// const mockAIResponse = async (message: string) => {
//   // Simulate API delay
//   await new Promise(resolve => setTimeout(resolve, 1000))

//   const message_lower = message.toLowerCase()

//   // Check if message is about scheduling or booking
//   if (
//     message_lower.includes('schedule') ||
//     message_lower.includes('book') ||
//     message_lower.includes('appointment') ||
//     message_lower.includes('meeting') ||
//     message_lower.includes('calendly')
//   ) {
//     return {
//       text: "I'd be happy to help you book an appointment! What type of meeting would you like to schedule?",
//       action: 'show_calendly_options'
//     }
//   }
//   // Simple responses for greeting messages
//   else if (
//     message_lower.includes('hello') ||
//     message_lower.includes('hi') ||
//     message_lower.includes('hey')
//   ) {
//     return {
//       text: "Hello! I'm your AI assistant. I can help you book appointments through Calendly. How can I assist you today?",
//       action: null
//     }
//   }
//   // Default response
//   else {
//     return {
//       text: "I'm here to help you schedule appointments through Calendly. Would you like to book a meeting?",
//       action: null
//     }
//   }
// }

const parseMarkdownLinks = (text: string) => {
  if (!text) return ''

  const parts = []
  let lastIndex = 0

  // Updated regex to not capture trailing periods
  const regex = /\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s)]+?(?=\.|$)/g
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1] && match[2]) {
      // Markdown link case: [text](url)
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target='_blank'
          rel='noopener noreferrer'
          className='text-forest-green-500 underline'
        >
          {match[1]}
        </a>
      )
    } else {
      // Plain URL case: http(s)://example.com
      const url = match[0]
      const displayText = url.replace(/^https?:\/\//, '')
      parts.push(
        <a
          key={match.index}
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          className='text-forest-green-500 underline'
        >
          {displayText}
        </a>
      )
    }

    lastIndex = regex.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}

// Meeting types - in a real application, these would be fetched from Calendly API
const meetingTypes = [
  {
    id: '1',
    name: '30 Minute Meeting',
    duration: 30,
    url: 'https://calendly.com/your-account/30min'
  },
  {
    id: '2',
    name: '60 Minute Meeting',
    duration: 60,
    url: 'https://calendly.com/your-account/60min'
  },
  {
    id: '3',
    name: '15 Minute Quick Chat',
    duration: 15,
    url: 'https://calendly.com/your-account/15min'
  }
]

const ChatBox = () => {
  const [messages, setMessages] = useState<
    {
      id: number
      text: string
      sender: string
      action?: string | null
      meetingUrl?: string
    }[]
  >([
    {
      id: 1,
      text: "Hello! I'm PattyBOT, your AI assistant. How can I help you today?",
      sender: 'ai',
      action: null,
      meetingUrl: ''
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCalendlyOptions, setShowCalendlyOptions] = useState(false)

  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim()) return

    const currentMessage = inputValue

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: currentMessage,
      sender: 'user',
      action: null,
      meeetingUrl: ''
    }

    setMessages(prevMessages => [...prevMessages, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Use the server action to get AI response
      const aiResponse = await chat(
        currentMessage,
        messages.flatMap(message => message.text)
      )
      console.log(aiResponse)

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse.text,
        sender: aiResponse.sender,
        action: aiResponse.action
      }

      setMessages(prevMessages => [...prevMessages, aiMessage])

      if (aiResponse.action === 'show_calendly_options') {
        setShowCalendlyOptions(true)
      }
    } catch (error) {
      console.error('Error getting AI response:', error)

      const errorResponse = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        action: null,
        meetingUrl: null
      }
      setMessages(prevMessages => [...prevMessages, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMeetingSelect = meeting => {
    setShowCalendlyOptions(false)

    // Add message about selected meeting
    const selectionMessage = {
      id: Date.now(),
      text: `I've selected the ${meeting.name} (${meeting.duration} minutes).`,
      sender: 'user',
      action: null
    }

    const confirmationMessage = {
      id: Date.now() + 1,
      text: `Great choice! I'll open the booking page for your ${meeting.name}. You can complete your booking there.`,
      sender: 'ai',
      action: 'open_calendly',
      meetingUrl: meeting.url
    }

    setMessages(prev => [...prev, selectionMessage, confirmationMessage])

    // Open Calendly URL immediately instead of waiting
    window.open(meeting.url, '_blank')

    // After a short delay, add a follow-up message to indicate completion
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "I've opened Calendly in a new tab. Once you complete your booking there, let me know if you need anything else!",
          sender: 'ai',
          action: null,
          meetingUrl: ''
        }
      ])
    }, 2000)
  }

  return (
    <div className='flex flex-col bg-neutral-100/30 w-full rounded-2xl '>
      {/* Header */}
      {/* <header className='bg-white shadow p-4 flex items-center justify-between'>
        <div className='flex items-center'>
          <MessageSquare className='text-blue-500 mr-2' />
          <h1 className='text-xl font-semibold'>
            Gemini AI Chat Assistant with Calendly
          </h1>
        </div>
        {!showApiKeyInput && (
          <button
            onClick={() => setShowApiKeyInput(true)}
            className='text-sm text-blue-500 hover:text-blue-700'
          >
            Change API Key
          </button>
        )}
      </header> */}

      {/* API Key Input */}
      {/* {showApiKeyInput && (
        <div className='bg-blue-50 p-4 border-b border-blue-100'>
          <div className='max-w-3xl mx-auto'>
            <div className='mb-2'>
              <label
                htmlFor='apiKey'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Enter your Gemini API Key
              </label>
              <input
                type='password'
                id='apiKey'
                className='w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder='API Key from Google AI Studio'
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleApiKeySubmit()
                  }
                }}
              />
              <p className='text-xs text-gray-500 mt-1'>
                Get your API key from{' '}
                <a
                  href='https://aistudio.google.com/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-500 hover:underline'
                >
                  Google AI Studio
                </a>
              </p>
            </div>
            <div className='flex justify-end'>
              <button
                type='button'
                onClick={handleApiKeySubmit}
                className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded'
              >
                Gemini
              </button>
              {apiKey === '' && (
                <button
                  type='button'
                  onClick={() => {
                    setApiKey('')
                    handleApiKeySubmit()
                  }}
                  className='ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1 rounded'
                >
                  Demo
                </button>
              )}
            </div>
          </div>
        </div>
      )} */}

      {/* Chat container */}
      <div className='flex-1 overflow-y-auto py-4 pl-1 pr-2 max-h-[50vh] my-0.5'>
        <div className=' mx-auto'>
          {messages.map(message => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div>
                <span className='text-[0.5rem] text-neutral-300 text-end'>
                  {message.sender === 'user' ? 'me' : 'PattyBOT'}
                </span>
                <div
                  className={`p-3 rounded-lg max-w-[280px] md:max-w-sm lg:max-w-md text-sm ${
                    message.sender === 'user'
                      ? 'bg-forest-green-700 text-forest-green-50 rounded-br-none'
                      : 'bg-neutral-200 shadow-xs text-forest-green-700 rounded-bl-none'
                  }`}
                >
                  {typeof message.text === 'string'
                    ? parseMarkdownLinks(message.text)
                    : message.text}

                  {/* Show Calendly booking UI when action is open_calendly */}
                  {message.action === 'open_calendly' && (
                    <div className='mt-2 flex items-center text-sm'>
                      <Calendar className='mr-1 h-4 w-4' />
                      <a
                        href={message.meetingUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-forest-green-600 hover:underline'
                      >
                        Open Calendly
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Calendly meeting options */}
          {showCalendlyOptions && (
            <div className='mb-4 flex justify-start'>
              <div className='bg-white shadow rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-lg rounded-tl-none'>
                <p className='mb-2 font-medium'>
                  Please select a meeting type:
                </p>
                <div className='space-y-2'>
                  {meetingTypes.map(meeting => (
                    <button
                      key={meeting.id}
                      onClick={() => handleMeetingSelect(meeting)}
                      className='w-full bg-forest-green-50 hover:bg-forest-green-100 text-forest-green-800 py-2 px-3 rounded flex justify-between items-center transition duration-150'
                    >
                      <span>{meeting.name}</span>
                      <span className='text-sm text-forest-green-400'>
                        {meeting.duration} min
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className='mb-4 flex justify-start'>
              <div className='bg-neutral-200 shadow rounded-lg p-3 flex items-center rounded-tl-none'>
                <Loader className='animate-spin h-4 w-4 mr-2 text-forest-green-500' />
                <span className='text-gray-500 text-xs'>
                  Patty is typing...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className='bg-neutral-50 border-t w-full pt-4'>
        <form onSubmit={handleSendMessage} className='mx-auto flex'>
          <input
            type='text'
            className='flex-1 border text-base scale-z-[0.8] border-neutral-200 text-forest-green-500 placeholder:text-neutral-300 rounded-l-lg px-4 py-4 focus:outline-none  focus:border-forest-green-400'
            placeholder='Ask me about Daniel...'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={isLoading}
            onKeyPress={e => {
              if (e.key === 'Enter' && inputValue.trim() && !isLoading) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
          />
          <button
            type='button'
            onClick={handleSendMessage}
            className='bg-forest-green-500 hover:bg-forest-green-700 text-white px-4 py-2 rounded-r-lg flex items-center justify-center disabled:bg-forest-green-100'
            disabled={!inputValue.trim() || isLoading}
          >
            <IconSend2 className='size-4' />
          </button>
        </form>
        <span className='text-[0.6rem] text-center block pt-2 text-neutral-300'>
          PattyBOT (AI) is still learing (beta) and can make mistakes.
        </span>
      </div>
    </div>
  )
}

export default ChatBox
