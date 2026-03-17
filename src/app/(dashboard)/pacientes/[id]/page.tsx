import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getPatientWithFullHistory, extractActiveDiagnoses, extractRecentMedications } from '@/lib/data/patients'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
  ArrowLeft,
  Heart,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  ShieldAlert,
  Pill,
  Pencil,
  Plus,
} from 'lucide-react'
import { PatientHeaderActions } from './PatientHeaderActions'
import { PatientBriefing } from './PatientBriefing'
import { AllergyManager } from './AllergyManager'
import { BackgroundManager } from './BackgroundManager'
import { DocumentManager } from './DocumentManager'
import { ConsultasTimeline } from './ConsultasTimeline'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">{label}</span>
      <span className="text-sm text-foreground">{value || <span className="text-foreground-subtle">—</span>}</span>
    </div>
  )
}

function VitalChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="inline-flex min-w-[96px] items-center gap-2 border border-border bg-surface px-2 py-1 text-[11px] font-medium text-foreground-muted">
      {icon}
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
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
  const activeTab = sp.tab ?? 'resumen'

  const [patient, session] = await Promise.all([
    getPatientWithFullHistory(id),
    auth(),
  ])

  if (!patient) notFound()

  const doctorId = session?.user?.id ?? ''
  const age = calculateAge(patient.birthDate)
  const uniqueAllergies = patient.allergies.filter(
    (allergy, index, list) => list.findIndex((item) => item.allergen === allergy.allergen) === index
  )
  const severeAllergies = uniqueAllergies.filter((allergy) => allergy.severity === 'SEVERE')
  const activeDiagnoses = extractActiveDiagnoses(patient.clinicalRecords)
  const recentMedications = extractRecentMedications(patient.clinicalRecords)
  const lastVitalSigns = patient.clinicalRecords.find((record) => record.vitalSigns)?.vitalSigns ?? null
  const nextAppointment = patient.appointments[0] ?? null
  const todayStr = new Date().toDateString()
  const todayPendingApt = patient.appointments.find(
    (appointment) =>
      new Date(appointment.dateTime).toDateString() === todayStr &&
      (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED')
  )
  const consultaHref = `/pacientes/${patient.id}/historia/nueva-consulta${todayPendingApt ? `?citaId=${todayPendingApt.id}` : ''}`
  const uniqueBackgrounds = patient.medicalBackgrounds.filter(
    (background, index, list) =>
      list.findIndex((item) => item.description === background.description && item.type === background.type) === index
  )
  const tabsIdBase = `patient-tabs-${patient.id}`

  return (
    <div className="space-y-4">
      <section className="overflow-hidden border border-border bg-surface">
        <div className="border-b border-border bg-surface-alt px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
              <Link href="/pacientes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span>Paciente</span>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-muted sm:text-sm">
                <span>{documentTypeLabel(patient.documentType)}: {patient.documentNumber}</span>
                <span className="text-border" aria-hidden>•</span>
                <span>{age} años</span>
                <span className="text-border" aria-hidden>•</span>
                <span>{genderLabel(patient.gender)}</span>
                {patient.bloodType && (
                  <>
                    <span className="text-border" aria-hidden>•</span>
                    <span>{bloodTypeLabel(patient.bloodType)}</span>
                  </>
                )}
                {nextAppointment && (
                  <>
                    <span className="text-border" aria-hidden>•</span>
                    <span>Próxima cita: {formatDateTime(nextAppointment.dateTime)}</span>
                  </>
                )}
                {severeAllergies.length > 0 && (
                  <>
                    <span className="text-border" aria-hidden>•</span>
                    <span className="font-medium text-danger">{severeAllergies.length} alerta(s) crítica(s)</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[220px]">
              <PatientHeaderActions
                patientId={patient.id}
                patientName={`${patient.firstName} ${patient.lastName}`}
                consultaHref={consultaHref}
                doctorId={doctorId}
              />
            </div>
          </div>
        </div>
      </section>

      {severeAllergies.length > 0 && (
        <section className="border border-danger/20 bg-danger/5 px-4 py-3 sm:px-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-danger">Alergias severas registradas</p>
              <p className="mt-1 text-sm text-danger">
                {severeAllergies.map((allergy) => allergy.allergen).join(', ')}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="space-y-6">
        <Tabs defaultValue={activeTab}>
            <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border border-border bg-surface p-0">
              <TabsTrigger
                value="resumen"
                id={`${tabsIdBase}-trigger-resumen`}
                aria-controls={`${tabsIdBase}-content-resumen`}
                className="min-w-fit rounded-none border-r border-border px-4 py-2.5"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger
                value="consultas"
                id={`${tabsIdBase}-trigger-consultas`}
                aria-controls={`${tabsIdBase}-content-consultas`}
                className="min-w-fit rounded-none border-r border-border px-4 py-2.5"
              >
                Consultas ({patient.clinicalRecords.length})
              </TabsTrigger>
              <TabsTrigger
                value="antecedentes"
                id={`${tabsIdBase}-trigger-antecedentes`}
                aria-controls={`${tabsIdBase}-content-antecedentes`}
                className="min-w-fit rounded-none border-r border-border px-4 py-2.5"
              >
                Antecedentes ({uniqueBackgrounds.length})
              </TabsTrigger>
              <TabsTrigger
                value="documentos"
                id={`${tabsIdBase}-trigger-documentos`}
                aria-controls={`${tabsIdBase}-content-documentos`}
                className="ml-auto min-w-fit rounded-none border-l border-border px-4 py-2.5"
              >
                Documentos ({patient.documents.length})
              </TabsTrigger>
              <TabsTrigger
                value="perfil"
                id={`${tabsIdBase}-trigger-perfil`}
                aria-controls={`${tabsIdBase}-content-perfil`}
                className="min-w-fit rounded-none px-4 py-2.5"
              >
                Perfil
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="resumen"
              id={`${tabsIdBase}-content-resumen`}
              aria-labelledby={`${tabsIdBase}-trigger-resumen`}
              className="mt-4 space-y-6"
            >
              <section className="overflow-hidden border border-border bg-surface">
                <div className="border-b border-border bg-surface-alt px-3 py-2.5">
                  <h2 className="text-[13px] font-semibold text-foreground">Estado clínico actual</h2>
                </div>
                <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="border-b border-border lg:border-b-0 lg:border-r">
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-subtle">Diagnósticos activos</p>
                    </div>
                    <div className="px-3 py-3">
                      {activeDiagnoses.length > 0 ? (
                        <div className="space-y-2">
                          {activeDiagnoses.slice(0, 4).map((diagnosis) => (
                            <div key={diagnosis.id} className="border-l-2 border-primary pl-2.5">
                              <p className="text-[13px] font-medium text-foreground">{diagnosis.description}</p>
                              <p className="text-[11px] text-foreground-muted">{diagnosis.code} · {diagnosis.status}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-foreground-muted">Sin diagnósticos activos.</p>
                      )}
                    </div>

                    <div className="border-y border-border px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-subtle">Medicación reciente</p>
                    </div>
                    <div className="px-3 py-3">
                      {recentMedications.length > 0 ? (
                        <div className="space-y-2">
                          {recentMedications.slice(0, 4).map((medication) => (
                            <div key={medication.id} className="border-l-2 border-border-interactive pl-2.5">
                              <p className="text-[13px] font-medium text-foreground">{medication.medication}</p>
                              <p className="text-[11px] text-foreground-muted">{medication.dosage} · {medication.frequency}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-foreground-muted">Sin medicación registrada.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-subtle">Últimos signos vitales</p>
                    </div>
                    <div className="px-3 py-3">
                      {lastVitalSigns ? (
                        <div className="flex flex-wrap gap-2">
                          {lastVitalSigns.bloodPressureSys && lastVitalSigns.bloodPressureDia && (
                            <VitalChip icon={<Heart className="h-3.5 w-3.5 text-foreground-subtle" />} label="PA" value={`${lastVitalSigns.bloodPressureSys}/${lastVitalSigns.bloodPressureDia}`} />
                          )}
                          {lastVitalSigns.heartRate && (
                            <VitalChip icon={<Activity className="h-3.5 w-3.5 text-foreground-subtle" />} label="FC" value={lastVitalSigns.heartRate} />
                          )}
                          {lastVitalSigns.temperature && (
                            <VitalChip icon={<Thermometer className="h-3.5 w-3.5 text-foreground-subtle" />} label="Temp" value={`${lastVitalSigns.temperature}°C`} />
                          )}
                          {lastVitalSigns.oxygenSat && (
                            <VitalChip icon={<Wind className="h-3.5 w-3.5 text-foreground-subtle" />} label="SpO2" value={`${lastVitalSigns.oxygenSat}%`} />
                          )}
                          {lastVitalSigns.glucoseLevel && (
                            <VitalChip icon={<Droplets className="h-3.5 w-3.5 text-foreground-subtle" />} label="Glucosa" value={lastVitalSigns.glucoseLevel} />
                          )}
                          {lastVitalSigns.weight && (
                            <VitalChip icon={<Pill className="h-3.5 w-3.5 text-foreground-subtle" />} label="Peso" value={`${lastVitalSigns.weight} kg`} />
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-foreground-muted">Aún no hay signos vitales registrados.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <details className="overflow-hidden border border-border bg-surface">
                <summary className="cursor-pointer list-none border-b border-border bg-surface-alt px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Resumen asistido</p>
                      <p className="mt-0.5 text-[11px] text-foreground-muted">
                        Sintesis del historial y pendientes del paciente.
                      </p>
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
                      Ver
                    </span>
                  </div>
                </summary>
                <PatientBriefing
                  patientId={patient.id}
                  hasConsultations={patient.clinicalRecords.length > 0}
                />
              </details>
            </TabsContent>

            <TabsContent
              value="consultas"
              id={`${tabsIdBase}-content-consultas`}
              aria-labelledby={`${tabsIdBase}-trigger-consultas`}
              className="mt-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground-muted">{patient.clinicalRecords.length} consulta(s) registradas</p>
                <Button size="sm" asChild>
                  <Link href={consultaHref}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Nueva Consulta
                  </Link>
                </Button>
              </div>
              <ConsultasTimeline
                patientId={patient.id}
                records={patient.clinicalRecords.map((record) => ({
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
                  prescriptions: record.prescriptions.map((prescription) => ({
                    id: prescription.id,
                    notes: prescription.notes,
                    createdAt: prescription.createdAt.toISOString(),
                    doctor: prescription.doctor,
                    items: prescription.items.map((item) => ({
                      id: item.id,
                      medication: item.medication,
                      dosage: item.dosage,
                      frequency: item.frequency,
                      duration: item.duration,
                      quantity: item.quantity,
                      instructions: item.instructions,
                    })),
                  })),
                }))}
              />
            </TabsContent>

            <TabsContent
              value="antecedentes"
              id={`${tabsIdBase}-content-antecedentes`}
              aria-labelledby={`${tabsIdBase}-trigger-antecedentes`}
              className="mt-4"
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section className="overflow-hidden border border-border bg-surface">
                  <div className="border-b border-border bg-surface-alt px-3 py-2.5">
                    <h2 className="text-[13px] font-semibold text-foreground">Antecedentes médicos</h2>
                  </div>
                  <div className="px-3 py-4">
                    <BackgroundManager
                      patientId={patient.id}
                      backgrounds={uniqueBackgrounds.map((background) => ({
                        id: background.id,
                        type: background.type,
                        description: background.description,
                        date: background.date ? background.date.toISOString() : null,
                        notes: background.notes,
                      }))}
                    />
                  </div>
                </section>

                <section className="overflow-hidden border border-border bg-surface">
                  <div className="border-b border-border bg-surface-alt px-3 py-2.5">
                    <h2 className="text-[13px] font-semibold text-foreground">Alergias</h2>
                  </div>
                  <div className="px-3 py-4">
                    <AllergyManager
                      patientId={patient.id}
                      allergies={patient.allergies.map((allergy) => ({
                        id: allergy.id,
                        allergen: allergy.allergen,
                        reaction: allergy.reaction,
                        severity: allergy.severity,
                        notes: allergy.notes,
                      }))}
                    />
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent
              value="documentos"
              id={`${tabsIdBase}-content-documentos`}
              aria-labelledby={`${tabsIdBase}-trigger-documentos`}
              className="mt-4"
            >
              <section className="overflow-hidden border border-border bg-surface">
                <div className="border-b border-border bg-surface-alt px-3 py-2.5">
                  <h2 className="text-[13px] font-semibold text-foreground">Documentos clínicos</h2>
                </div>
                <div className="px-3 py-4">
                  <DocumentManager
                    patientId={patient.id}
                    documents={patient.documents.map((document) => ({
                      id: document.id,
                      name: document.name,
                      description: document.description,
                      fileUrl: document.fileUrl,
                      fileSize: document.fileSize,
                      mimeType: document.mimeType,
                      createdAt: document.createdAt.toISOString(),
                      uploadedBy: document.uploadedBy,
                    }))}
                  />
                </div>
              </section>
            </TabsContent>

            <TabsContent
              value="perfil"
              id={`${tabsIdBase}-content-perfil`}
              aria-labelledby={`${tabsIdBase}-trigger-perfil`}
              className="mt-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground-muted">Información registrada del paciente</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/pacientes/${patient.id}/editar`}>
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Editar perfil
                  </Link>
                </Button>
              </div>

              <section className="overflow-hidden border border-border bg-surface">
                <div className="border-b border-border bg-surface-alt px-3 py-2.5">
                  <h2 className="text-[13px] font-semibold text-foreground">Identidad</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 px-3 py-4 sm:grid-cols-3">
                  <InfoRow label="Nombre Completo" value={`${patient.firstName} ${patient.lastName}`} />
                  <InfoRow label="Fecha de Nacimiento" value={`${formatDate(patient.birthDate)} (${age} años)`} />
                  <InfoRow label="Género" value={genderLabel(patient.gender)} />
                  <InfoRow label="Estado Civil" value={patient.maritalStatus ? maritalStatusLabel(patient.maritalStatus) : null} />
                  <InfoRow label="Grupo Sanguíneo" value={patient.bloodType ? bloodTypeLabel(patient.bloodType) : null} />
                  <InfoRow label="Ocupación" value={patient.occupation} />
                  <InfoRow label="N° Seguro" value={patient.insuranceNumber} />
                </div>
              </section>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
