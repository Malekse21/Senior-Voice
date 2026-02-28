import React, { useEffect, useState, useRef } from 'react'
import { cn } from '../lib/utils'
import { Button, Card, BottomNav } from '../components/ui'
import { getStore, setStore } from '../services/storage'
import { speak } from '../services/speech'
import { transcribeAudio, callGroq } from '../services/api'
import { executeTool, buildAgentPrompt } from '../services/tools'
import { Mic, Square, Volume2, Loader, Settings, CheckCircle, XCircle, RefreshCw, ThumbsUp } from 'lucide-react'

function parseAgentPlan(raw) {
  const fallback = {
    understood: 'Je n\'ai pas pu analyser votre demande.',
    response_voice: 'Je m\'en occupe.',
    tools_to_call: [],
    needs_clarification: false,
    clarification_question: null,
    confidence: 0
  }

  if (!raw || typeof raw !== 'string') return fallback

  const clean = raw.replace(/```json|```/g, '').trim()
  const firstBrace = clean.indexOf('{')
  const lastBrace = clean.lastIndexOf('}')
  const jsonCandidate =
    firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
      ? clean.slice(firstBrace, lastBrace + 1)
      : clean

  try {
    const parsed = JSON.parse(jsonCandidate)
    return {
      understood: parsed?.understood || 'D\'accord.',
      response_voice: parsed?.response_voice || parsed?.understood || 'C\'est fait.',
      tools_to_call: Array.isArray(parsed?.tools_to_call) ? parsed.tools_to_call : [],
      needs_clarification: false,
      clarification_question: null,
      confidence: typeof parsed?.confidence === 'number' ? parsed.confidence : 0
    }
  } catch {
    return fallback
  }
}

export default function MainPage({ screen, setScreen }) {
  const [micState, setMicState] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [language, setLanguage] = useState('FR')
  const [agentProgress, setAgentProgress] = useState([])
  const [result, setResult] = useState(null)
  const [alert, setAlert] = useState(null)

  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  const isRecording = useRef(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm'
      mediaRecorder.current = new MediaRecorder(stream, { mimeType })
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunks.current, { type: mimeType })
        await processRecording(blob)
      }

      mediaRecorder.current.start(100)
      isRecording.current = true
      setMicState('recording')
      speak('Je vous Ã©coute')
    } catch (err) {
      speak('Impossible d\'accÃ©der au microphone.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
      isRecording.current = false
      setMicState('processing')
    }
  }

  const processRecording = async (blob) => {
    try {
      const { text, language: lang } = await transcribeAudio(blob)
      setTranscript(text)
      setLanguage(lang || 'FR')
      await runAgent(text)
    } catch (err) {
      speak('Une erreur est survenue. RÃ©essayez.')
      setMicState('idle')
    }
  }

  const runAgent = async (text) => {
    setMicState('processing')
    setAgentProgress([])

    const memory = {
      name: getStore('user')?.name,
      contacts: getStore('contacts'),
      medications: getStore('medications'),
      appointments: getStore('appointments'),
      history: getStore('history')?.slice(0, 5),
      preferences: getStore('preferences')
    }

    try {
      const raw = await callGroq(buildAgentPrompt(text, memory))
      const plan = parseAgentPlan(raw)

      const toolResults = []
      for (const toolCall of plan.tools_to_call || []) {
        setAgentProgress(prev => [...prev, { tool: toolCall.tool, status: 'running' }])
        try {
          const result = await executeTool(toolCall.tool, toolCall.params)
          toolResults.push({ tool: toolCall.tool, result, success: true })
          setAgentProgress(prev => prev.map(t => t.tool === toolCall.tool ? { ...t, status: 'done' } : t))
        } catch (err) {
          toolResults.push({ tool: toolCall.tool, error: err.message, success: false })
          setAgentProgress(prev => prev.map(t => t.tool === toolCall.tool ? { ...t, status: 'error' } : t))
        }
      }

      speak(plan.response_voice || plan.understood || 'C\'est fait.')
      setMicState('speaking')
      setResult({ ...plan, toolResults })

      const history = getStore('history') || []
      history.unshift({
        transcript: text,
        understood: plan.understood,
        tools: plan.tools_to_call?.map(t => t.tool) || [],
        timestamp: new Date().toISOString()
      })
      setStore('history', history.slice(0, 50))

      window.speechSynthesis.onend = () => setMicState('idle')
    } catch (err) {
      speak('Excusez-moi, pouvez-vous rÃ©pÃ©ter ?')
      setMicState('idle')
    }
  }

  const toggleRecording = () => {
    isRecording.current ? stopRecording() : startRecording()
  }

  const userName = getStore('user')?.name || ''
  const hour = now.getHours()
  let greetingPrefix = 'Bonsoir'
  if (hour >= 6 && hour < 12) greetingPrefix = 'Bonjour'
  else if (hour >= 12 && hour < 18) greetingPrefix = 'Bon apres-midi'

  return (
    <div className="min-h-screen bg-[#fefcf8] pb-24">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Mic size={18} className="text-[#c9a227]" />
            </div>
            <span className="font-heading font-bold text-lg tracking-wide">SeniorVoice</span>
          </div>
          <button onClick={() => setScreen('settings')} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Alert banner */}
      {alert && (
        <div className="bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-xl mx-4 mt-4 p-4 flex items-center gap-3">
          <span className="text-[#1e3a5f] font-medium flex-1 text-sm">{alert}</span>
          <button onClick={() => setAlert(null)} className="text-[#6b7a8d] hover:text-[#1e3a5f]">
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Greeting */}
      <div className="text-center py-10">
        <h1 className="font-heading text-3xl text-[#1e3a5f] mb-1">
          {greetingPrefix}{userName ? ` ${userName}` : ''}
        </h1>
      </div>

      {/* Mic area */}
      <div className="flex flex-col items-center py-8">
        <div className="relative">
          {micState === 'recording' && (
            <div className="absolute inset-0 bg-red-200 rounded-full pulse-ring" />
          )}
          {micState === 'idle' && (
            <div className="absolute inset-0 rounded-full gold-glow" />
          )}
          <button
            onClick={toggleRecording}
            className={cn(
              'relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl',
              micState === 'recording' 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                : micState === 'processing'
                ? 'bg-[#1e3a5f] animate-pulse'
                : micState === 'speaking'
                ? 'bg-[#2d6a4f] shadow-green-200'
                : 'bg-[#1e3a5f] hover:bg-[#2a4d7a] shadow-[#1e3a5f]/30'
            )}
          >
            {micState === 'recording' ? (
              <Square size={36} className="text-white" fill="white" />
            ) : micState === 'processing' ? (
              <Loader size={36} className="text-white animate-spin" />
            ) : micState === 'speaking' ? (
              <Volume2 size={36} className="text-white" />
            ) : (
              <Mic size={40} className="text-white" />
            )}
          </button>
        </div>
        <p className="mt-5 text-[#6b7a8d] font-medium text-sm">
          {micState === 'recording' ? 'Appuyer pour arrÃªter' :
           micState === 'processing' ? 'Analyse en cours...' :
           micState === 'speaking' ? 'Sama parle...' :
           'Appuyer pour parler'}
        </p>
        <p className="mt-1 font-heading text-[#1e3a5f] text-lg font-semibold">Sama</p>
      </div>

      {/* Transcript card */}
      {transcript && (
        <div className="max-w-md mx-auto px-4 mb-4">
          <Card className="p-5">
            <p className="text-xs text-[#9aa5b6] uppercase tracking-wider mb-2 font-semibold">Vous avez dit :</p>
            <p className="text-lg italic text-[#1e3a5f] leading-relaxed">{transcript}</p>
            <span className="inline-block mt-3 bg-[#f5f7fa] text-[#1e3a5f] px-3 py-1 rounded-full text-xs font-semibold">
              {language}
            </span>
          </Card>
        </div>
      )}

      {/* Agent progress */}
      {agentProgress.length > 0 && (
        <div className="max-w-md mx-auto px-4 mb-4">
          <Card className="p-5">
            <p className="text-sm text-[#6b7a8d] mb-3 font-medium">Sama réfléchit...</p>
            {agentProgress.map((t, i) => (
              <div key={i} className={cn('flex items-center gap-3 p-3 rounded-xl mb-2', 
                t.status === 'done' ? 'bg-[#2d6a4f]/10' : 
                t.status === 'error' ? 'bg-red-50' : 'bg-[#f5f7fa]')}>
                {t.status === 'running' && <Loader size={16} className="animate-spin text-[#1e3a5f]" />}
                {t.status === 'done' && <CheckCircle size={16} className="text-[#2d6a4f]" />}
                {t.status === 'error' && <XCircle size={16} className="text-red-500" />}
                <span className="text-sm font-medium text-[#1e3a5f]">{t.tool}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="max-w-md mx-auto px-4 mb-4">
          <Card className="p-5">
            <p className="font-bold text-[#1e3a5f] mb-2">{result.understood}</p>
            <p className="text-base text-[#4a5568] mb-5 leading-relaxed">{result.response_voice}</p>
            <div className="flex gap-3">
              <Button onClick={() => { setResult(null); setTranscript('') }} className="flex-1 bg-[#2d6a4f] hover:bg-[#245a42]">
                <ThumbsUp size={16} className="mr-2" /> Oui, merci
              </Button>
              <Button variant="outline" onClick={() => { setResult(null); setTranscript('') }} className="flex-1">
                <RefreshCw size={16} className="mr-2" /> RÃ©pÃ©ter
              </Button>
            </div>
          </Card>
        </div>
      )}

      <BottomNav screen={screen} setScreen={setScreen} />
    </div>
  )
}




