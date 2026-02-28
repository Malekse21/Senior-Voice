import { getStore } from './storage'

// GROQ TRANSCRIPTION
export async function transcribeAudio(audioBlob) {
  const localKeys = getStore('api_keys')
  const groqKey = import.meta.env.VITE_GROQ_API_KEY || localKeys?.groq
  if (!groqKey) throw new Error('Groq key missing')

  const form = new FormData()
  form.append('file', audioBlob, 'audio.webm')
  form.append('model', 'whisper-large-v3')
  form.append('response_format', 'verbose_json')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + groqKey },
    body: form
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error('Groq: ' + (err.error?.message || res.status))
  }

  const data = await res.json()
  return { text: data.text, language: data.language }
}

// GROQ AGENT
export async function callGroq(prompt) {
  const localKeys = getStore('api_keys')
  const groqKey = import.meta.env.VITE_GROQ_API_KEY || localKeys?.groq
  if (!groqKey) throw new Error('Groq key missing')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + groqKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error('Groq LLM: ' + (err.error?.message || res.status))
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}
