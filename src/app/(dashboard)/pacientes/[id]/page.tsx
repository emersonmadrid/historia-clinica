import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPatientWithFullHistory, extractActiveDiagnoses, extractRecentMedications } from '@/lib/data/patients'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  calculateAge,
  formatDate,
  formatDateTime,
  bloodTypeLabel,
  genderLabel,
  maritalStatusLabel,
  documentTypeLabel,
} from '@/lib/utils'
import {
  Plus,
  Calendar,
  ClipboardList,
  Phone,
  User,
  AlertTriangle,
  FileText,
  Pencil,
  Download,
  Pill,
  ArrowLeft,
  ShieldAlert,
  MoreHorizontal,
} from 'lucide-react'
import { DeletePatientButton } from './DeletePatientButton'
import { PatientBriefing } from './PatientBriefing'
import { AllergyManager } from './AllergyManager'
import { BackgroundManager } from './BackgroundManager'
import { DocumentManager } from './DocumentManager'
import { ConsultasTimeline } from './ConsultasTimeline'
import { QuickAddAllergyButton } from './QuickAddAllergyButton'


function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-900">{value || <span className="text-slate-300">—</span>}</span>
    </div>
  )
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: 'Programada', className: 'bg-blue-100 text-blue-700' },
    CONFIRMED: { label: 'Confirmada', className: 'bg-green-100 text-green-700' },
    COMPLETED: { label: 'Completada', className: 'bg-slate-100 text-slate-700' },
    CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
    NO_SHOW: { label: 'No asistió', className: 'bg-orange-100 text-orange-700' },
  }
  const s = map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>
}

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const activeTab = sp.tab ?? 'consultas'

  const patient = await getPatientWithFullHistory(id)
  if (!patient) notFound()

  const age = calculateAge(patient.birthDate)
  // Deduplicate allergies by allergen name (defensive against duplicate DB entries)
  const uniqueAllergies = patient.allergies.filter(
    (a, i, arr) => arr.findIndex(x => x.allergen === a.allergen) === i
  )
  const severeAllergies = uniqueAllergies.filter(a => a.severity === 'SEVERE')
  const nextAppointment = patient.appointments[0] ?? null
  const activeDiagnoses = extractActiveDiagnoses(patient.clinicalRecords)
  const recentMedications = extractRecentMedications(patient.clinicalRecords)
  const lastVitalSigns = patient.clinicalRecords.find(r => r.vitalSigns)?.vitalSigns ?? null
  // Deduplicate medical backgrounds by description (same DB duplication issue as allergies)
  const uniqueBackgrounds = patient.medicalBackgrounds.filter(
    (b, i, arr) => arr.findIndex(x => x.description === b.description && x.type === b.type) === i
  )

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Patient Header ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-400" />
        <div className="p-4 sm:p-6">

          {/* Mobile top bar: back + actions */}
          <div className="flex items-center justify-between mb-4 sm:hidden">
            <Button variant="ghost" size="icon" asChild className="-ml-1.5">
              <Link href="/pacientes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button size="sm" asChild>
                <Link href={`/pacientes/${patient.id}/historia/nueva-consulta`}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Consulta
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/citas/nueva?patientId=${patient.id}`} className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Nueva Cita
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/pacientes/${patient.id}/editar`} className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      Editar datos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`/api/pacientes/${patient.id}/pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Exportar PDF
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/pacientes/${patient.id}?tab=archivos`} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Archivos
                      {patient.documents.length > 0 && (
                        <span className="ml-auto rounded-full bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 font-medium">
                          {patient.documents.length}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <DeletePatientButton
                      patientId={patient.id}
                      patientName={`${patient.firstName} ${patient.lastName}`}
                      menuItem
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Avatar + info + desktop actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 sm:items-start sm:gap-4 min-w-0">
              {/* Back button — desktop only */}
              <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0 hidden sm:flex">
                <Link href="/pacientes">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              {/* Avatar */}
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 text-base sm:text-xl font-bold">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>

              {/* Name + meta */}
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {patient.firstName} {patient.lastName}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-slate-500">
                  <span>{documentTypeLabel(patient.documentType)}: {patient.documentNumber}</span>
                  <span className="text-slate-300" aria-hidden>•</span>
                  <span>{age} años</span>
                  <span className="text-slate-300" aria-hidden>•</span>
                  <span>{genderLabel(patient.gender)}</span>
                  {patient.bloodType && (
                    <>
                      <span className="text-slate-300" aria-hidden>•</span>
                      <span className="font-medium text-slate-700">{bloodTypeLabel(patient.bloodType)}</span>
                    </>
                  )}
                </div>
                {nextAppointment && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-700">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Próxima: <span className="font-semibold">{formatDateTime(nextAppointment.dateTime)}</span></span>
                  </p>
                )}
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/pacientes/${patient.id}/editar`} className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      Editar datos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`/api/pacientes/${patient.id}/pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Exportar PDF
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/pacientes/${patient.id}?tab=archivos`} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Archivos
                      {patient.documents.length > 0 && (
                        <span className="ml-auto rounded-full bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 font-medium">
                          {patient.documents.length}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <DeletePatientButton
                      patientId={patient.id}
                      patientName={`${patient.firstName} ${patient.lastName}`}
                      menuItem
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        </div>
      </div>

      {/* ── Ficha Clínica Activa (always visible) ── */}
      {(activeDiagnoses.length > 0 || recentMedications.length > 0 || uniqueAllergies.length > 0) && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-100 px-4 py-2.5 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Ficha Clínica Activa</h3>
            </div>
            {severeAllergies.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-red-100 border border-red-200 px-2.5 py-1">
                <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span className="text-xs font-bold text-red-700">{severeAllergies.length} alergia(s) SEVERA(s)</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
            {/* Alergias */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Alergias Conocidas</p>
                <QuickAddAllergyButton patientId={patient.id} />
              </div>
              {uniqueAllergies.length === 0 ? (
                <p className="text-xs text-slate-300 italic">Sin alergias registradas</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {uniqueAllergies.map(a => (
                    <span
                      key={a.id}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
                        a.severity === 'SEVERE'
                          ? 'bg-red-100 border-red-200 text-red-700'
                          : a.severity === 'MODERATE'
                          ? 'bg-orange-100 border-orange-200 text-orange-700'
                          : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                      }`}
                    >
                      {a.severity === 'SEVERE' && <ShieldAlert className="h-3 w-3" />}
                      {a.allergen}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Diagnósticos activos */}
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Diagnósticos Activos</p>
              {activeDiagnoses.length === 0 ? (
                <p className="text-xs text-slate-300 italic">Sin diagnósticos activos</p>
              ) : (
                <div className="space-y-1.5">
                  {activeDiagnoses.slice(0, 4).map(d => (
                    <div key={d.id} className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${d.status === 'CHRONIC' ? 'bg-orange-400' : 'bg-blue-500'}`} />
                      <span className="text-xs text-slate-700 leading-snug">{d.description}</span>
                      {d.status === 'CHRONIC' && <span className="text-xs text-orange-500 font-medium">Crónico</span>}
                    </div>
                  ))}
                  {activeDiagnoses.length > 4 && (
                    <p className="text-xs text-slate-400">+{activeDiagnoses.length - 4} más</p>
                  )}
                </div>
              )}
            </div>
            {/* Medicación reciente */}
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Medicación Reciente</p>
              {recentMedications.length === 0 ? (
                <p className="text-xs text-slate-300 italic">Sin recetas registradas</p>
              ) : (
                <div className="space-y-1.5">
                  {recentMedications.slice(0, 4).map(m => (
                    <div key={m.id} className="flex items-start gap-1.5">
                      <Pill className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-700">{m.medication}</span>
                        <span className="text-xs text-slate-400"> — {m.dosage} {m.frequency}</span>
                      </div>
                    </div>
                  ))}
                  {recentMedications.length > 4 && (
                    <p className="text-xs text-slate-400">+{recentMedications.length - 4} más</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Last vital signs strip */}
          {lastVitalSigns && (
            <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/60 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">Últimos signos vitales:</span>
              {lastVitalSigns.bloodPressureSys && lastVitalSigns.bloodPressureDia && (
                <span className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">PA:</span> {lastVitalSigns.bloodPressureSys}/{lastVitalSigns.bloodPressureDia} mmHg
                </span>
              )}
              {lastVitalSigns.heartRate && (
                <span className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">FC:</span> {lastVitalSigns.heartRate} lpm
                </span>
              )}
              {lastVitalSigns.temperature && (
                <span className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">Temp:</span> {lastVitalSigns.temperature}°C
                </span>
              )}
              {lastVitalSigns.oxygenSat && (
                <span className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">SpO2:</span> {lastVitalSigns.oxygenSat}%
                </span>
              )}
              {lastVitalSigns.weight && (
                <span className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">Peso:</span> {lastVitalSigns.weight} kg
                </span>
              )}
              {lastVitalSigns.bmi && (
                <span className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">IMC:</span> {lastVitalSigns.bmi.toFixed(1)}
                </span>
              )}
              {lastVitalSigns.glucoseLevel && (
                <span className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">Glucosa:</span> {lastVitalSigns.glucoseLevel} mg/dL
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Briefing IA ── */}
      <PatientBriefing
        patientId={patient.id}
        hasConsultations={patient.clinicalRecords.length > 0}
      />

      {/* ── Tabs ── */}
      <Tabs key={activeTab} defaultValue={activeTab}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="consultas" className="flex-1 gap-1.5">
            Consultas
            {patient.clinicalRecords.length > 0 && (
              <span className="rounded-full bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 font-semibold leading-none">
                {patient.clinicalRecords.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="antecedentes" className="flex-1 gap-1.5">
            Antecedentes
            {uniqueBackgrounds.length > 0 && (
              <span className="rounded-full bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 font-semibold leading-none">
                {uniqueBackgrounds.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="perfil" className="flex-1">Perfil</TabsTrigger>
        </TabsList>

        {/* ── CONSULTAS ── */}
        <TabsContent value="consultas" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{patient.clinicalRecords.length} consulta(s) registradas</p>
              <Button size="sm" asChild>
                <Link href={`/pacientes/${patient.id}/historia/nueva-consulta`}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nueva Consulta
                </Link>
              </Button>
            </div>
            <ConsultasTimeline
              patientId={patient.id}
              records={patient.clinicalRecords.map(record => ({
                id: record.id,
                date: record.date.toISOString(),
                reason: record.reason,
                subjective: record.subjective,
                objective: record.objective,
                assessment: record.assessment,
                plan: record.plan,
                notes: record.notes,
                doctor: record.doctor,
                vitalSigns: record.vitalSigns ? {
                  bloodPressureSys: record.vitalSigns.bloodPressureSys,
                  bloodPressureDia: record.vitalSigns.bloodPressureDia,
                  heartRate: record.vitalSigns.heartRate,
                  temperature: record.vitalSigns.temperature,
                  oxygenSat: record.vitalSigns.oxygenSat,
                  weight: record.vitalSigns.weight,
                  height: record.vitalSigns.height,
                  bmi: record.vitalSigns.bmi,
                  glucoseLevel: record.vitalSigns.glucoseLevel,
                  respiratoryRate: record.vitalSigns.respiratoryRate,
                } : null,
                diagnoses: record.diagnoses,
                prescriptions: record.prescriptions.map(rx => ({
                  id: rx.id,
                  notes: rx.notes,
                  createdAt: rx.createdAt.toISOString(),
                  doctor: rx.doctor,
                  items: rx.items.map(it => ({
                    id: it.id,
                    medication: it.medication,
                    dosage: it.dosage,
                    frequency: it.frequency,
                    duration: it.duration,
                    quantity: it.quantity,
                    instructions: it.instructions,
                  })),
                })),
              }))}
            />
          </div>
        </TabsContent>

        {/* ── ANTECEDENTES ── */}
        <TabsContent value="antecedentes" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <BackgroundManager
                  patientId={patient.id}
                  backgrounds={uniqueBackgrounds.map(bg => ({
                    id: bg.id,
                    type: bg.type,
                    description: bg.description,
                    date: bg.date ? bg.date.toISOString() : null,
                    notes: bg.notes,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <AllergyManager
                  patientId={patient.id}
                  allergies={patient.allergies.map(a => ({
                    id: a.id,
                    allergen: a.allergen,
                    reaction: a.reaction,
                    severity: a.severity,
                    notes: a.notes,
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ARCHIVOS ── */}
        <TabsContent value="archivos" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <DocumentManager
                patientId={patient.id}
                documents={patient.documents.map(d => ({
                  id: d.id,
                  name: d.name,
                  description: d.description,
                  fileUrl: d.fileUrl,
                  fileSize: d.fileSize,
                  mimeType: d.mimeType,
                  createdAt: d.createdAt.toISOString(),
                  uploadedBy: d.uploadedBy,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PERFIL ── */}
        <TabsContent value="perfil" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Información registrada del paciente</p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/pacientes/${patient.id}/editar`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Editar perfil
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" /> Información Personal
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
                <Phone className="h-4 w-4 text-slate-500" /> Contacto
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
                  <AlertTriangle className="h-4 w-4 text-slate-500" /> Contacto de Emergencia
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
      </Tabs>
    </div>
  )
}
