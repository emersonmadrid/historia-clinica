import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  formatDate,
  formatDateTime,
  diagnosisStatusLabel,
} from '@/lib/utils'
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  Heart,
  Thermometer,
  Activity,
  Wind,
} from 'lucide-react'

async function getPatientHistory(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId, active: true },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!patient) return null

  const records = await prisma.clinicalRecord.findMany({
    where: { patientId },
    orderBy: { date: 'desc' },
    include: {
      doctor: { select: { id: true, name: true, speciality: true } },
      vitalSigns: true,
      diagnoses: true,
    },
  })

  return { patient, records }
}

function diagnosisStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'ACTIVE') return 'default'
  if (status === 'CHRONIC') return 'secondary'
  return 'outline'
}

export default async function HistoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getPatientHistory(id)

  if (!data) notFound()

  const { patient, records } = data

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb items={[
        { label: 'Pacientes', href: '/pacientes' },
        { label: `${patient.firstName} ${patient.lastName}`, href: `/pacientes/${patient.id}` },
        { label: 'Historia Clínica' },
      ]} />
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/pacientes/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Historia Clínica</h2>
            <p className="text-sm text-slate-500">
              {patient.firstName} {patient.lastName} &bull; {records.length} consulta(s)
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/pacientes/${id}/historia/nueva-consulta`}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Consulta
          </Link>
        </Button>
      </div>

      {/* Timeline */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-sm font-medium text-slate-900">Sin consultas registradas</h3>
            <p className="mt-1 text-sm text-slate-500">Registre la primera consulta de este paciente.</p>
            <Button asChild className="mt-4">
              <Link href={`/pacientes/${id}/historia/nueva-consulta`}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Consulta
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative space-y-6">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

          {records.map((record, index) => (
            <div key={record.id} className="relative pl-14">
              {/* Timeline dot */}
              <div className="absolute left-4 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
              </div>

              <Card className="shadow-sm">
                {/* Record Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{formatDateTime(record.date)}</p>
                      <CardTitle className="text-base">{record.reason}</CardTitle>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Dr. {record.doctor.name}
                        {record.doctor.speciality && ` — ${record.doctor.speciality}`}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Vital Signs */}
                  {record.vitalSigns && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Signos Vitales
                      </h4>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {record.vitalSigns.bloodPressureSys && record.vitalSigns.bloodPressureDia && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2">
                            <Heart className="h-4 w-4 text-red-500 shrink-0" />
                            <div>
                              <p className="text-xs text-slate-500">PA</p>
                              <p className="text-sm font-medium text-slate-900">
                                {record.vitalSigns.bloodPressureSys}/{record.vitalSigns.bloodPressureDia}
                              </p>
                            </div>
                          </div>
                        )}
                        {record.vitalSigns.heartRate && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-pink-50 px-3 py-2">
                            <Activity className="h-4 w-4 text-pink-500 shrink-0" />
                            <div>
                              <p className="text-xs text-slate-500">FC</p>
                              <p className="text-sm font-medium text-slate-900">{record.vitalSigns.heartRate} lpm</p>
                            </div>
                          </div>
                        )}
                        {record.vitalSigns.temperature && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2">
                            <Thermometer className="h-4 w-4 text-orange-500 shrink-0" />
                            <div>
                              <p className="text-xs text-slate-500">Temp</p>
                              <p className="text-sm font-medium text-slate-900">{record.vitalSigns.temperature}°C</p>
                            </div>
                          </div>
                        )}
                        {record.vitalSigns.oxygenSat && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2">
                            <Wind className="h-4 w-4 text-blue-500 shrink-0" />
                            <div>
                              <p className="text-xs text-slate-500">SpO2</p>
                              <p className="text-sm font-medium text-slate-900">{record.vitalSigns.oxygenSat}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {(record.vitalSigns.weight || record.vitalSigns.height) && (
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          {record.vitalSigns.weight && <span>Peso: {record.vitalSigns.weight} kg</span>}
                          {record.vitalSigns.height && <span>Talla: {record.vitalSigns.height} cm</span>}
                          {record.vitalSigns.bmi && <span>IMC: {record.vitalSigns.bmi.toFixed(1)}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SOAP */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {record.subjective && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <h4 className="text-xs font-semibold text-slate-700 mb-1">S — Subjetivo</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.subjective}</p>
                      </div>
                    )}
                    {record.objective && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <h4 className="text-xs font-semibold text-slate-700 mb-1">O — Objetivo</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.objective}</p>
                      </div>
                    )}
                    {record.assessment && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <h4 className="text-xs font-semibold text-slate-700 mb-1">A — Evaluación</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.assessment}</p>
                      </div>
                    )}
                    {record.plan && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <h4 className="text-xs font-semibold text-slate-700 mb-1">P — Plan</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.plan}</p>
                      </div>
                    )}
                  </div>

                  {/* Diagnoses */}
                  {record.diagnoses.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Diagnósticos
                      </h4>
                      <div className="space-y-1.5">
                        {record.diagnoses.map((dx) => (
                          <div key={dx.id} className="flex items-center gap-2">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                              {dx.code}
                            </span>
                            <span className="text-sm text-slate-700 flex-1">{dx.description}</span>
                            <Badge variant={diagnosisStatusVariant(dx.status)} className="text-xs">
                              {diagnosisStatusLabel(dx.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.notes && (
                    <div className="rounded-lg border border-slate-200 bg-yellow-50 p-3">
                      <h4 className="text-xs font-semibold text-slate-700 mb-1">Notas</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
