'use client'

import { useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Plus, ChevronLeft, ChevronRight, UserRound, ClipboardList,
  MoreHorizontal, Pencil, Calendar, ArrowUpDown, ArrowUp, ArrowDown,
  Phone, Clock, X, ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { calculateAge, formatDate, formatDateTime, documentTypeLabel, genderLabel } from '@/lib/utils'
import type { Prisma } from '@prisma/client'

type Patient = Prisma.PatientGetPayload<{
  include: {
    clinicalRecords: { select: { date: true } }
    appointments: { select: { dateTime: true; status: true } }
    allergies: { select: { id: true } }
    _count: { select: { clinicalRecords: true } }
  }
}>

function LastVisitDot({ date }: { date: Date | string | null | undefined }) {
  if (!date) return <span className="h-2 w-2 rounded-full bg-slate-200 inline-block" title="Sin visitas" />
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  if (days < 90) return <span className="h-2 w-2 rounded-full bg-green-400 inline-block" title="Visita reciente" />
  if (days < 365) return <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" title="Más de 3 meses" />
  return <span className="h-2 w-2 rounded-full bg-red-400 inline-block" title="Más de 1 año" />
}

interface PatientsResponse {
  patients: Patient[]
  total: number
  page: number
  limit: number
}

type SortBy = 'name' | 'age' | 'lastVisit' | 'createdAt'
type SortOrder = 'asc' | 'desc'

function SortButton({
  label,
  column,
  current,
  order,
  onClick,
}: {
  label: string
  column: SortBy
  current: SortBy
  order: SortOrder
  onClick: (col: SortBy) => void
}) {
  const active = current === column
  return (
    <button
      className="flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900 group"
      onClick={() => onClick(column)}
    >
      {label}
      {active ? (
        order === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5 text-[#0EA5E9]" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 text-[#0EA5E9]" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50" />
      )}
    </button>
  )
}

export default function PacientesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortBy>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const limit = 20

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, error } = useQuery<PatientsResponse>({
    queryKey: ['pacientes', debouncedSearch, page, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
      })
      const res = await fetch(`/api/pacientes?${params}`)
      if (!res.ok) throw new Error('Error al cargar pacientes')
      return res.json()
    },
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  function handleSort(col: SortBy) {
    if (col === sortBy) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortOrder('asc')
    }
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pacientes</h2>
          <p className="text-sm text-slate-500">
            {data ? `${data.total} pacientes registrados` : 'Cargando...'}
          </p>
        </div>
        <Button asChild>
          <Link href="/pacientes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, documento, teléfono..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className={`pl-10 ${search ? 'pr-10' : ''}`}
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setPage(1) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-slate-500">
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Cargando pacientes...
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error al cargar los pacientes. Por favor, recargue la página.
          </div>
        ) : data?.patients.length === 0 ? (
          <div className="p-12 text-center">
            <UserRound className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-sm font-medium text-slate-900">No se encontraron pacientes</h3>
            <p className="mt-1 text-sm text-slate-500">
              {search ? 'Intente con otros términos de búsqueda.' : 'Comience registrando un nuevo paciente.'}
            </p>
            {!search && (
              <Button asChild className="mt-4">
                <Link href="/pacientes/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Paciente
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* ── Mobile card list (< md) ── */}
            <div className="md:hidden divide-y divide-slate-100">
              {data?.patients.map((patient) => {
                const nextAppt = patient.appointments?.[0]
                return (
                  <Link
                    key={patient.id}
                    href={`/pacientes/${patient.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E0F2FE] text-[#0284C7] text-sm font-semibold">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-slate-900 truncate">
                          {patient.firstName} {patient.lastName}
                        </p>
                        {patient.allergies.length > 0 && (
                          <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {documentTypeLabel(patient.documentType)}: {patient.documentNumber}
                        {' · '}{calculateAge(patient.birthDate)} años
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <LastVisitDot date={patient.clinicalRecords[0]?.date} />
                        <span className="text-xs text-slate-500">
                          {patient.clinicalRecords[0]
                            ? formatDate(patient.clinicalRecords[0].date)
                            : 'Sin visitas'}
                          {patient._count.clinicalRecords > 0 && (
                            <span className="ml-1 text-slate-400">({patient._count.clinicalRecords})</span>
                          )}
                        </span>
                        {nextAppt && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
                            <Clock className="h-3 w-3" />
                            {formatDate(nextAppt.dateTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0" onClick={e => e.preventDefault()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/pacientes/${patient.id}`}>
                              <UserRound className="h-4 w-4" />
                              Ver perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/pacientes/${patient.id}/historia/nueva-consulta`}>
                              <ClipboardList className="h-4 w-4" />
                              Nueva consulta
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/citas/nueva?patientId=${patient.id}`}>
                              <Calendar className="h-4 w-4" />
                              Nueva cita
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/pacientes/${patient.id}/editar`}>
                              <Pencil className="h-4 w-4" />
                              Editar datos
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* ── Desktop table (≥ md) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
                    <th className="px-4 py-3 text-left">
                      <SortButton label="Paciente" column="name" current={sortBy} order={sortOrder} onClick={handleSort} />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Documento</th>
                    <th className="px-4 py-3 text-left">
                      <SortButton label="Edad" column="age" current={sortBy} order={sortOrder} onClick={handleSort} />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 hidden lg:table-cell">Teléfono</th>
                    <th className="px-4 py-3 text-left">
                      <SortButton label="Última Visita" column="lastVisit" current={sortBy} order={sortOrder} onClick={handleSort} />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Próxima Cita</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.patients.map((patient) => {
                    const nextAppt = patient.appointments?.[0]
                    return (
                      <tr
                        key={patient.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]') ||
                            (e.target as HTMLElement).closest('[role="menu"]') ||
                            (e.target as HTMLElement).closest('button') ||
                            (e.target as HTMLElement).closest('a')
                          ) return
                          router.push(`/pacientes/${patient.id}`)
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0F2FE] text-[#0284C7] text-xs font-semibold">
                              {patient.firstName[0]}{patient.lastName[0]}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-slate-900">{patient.firstName} {patient.lastName}</p>
                              {patient.allergies.length > 0 && (
                                <span title="Alergias severas registradas">
                                  <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <span className="text-xs text-slate-400">{documentTypeLabel(patient.documentType)}</span>
                          <br />{patient.documentNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{calculateAge(patient.birthDate)} años</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {patient.phone ? (
                            <a href={`tel:${patient.phone}`} className="flex items-center gap-1.5 text-[#0EA5E9] hover:underline" onClick={e => e.stopPropagation()}>
                              <Phone className="h-3.5 w-3.5 shrink-0" />{patient.phone}
                            </a>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex items-center gap-2">
                            <LastVisitDot date={patient.clinicalRecords[0]?.date} />
                            <span>
                              {patient.clinicalRecords[0] ? formatDate(patient.clinicalRecords[0].date) : <span className="text-slate-300">Sin visitas</span>}
                              {patient._count.clinicalRecords > 0 && <span className="ml-1.5 text-xs text-slate-400">({patient._count.clinicalRecords})</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {nextAppt ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                              <Clock className="h-3 w-3" />{formatDate(nextAppt.dateTime)}
                            </span>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-500 hover:text-green-700 hover:bg-green-50" asChild>
                              <Link href={`/citas/nueva?patientId=${patient.id}`} onClick={e => e.stopPropagation()}>
                                <Calendar className="h-3.5 w-3.5 mr-1" />Cita
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/pacientes/${patient.id}/editar`}>
                                    <Pencil className="h-4 w-4" />Editar datos
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 flex-wrap gap-2">
                <p className="text-sm text-slate-500">
                  {((page - 1) * limit) + 1}–{Math.min(page * limit, data?.total ?? 0)} de {data?.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-slate-700">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
