'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Users, Calendar, LayoutDashboard, Plus,
  ArrowRight, Loader2, ClipboardList, Settings, BarChart2,
} from 'lucide-react'

const QUICK_ACTIONS = [
  { label: 'Nuevo Paciente', href: '/pacientes/nuevo', icon: Plus, group: 'Acciones', sub: 'Registrar un paciente nuevo' },
  { label: 'Nueva Cita', href: '/citas/nueva', icon: Plus, group: 'Acciones', sub: 'Agendar una cita' },
  { label: 'Nueva Consulta', href: '/pacientes', icon: ClipboardList, group: 'Acciones', sub: 'Selecciona un paciente' },
]

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'Navegación', sub: 'Resumen general' },
  { label: 'Pacientes', href: '/pacientes', icon: Users, group: 'Navegación', sub: 'Lista de pacientes' },
  { label: 'Citas', href: '/citas', icon: Calendar, group: 'Navegación', sub: 'Agenda y calendario' },
  { label: 'Reportes', href: '/reportes', icon: BarChart2, group: 'Navegación', sub: 'Estadísticas' },
  { label: 'Configuración', href: '/configuracion', icon: Settings, group: 'Navegación', sub: 'Ajustes del sistema' },
]

interface Patient {
  id: string
  firstName: string
  lastName: string
  documentNumber: string
}

type CommandItem = {
  label: string
  href: string
  icon: React.ElementType
  group: string
  sub?: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Focus on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setPatients([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search patients
  useEffect(() => {
    if (query.length < 2) { setPatients([]); return }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pacientes?search=${encodeURIComponent(query)}&limit=5`)
        const data = await res.json()
        setPatients(data.patients || [])
      } catch {
        setPatients([])
      } finally {
        setLoading(false)
      }
    }, 220)
    return () => clearTimeout(timer)
  }, [query])

  const baseItems: CommandItem[] = query.length < 2
    ? [...QUICK_ACTIONS, ...NAV_ITEMS]
    : QUICK_ACTIONS

  const patientItems: CommandItem[] = patients.map(p => ({
    label: `${p.firstName} ${p.lastName}`,
    href: `/pacientes/${p.id}`,
    icon: Users,
    group: 'Pacientes',
    sub: p.documentNumber,
  }))

  const allItems: CommandItem[] = [...baseItems, ...patientItems]

  const navigate = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && allItems[selectedIndex]) navigate(allItems[selectedIndex].href)
  }

  if (!open) return null

  // Group items for rendering
  const groups = Array.from(new Set(allItems.map(i => i.group)))
  let runningIndex = 0

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          {loading
            ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#0EA5E9]" />
            : <Search className="h-4 w-4 shrink-0text-slate-400" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
            placeholder="Buscar paciente, acción o página..."
            className="flex-1 bg-transparent py-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <kbd className="hidden shrink-0 items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline-flex">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto p-2">
          {query.length >= 2 && !loading && patientItems.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">Sin resultados para &ldquo;{query}&rdquo;</p>
          )}

          {groups.map(group => {
            const groupItems = allItems.filter(i => i.group === group)
            const startIdx = runningIndex
            runningIndex += groupItems.length

            return (
              <div key={group} className="mb-1">
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {group}
                </p>
                {groupItems.map((item, i) => {
                  const idx = startIdx + i
                  const Icon = item.icon
                  const isActive = idx === selectedIndex
                  return (
                    <button
                      key={`${item.href}-${item.label}-${i}`}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                        isActive ? 'bg-sky-50' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                        isActive ? 'bg-[#0EA5E9]' : 'bg-slate-100'
                      }`}>
                        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-[#0EA5E9]' : 'text-slate-700'}`}>
                          {item.label}
                        </p>
                        {item.sub && (
                          <p className="text-xs text-slate-400 truncate">{item.sub}</p>
                        )}
                      </div>
                      <ArrowRight className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? 'text-[#0EA5E9]' : 'text-slate-200'}`} />
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50 px-4 py-2">
          {[['↑↓', 'navegar'], ['↵', 'abrir'], ['ESC', 'cerrar']].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px]">{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
