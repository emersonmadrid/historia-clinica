'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle, Check, UserX, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { appointmentStatusLabel, cn } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import type { Prisma } from '@prisma/client'

type Appointment = Prisma.AppointmentGetPayload<{
  include: {
    patient: { select: { id: true; firstName: true; lastName: true; phone: true } }
    doctor: { select: { id: true; name: true; speciality: true } }
  }
}>

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'CONFIRMED') return 'default'
  if (status === 'CANCELLED') return 'destructive'
  return 'secondary'
}

export default function CitasPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [postCompleteTarget, setPostCompleteTarget] = useState<Appointment | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: allAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ['citas', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const res = await fetch(`/api/citas`)
      if (!res.ok) throw new Error('Error al cargar citas')
      return res.json()
    },
  })

  const { data: dayAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ['citas-day', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const params = new URLSearchParams({ date: format(selectedDate, 'yyyy-MM-dd') })
      const res = await fetch(`/api/citas?${params}`)
      if (!res.ok) throw new Error('Error al cargar citas')
      return res.json()
    },
  })

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
      // Al completar, preguntar si desea registrar la consulta
      if (vars.status === 'COMPLETED') {
        const apt = dayAppointments.find(a => a.id === vars.id) ?? allAppointments.find(a => a.id === vars.id) ?? null
        if (apt) setPostCompleteTarget(apt)
      }
      queryClient.invalidateQueries({ queryKey: ['citas'] })
      queryClient.invalidateQueries({ queryKey: ['citas-day'] })
    },
    onError: () => {
      toast({ variant: 'error', title: 'Error al actualizar la cita' })
    },
    onSettled: () => setLoadingId(null),
  })

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })
  const confirmedCount = dayAppointments.filter(a => a.status === 'CONFIRMED').length

  // Get appointments count per day for the calendar
  const appointmentsByDay = allAppointments.reduce<Record<string, number>>((acc, apt) => {
    const day = format(new Date(apt.dateTime), 'yyyy-MM-dd')
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  // Padding for calendar
  const firstDayOfWeek = startOfMonth(currentMonth).getDay()
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  return (
    <>
    {/* Post-complete: ¿Registrar consulta? */}
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

    {/* Cancel confirmation dialog */}
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
          <Button variant="outline" onClick={() => setCancelTarget(null)}>
            Mantener cita
          </Button>
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

    <div className="space-y-5">
      <section className="border border-border bg-surface px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">Agenda clínica</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground">Citas</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/pacientes">
                <Stethoscope className="mr-2 h-4 w-4" />
                Abrir pacientes
              </Link>
            </Button>
            <Button asChild>
              <Link href="/citas/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cita
              </Link>
            </Button>
          </div>
        </div>

      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden rounded-none">
            <CardHeader className="border-b border-border bg-surface-alt pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentMonth(new Date())
                      setSelectedDate(new Date())
                    }}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-foreground-muted py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Padding */}
                {paddingDays.map(i => (
                  <div key={`pad-${i}`} />
                ))}

                {/* Days */}
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
                        'relative flex flex-col items-center justify-center rounded-sm border border-transparent p-2 text-sm transition-colors min-h-[48px]',
                        isSelected
                          ? 'bg-primary text-white'
                          : _isToday
                          ? 'bg-primary-subtle text-primary font-semibold'
                          : 'hover:bg-border-subtle text-foreground',
                        count > 0 && !isSelected ? 'font-medium' : ''
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            'mt-0.5 h-1.5 w-1.5 rounded-full',
                            isSelected ? 'bg-white' : 'bg-primary'
                          )}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Appointments */}
        <div>
          <Card className="h-fit overflow-hidden rounded-none">
            <CardHeader className="border-b border-border bg-surface-alt pb-4">
              <CardTitle className="text-base">
                {isToday(selectedDate) ? 'Hoy' : format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardTitle>
              <p className="text-xs text-foreground-muted">
                {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                {dayAppointments.length > 0 && ` · ${confirmedCount} confirmada(s)`}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {dayAppointments.length === 0 ? (
                <div className="px-6 pb-6 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-border mb-2" />
                  <p className="text-sm text-foreground-subtle">Sin citas este día</p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href={`/citas/nueva?date=${format(selectedDate, 'yyyy-MM-dd')}`}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Agregar
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {dayAppointments.map(apt => (
                    <div key={apt.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center gap-1 shrink-0 border border-border bg-surface-alt px-2 py-1 text-xs font-medium text-foreground-muted">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(apt.dateTime), 'HH:mm')}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/pacientes/${apt.patient.id}`}
                              className="text-sm font-medium text-foreground hover:text-primary truncate block"
                            >
                              {apt.patient.firstName} {apt.patient.lastName}
                            </Link>
                            <p className="text-xs text-foreground-muted truncate">{apt.reason}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge variant={statusVariant(apt.status)}>
                          {appointmentStatusLabel(apt.status)}
                        </Badge>
                        {/* Iniciar Consulta — acceso directo para SCHEDULED y CONFIRMED */}
                        {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                          <Button size="sm" variant="default" className="h-7 px-2.5 text-xs" asChild>
                            <Link href={`/pacientes/${apt.patient.id}/historia/nueva-consulta?citaId=${apt.id}`}>
                              <Stethoscope className="mr-1 h-3 w-3" />
                              Consultar
                            </Link>
                          </Button>
                        )}
                        {apt.status === 'SCHEDULED' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs"
                              disabled={loadingId === apt.id}
                              onClick={() => updateStatus.mutate({ id: apt.id, status: 'CONFIRMED' })}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs"
                              disabled={loadingId === apt.id}
                              onClick={() => setCancelTarget(apt)}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Cancelar
                            </Button>
                          </>
                        )}
                        {apt.status === 'CONFIRMED' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs"
                              disabled={loadingId === apt.id}
                              onClick={() => updateStatus.mutate({ id: apt.id, status: 'COMPLETED' })}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Completar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs"
                              disabled={loadingId === apt.id}
                              onClick={() => updateStatus.mutate({ id: apt.id, status: 'NO_SHOW' })}
                            >
                              <UserX className="mr-1 h-3 w-3" />
                              No asistió
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
}
