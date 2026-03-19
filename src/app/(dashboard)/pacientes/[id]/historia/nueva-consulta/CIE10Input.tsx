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
    <div className="space-y-1.5" ref={containerRef}>

      {/* Descripción — campo principal, busca con IA */}
      <div className="relative space-y-1">
        <Label className="text-xs flex items-center gap-1">
          Descripción
          {loading
            ? <Loader2 className="h-3 w-3 animate-spin text-[var(--primary)]" />
            : <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--primary)] font-normal"><Sparkles className="h-2.5 w-2.5" />IA</span>
          }
        </Label>
        <Input
          placeholder="Escribe el diagnóstico..."
          className="text-xs"
          {...descriptionProps}
          value={descriptionValue ?? ''}
          onChange={handleDescriptionChange}
          autoComplete="off"
        />
        {descriptionError && <p className="text-xs text-[var(--danger)]">{descriptionError}</p>}

        {/* Dropdown de sugerencias */}
        {open && suggestions.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 min-w-[220px] border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
            <div className="px-3 py-1.5 bg-[var(--primary-subtle)] border-b border-[var(--border-subtle)] flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[var(--primary)]" />
              <span className="text-xs font-medium text-[var(--primary)]">Sugerencias IA</span>
            </div>
            {suggestions.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 hover:bg-[var(--primary-subtle)] transition-colors flex items-start gap-2 border-b border-[var(--border-subtle)] last:border-0"
              >
                <span className="shrink-0 mt-0.5 bg-[var(--primary-subtle)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--primary)]">
                  {s.code}
                </span>
                <span className="text-xs text-[var(--foreground)] leading-snug">{s.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Código CIE-10 — inline, se llena automático al seleccionar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--foreground-subtle)] shrink-0">Código:</span>
        <Input
          placeholder="J00"
          className="h-7 w-24 text-xs font-mono"
          {...codeProps}
          value={codeValue ?? ''}
        />
        {codeError && <p className="text-xs text-[var(--danger)]">{codeError}</p>}
      </div>

    </div>
  )
}
