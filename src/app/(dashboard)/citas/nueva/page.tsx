'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Search } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  doctorId: z.string().min(1, 'Doctor requerido'),
  dateTime: z.string().min(1, 'Fecha y hora requerida'),
  duration: z.number().int().min(15).max(120),
  reason: z.string().min(1, 'Motivo requerido'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Patient {
  id: string
  firstName: string
  lastName: string
  documentNumber: string
}

interface Doctor {
  id: string
  name: string
  speciality: string | null
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export default function NuevaCitaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatientId = searchParams.get('patientId')

  const [isLoading, setIsLoading] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)

  const debouncedSearch = useDebounce(patientSearch, 300)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration: 30,
    },
  })

  // Load doctors
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDoctors(data) })
      .catch(() => {})
  }, [])

  // Search patients
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setPatients([])
      return
    }
    fetch(`/api/pacientes?search=${encodeURIComponent(debouncedSearch)}&limit=10`)
      .then(r => r.json())
      .then(d => setPatients(d.patients || []))
      .catch(() => {})
  }, [debouncedSearch])

  // Preselect patient
  useEffect(() => {
    if (preselectedPatientId) {
      fetch(`/api/pacientes/${preselectedPatientId}`)
        .then(r => r.json())
        .then(p => {
          if (p.id) {
            setSelectedPatient(p)
            setValue('patientId', p.id)
          }
        })
        .catch(() => {})
    }
  }, [preselectedPatientId, setValue])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        toast({ variant: 'error', title: 'Error al crear la cita', description: err.error })
        return
      }

      toast({ variant: 'success', title: 'Cita agendada correctamente' })
      router.push('/citas')
      router.refresh()
    } catch {
      toast({ variant: 'error', title: 'Error inesperado', description: 'Por favor, intente nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/citas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nueva Cita</h2>
          <p className="text-sm text-slate-500">Programar una cita médica</p>
        </div>
      </div>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la Cita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patient Search */}
            <FormField label="Paciente" required error={errors.patientId?.message}>
              {selectedPatient ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                    <span className="ml-2 text-slate-500">{selectedPatient.documentNumber}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(null)
                      setValue('patientId', '')
                      setPatientSearch('')
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar paciente por nombre o documento..."
                    value={patientSearch}
                    onChange={e => {
                      setPatientSearch(e.target.value)
                      setShowPatientDropdown(true)
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="pl-10"
                  />
                  {showPatientDropdown && patients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-slate-200 bg-white shadow-md">
                      {patients.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 first:rounded-t-md last:rounded-b-md"
                          onClick={() => {
                            setSelectedPatient(p)
                            setValue('patientId', p.id)
                            setPatientSearch('')
                            setShowPatientDropdown(false)
                          }}
                        >
                          <span className="font-medium">{p.firstName} {p.lastName}</span>
                          <span className="ml-2 text-slate-400 text-xs">{p.documentNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </FormField>

            {/* Doctor */}
            <FormField label="Doctor" required error={errors.doctorId?.message}>
              {doctors.length > 0 ? (
                <Select onValueChange={v => setValue('doctorId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar doctor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}{d.speciality ? ` — ${d.speciality}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="ID del doctor"
                  {...register('doctorId')}
                />
              )}
            </FormField>

            {/* Date and Time */}
            <FormField label="Fecha y Hora" required error={errors.dateTime?.message}>
              <Input
                type="datetime-local"
                {...register('dateTime')}
              />
            </FormField>

            {/* Duration */}
            <FormField label="Duración" error={errors.duration?.message}>
              <Select
                defaultValue="30"
                onValueChange={v => setValue('duration', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1 hora 30 min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {/* Reason */}
            <FormField label="Motivo de Consulta" required error={errors.reason?.message}>
              <Input
                placeholder="Ej: Control de rutina, Consulta por dolor..."
                {...register('reason')}
              />
            </FormField>

            {/* Notes */}
            <FormField label="Notas adicionales">
              <Textarea
                placeholder="Instrucciones especiales, preparación..."
                rows={3}
                {...register('notes')}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href="/citas">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </span>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cita
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
