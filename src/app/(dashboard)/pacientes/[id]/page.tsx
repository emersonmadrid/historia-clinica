import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  calculateAge,
  formatDate,
  formatDateTime,
  bloodTypeLabel,
  genderLabel,
  maritalStatusLabel,
  documentTypeLabel,
  backgroundTypeLabel,
  severityLabel,
  diagnosisStatusLabel,
} from '@/lib/utils'
import {
  ArrowLeft,
  Plus,
  Calendar,
  ClipboardList,
  Phone,
  Mail,
  MapPin,
  User,
  AlertTriangle,
  FileText,
  Pencil,
} from 'lucide-react'
import { DeletePatientButton } from './DeletePatientButton'

async function getPatient(id: string) {
  const patient = await prisma.patient.findUnique({
    where: { id, active: true },
    include: {
      allergies: { orderBy: { createdAt: 'desc' } },
      medicalBackgrounds: { orderBy: { createdAt: 'desc' } },
      clinicalRecords: {
        orderBy: { date: 'desc' },
        include: {
          doctor: { select: { id: true, name: true, speciality: true } },
          diagnoses: true,
          vitalSigns: true,
        },
      },
      appointments: {
        orderBy: { dateTime: 'desc' },
        take: 5,
        include: { doctor: { select: { id: true, name: true } } },
      },
    },
  })
  return patient
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-900">{value || <span className="text-slate-300">—</span>}</span>
    </div>
  )
}

function severityVariant(severity: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (severity === 'SEVERE') return 'destructive'
  if (severity === 'MODERATE') return 'secondary'
  return 'outline'
}

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patient = await getPatient(id)

  if (!patient) notFound()

  const age = calculateAge(patient.birthDate)

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumb items={[
        { label: 'Pacientes', href: '/pacientes' },
        { label: `${patient.firstName} ${patient.lastName}` },
      ]} />

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pacientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-lg font-bold">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-sm text-slate-500">
                  {documentTypeLabel(patient.documentType)}: {patient.documentNumber} &bull; {age} años &bull; {genderLabel(patient.gender)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <DeletePatientButton patientId={patient.id} patientName={`${patient.firstName} ${patient.lastName}`} />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/pacientes/${patient.id}/editar`}>
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/citas/nueva?patientId=${patient.id}`}>
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Nueva Cita
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/pacientes/${patient.id}/historia/nueva-consulta`}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nueva Consulta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="datos">
        <TabsList className="w-full max-w-lg">
          <TabsTrigger value="datos" className="flex-1">Datos Personales</TabsTrigger>
          <TabsTrigger value="antecedentes" className="flex-1">Antecedentes</TabsTrigger>
          <TabsTrigger value="alergias" className="flex-1">Alergias</TabsTrigger>
          <TabsTrigger value="consultas" className="flex-1">Consultas</TabsTrigger>
        </TabsList>

        {/* Datos Personales */}
        <TabsContent value="datos" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoRow label="Nombre Completo" value={`${patient.firstName} ${patient.lastName}`} />
              <InfoRow label="Fecha de Nacimiento" value={`${formatDate(patient.birthDate)} (${age} años)`} />
              <InfoRow label="Género" value={genderLabel(patient.gender)} />
              <InfoRow label="Estado Civil" value={patient.maritalStatus ? maritalStatusLabel(patient.maritalStatus) : null} />
              <InfoRow label="Grupo Sanguíneo" value={patient.bloodType ? bloodTypeLabel(patient.bloodType) : null} />
              <InfoRow label="Ocupación" value={patient.occupation} />
              <InfoRow label="N° Seguro" value={patient.insuranceNumber} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4" /> Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoRow label="Teléfono" value={patient.phone} />
              <InfoRow label="Correo" value={patient.email} />
              <InfoRow label="Dirección" value={patient.address} />
              <InfoRow label="Ciudad" value={patient.city} />
            </CardContent>
          </Card>

          {(patient.emergencyContactName || patient.emergencyContactPhone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Contacto de Emergencia
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoRow label="Nombre" value={patient.emergencyContactName} />
                <InfoRow label="Teléfono" value={patient.emergencyContactPhone} />
                <InfoRow label="Parentesco" value={patient.emergencyContactRel} />
              </CardContent>
            </Card>
          )}

          {patient.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{patient.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Antecedentes */}
        <TabsContent value="antecedentes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Antecedentes Médicos</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medicalBackgrounds.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No hay antecedentes registrados</p>
              ) : (
                <div className="space-y-6">
                  {(['PERSONAL', 'FAMILY', 'SURGICAL', 'PHARMACOLOGICAL', 'OBSTETRIC'] as const).map((type) => {
                    const items = patient.medicalBackgrounds.filter((b) => b.type === type)
                    if (items.length === 0) return null
                    return (
                      <div key={type}>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">
                          {backgroundTypeLabel(type)}
                        </h4>
                        <div className="space-y-2">
                          {items.map((bg) => (
                            <div key={bg.id} className="rounded-lg border border-slate-100 p-3 bg-slate-50">
                              <p className="text-sm text-slate-900">{bg.description}</p>
                              {bg.date && (
                                <p className="text-xs text-slate-500 mt-1">{formatDate(bg.date)}</p>
                              )}
                              {bg.notes && (
                                <p className="text-xs text-slate-500 mt-1 italic">{bg.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alergias */}
        <TabsContent value="alergias" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alergias Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.allergies.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No hay alergias registradas</p>
              ) : (
                <div className="space-y-3">
                  {patient.allergies.map((allergy) => (
                    <div key={allergy.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 text-sm">{allergy.allergen}</span>
                          <Badge variant={severityVariant(allergy.severity)}>
                            {severityLabel(allergy.severity)}
                          </Badge>
                        </div>
                        {allergy.reaction && (
                          <p className="text-sm text-slate-600">Reacción: {allergy.reaction}</p>
                        )}
                        {allergy.notes && (
                          <p className="text-xs text-slate-500 mt-1">{allergy.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consultas */}
        <TabsContent value="consultas" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Historia Clínica</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/pacientes/${patient.id}/historia`}>
                    <FileText className="mr-1.5 h-4 w-4" />
                    Ver Timeline
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/pacientes/${patient.id}/historia/nueva-consulta`}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Nueva Consulta
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {patient.clinicalRecords.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No hay consultas registradas</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {patient.clinicalRecords.map((record) => (
                    <div key={record.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <ClipboardList className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{record.reason}</p>
                        <p className="text-xs text-slate-500">
                          Dr. {record.doctor.name}
                          {record.doctor.speciality && ` — ${record.doctor.speciality}`}
                        </p>
                        {record.diagnoses.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Dx: {record.diagnoses.map(d => d.description).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-slate-600">{formatDate(record.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
