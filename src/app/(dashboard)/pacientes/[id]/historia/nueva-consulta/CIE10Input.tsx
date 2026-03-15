'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Suggestion {
  code: string
  description: string
}

interface CIE10InputProps {
  codeValue: string | undefined
  descriptionValue: string | undefined
  onSelect: (code: string, description: string) => void
  codeProps: React.InputHTMLAttributes<HTMLInputElement>
  descriptionProps: React.InputHTMLAttributes<HTMLInputElement>
  codeError?: string
  descriptionError?: string
}

export function CIE10Input({
  codeValue,
  descriptionValue,
  onSelect,
  codeProps,
  descriptionProps,
  codeError,
  descriptionError,
}: CIE10InputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/cie10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data)
        setOpen(true)
      } else {
        setSuggestions([])
        setOpen(false)
      }
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    descriptionProps.onChange?.(e)
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 600)
  }

  const handleSelect = (s: Suggestion) => {
    onSelect(s.code, s.description)
    setSuggestions([])
    setOpen(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4" ref={containerRef}>
      {/* Code field */}
      <div className="space-y-1.5">
        <Label>Código CIE-10</Label>
        <Input
          placeholder="J00"
          {...codeProps}
          value={codeValue ?? ''}
        />
        {codeError && <p className="text-xs text-red-600">{codeError}</p>}
      </div>

      {/* Description field with AI autocomplete */}
      <div className="sm:col-span-3 space-y-1.5 relative">
        <Label className="flex items-center gap-1.5">
          Descripción
          {loading && <Loader2 className="h-3 w-3 animate-spin text-violet-500" />}
          {!loading && (
            <span className="inline-flex items-center gap-0.5 text-xs text-violet-500 font-normal">
              <Sparkles className="h-3 w-3" />
              IA
            </span>
          )}
        </Label>
        <Input
          placeholder="Escribe el diagnóstico y la IA sugerirá el código..."
          {...descriptionProps}
          value={descriptionValue ?? ''}
          onChange={handleDescriptionChange}
          autoComplete="off"
        />
        {descriptionError && <p className="text-xs text-red-600">{descriptionError}</p>}

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-lg border border-violet-200 bg-white shadow-lg overflow-hidden">
            <div className="px-3 py-1.5 bg-violet-50 border-b border-violet-100 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-500" />
              <span className="text-xs font-medium text-violet-600">Sugerencias IA — solo de apoyo</span>
            </div>
            {suggestions.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2.5 hover:bg-violet-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
              >
                <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-violet-700">
                  {s.code}
                </span>
                <span className="text-sm text-slate-700">{s.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
