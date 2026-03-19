'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, Stethoscope, MessageCircle, ChevronDown, CheckCircle2, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import type { Prisma } from '@prisma/client'

type Appointment = Prisma.AppointmentGetPayload<{
  include: {
    patient: { select: { id: true; firstName: true; lastName: true; phone: true } }
    doctor: { select: { id: true; name: true; speciality: true } }
  }
}>

export default function CitasPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [postCompleteTarget, setPostCompleteTarget] = useState<Appointment | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [arrivedMap, setArrivedMap] = useState<Record<string, true>>({})
  const queryClient = useQueryClient()

  const monthKey = format(currentMonth, 'yyyy-MM')

  const { data: allAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ['citas', monthKey],
    queryFn: async () => {
      const res = await fetch(`/api/citas?month=${monthKey}`)
      if (!res.ok) throw new Error('Error al cargar citas')
      const data = await res.json()
      // seed arrivedMap from fetched data
      const map: Record<string, true> = {}
      data.forEach((a: Appointment & { arrivedAt?: string | null }) => {
        if (a.arrivedAt) map[a.id] = true
      })
      setArrivedMap(map)
      return data
    },
  })

  const dayAppointments = useMemo(
    () => allAppointments.filter(a => isSameDay(new Date(a.dateTime), selectedDate)),
    [allAppointments, selectedDate]
  )

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      setLoadingId(id)
      const res = await fetch(`/api/citas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: (_, vars) => {
      const labels: Record<string, string> = {
        CONFIRMED: 'Cita confirmada',
        CANCELLED: 'Cita cancelada',
        COMPLETED: 'Cita completada',
        NO_SHOW: 'Marcado como no asistió',
      }
      toast({ variant: 'success', title: labels[vars.status] ?? 'Estado actualizado' })
      if (vars.status === 'COMPLETED') {
        const apt = allAppointments.find(a => a.id === vars.id) ?? null
        if (apt) setPostCompleteTarget(apt)
      }
      queryClient.invalidateQueries({ queryKey: ['citas'] })
    },
    onError: () => toast({ variant: 'error', title: 'Error al actualizar la cita' }),
    onSettled: () => setLoadingId(null),
  })

  const handleArrive = async (id: string) => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/citas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'arrive' }),
      })
      if (res.ok) {
        setArrivedMap(prev => ({ ...prev, [id]: true }))
        toast({ variant: 'success', title: 'Paciente registrado en sala' })
      }
    } finally {
      setLoadingId(null)
    }
  }

  const appointmentsByDay = useMemo(
    () => allAppointments.reduce<Record<string, number>>((acc, apt) => {
      const day = format(new Date(apt.dateTime), 'yyyy-MM-dd')
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {}),
    [allAppointments]
  )

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const paddingDays = Array.from({ length: startOfMonth(currentMonth).getDay() }, (_, i) => i)

  const pendingCount = dayAppointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length

  return (
    <>
    {/* Post-complete dialog */}
    <Dialog open={!!postCompleteTarget} onOpenChange={(open) => { if (!open) setPostCompleteTarget(null) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cita completada</DialogTitle>
          <DialogDescription>
            {postCompleteTarget && (
              <>¿Desea registrar la consulta de <strong>{postCompleteTarget.patient.firstName} {postCompleteTarget.patient.lastName}</strong> ahora?</>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPostCompleteTarget(null)}>Después</Button>
          <Button asChild onClick={() => setPostCompleteTarget(null)}>
            <Link href={`/pacientes/${postCompleteTarget?.patient.id}/historia/nueva-consulta?citaId=${postCompleteTarget?.id}`}>
              <Stethoscope className="mr-1.5 h-4 w-4" />
              Registrar Consulta
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Cancel dialog */}
    <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar esta cita?</DialogTitle>
          <DialogDescription>
            {cancelTarget && (
              <>
                Cita de <strong>{cancelTarget.patient.firstName} {cancelTarget.patient.lastName}</strong> el{' '}
                <strong>{format(new Date(cancelTarget.dateTime), "d 'de' MMMM 'a las' HH:mm", { locale: es })}</strong>.
                Esta acción notificará al paciente por correo.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCancelTarget(null)}>Mantener cita</Button>
          <Button
            variant="destructive"
            disabled={loadingId === cancelTarget?.id}
            onClick={() => {
              if (cancelTarget) {
                updateStatus.mutate({ id: cancelTarget.id, status: 'CANCELLED' })
                setCancelTarget(null)
              }
            }}
          >
            Sí, cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Citas</h1>
        <Button asChild>
          <Link href="/citas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* ── Calendar ── */}
        <div className="lg:col-span-2">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-alt px-4 py-3">
              <span className="text-sm font-semibold capitalize text-foreground">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()) }}>
                  Hoy
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-foreground-muted py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map(i => <div key={`pad-${i}`} />)}
                {daysInMonth.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const count = appointmentsByDay[dayKey] || 0
                  const isSelected = isSameDay(day, selectedDate)
                  const _isToday = isToday(day)
                  return (
                    <button
                      key={dayKey}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'relative flex min-h-[52px] flex-col items-center justify-center border border-transparent p-1.5 text-sm transition-colors rounded-[var(--radius)]',
                        isSelected ? 'bg-primary text-white' :
                        _isToday ? 'bg-primary/8 text-primary font-semibold' :
                        'hover:bg-surface-alt text-foreground',
                        count > 0 && !isSelected ? 'font-medium' : ''
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      {count > 0 && (
                        <span className={cn('mt-0.5 h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-primary')} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Day panel ── */}
        <div className="panel overflow-hidden">
          <div className="border-b border-border bg-surface-alt px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {isToday(selectedDate) ? 'Hoy' : format(selectedDate, "d 'de' MMMM", { locale: es })}
            </p>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {dayAppointments.length === 0
                ? 'Sin citas'
                : `${dayAppointments.length} citas · ${pendingCount} pendientes`}
            </p>
          </div>

          {dayAppointments.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Calendar className="mx-auto h-8 w-8 text-border mb-2" />
              <p className="text-sm text-foreground-muted">Sin citas este día</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href={`/citas/nueva?date=${format(selectedDate, 'yyyy-MM-dd')}`}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Agregar
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {dayAppointments.map(apt => {
                const arrived = arrivedMap[apt.id]
                const isDone = apt.status === 'COMPLETED'
                const isCancelled = apt.status === 'CANCELLED' || apt.status === 'NO_SHOW'
                const isPending = apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'

                return (
                  <div
                    key={apt.id}
                    className={cn(
                      'px-4 py-3 transition-colors',
                      isDone || isCancelled ? 'opacity-50' : ''
                    )}
                  >
                    {/* Time + name */}
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-foreground-muted shrink-0">
                        {format(new Date(apt.dateTime), 'HH:mm')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/pacientes/${apt.patient.id}`}
                          className="text-sm font-semibold text-foreground hover:text-primary truncate block"
                        >
                          {apt.patient.firstName} {apt.patient.lastName}
                        </Link>
                        {apt.reason && (
                          <p className="text-xs text-foreground-muted truncate">{apt.reason}</p>
                        )}
                        {arrived && !isDone && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-success">
                            <UserCheck className="h-3 w-3" /> En sala
                          </span>
                        )}
                        {isDone && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground-muted">
                            <CheckCircle2 className="h-3 w-3 text-success" /> Atendida
                          </span>
                        )}
                        {apt.status === 'NO_SHOW' && (
                          <span className="mt-1 inline-flex text-xs font-medium text-foreground-muted">No asistió</span>
                        )}
                      </div>
                    </div>

                    {/* Actions — only for pending */}
                    {isPending && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <Button size="sm" asChild className="h-7 gap-1 px-2.5 text-xs">
                          <Link href={`/pacientes/${apt.patient.id}/historia/nueva-consulta?citaId=${apt.id}`}>
                            <Stethoscope className="h-3 w-3" />
                            Atender
                          </Link>
                        </Button>

                        {!arrived && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2.5 text-xs"
                            disabled={loadingId === apt.id}
                            onClick={() => handleArrive(apt.id)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Llegó
                          </Button>
                        )}

                        {apt.patient.phone && (
                          <a
                            href={`https://wa.me/${apt.patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${apt.patient.firstName}, le recordamos su cita médica el ${format(new Date(apt.dateTime), "d 'de' MMMM 'a las' HH:mm", { locale: es })}. Por favor confirme su asistencia.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Recordatorio por WhatsApp"
                            className="inline-flex h-7 w-7 items-center justify-center border border-border bg-white text-success hover:bg-success/5 transition-colors rounded-[var(--radius-xs)]"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loadingId === apt.id}
                              className="h-7 gap-1 px-2.5 text-xs ml-auto"
                            >
                              Estado <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {apt.status === 'SCHEDULED' && (
                              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: apt.id, status: 'CONFIRMED' })}>
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {apt.status === 'CONFIRMED' && (
                              <>
                                <DropdownMenuItem onClick={() => updateStatus.mutate({ id: apt.id, status: 'COMPLETED' })}>
                                  Completar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus.mutate({ id: apt.id, status: 'NO_SHOW' })}>
                                  No asistió
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => setCancelTarget(apt)}>
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
    </>
  )
}
