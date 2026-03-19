'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onTranscript: (text: string) => void
  disabled?: boolean
}

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: {
    transcript: string
  }
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export function VoiceDictationButton({ onTranscript, disabled }: Props) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(() => {
    const w = window as SpeechWindow
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'es-PE'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (e) => {
      const text = Array.from(e.results)
        .filter((r) => r.isFinal)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim()
      if (text) onTranscript(text)
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }, [onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  if (!supported) return null

  return (
    <Button
      type="button"
      variant={listening ? 'destructive' : 'ghost'}
      size="icon"
      className={`h-6 w-6 shrink-0 ${listening ? 'animate-pulse' : ''}`}
      onClick={listening ? stop : start}
      disabled={disabled}
      title={listening ? 'Detener dictado de voz' : 'Dictar por voz (español)'}
    >
      {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
    </Button>
  )
}
