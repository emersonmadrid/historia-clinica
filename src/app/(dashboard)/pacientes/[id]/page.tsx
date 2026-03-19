import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getActorContext } from '@/lib/authz'
import { getPatientWithFullHistory, extractActiveDiagnoses, extractRecentMedications } from '@/lib/data/patients'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  calculateAge, calculateDaysSince, formatDateTime, formatDate,
  bloodTypeLabel, genderLabel, maritalStatusLabel, documentTypeLabel,
} from '@/lib/utils'
import {
  ArrowLeft, Heart, Activity, Thermometer, Wind, Droplets,
  ShieldAlert, Stethoscope, Calendar, Clock, AlertTriangle,
  TrendingUp, FileText, Pill,
} from 'lucide-react'
import { PatientHeaderActions } from './PatientHeaderActions'
import { PatientBriefing } from './PatientBriefing'
import { AllergyManager } from './AllergyManager'
import { BackgroundManager } from './BackgroundManager'
import { DocumentManager } from './DocumentManager'
import { ConsultasTimeline } from './ConsultasTimeline'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { ClinicalCalculatorsButton } from '@/components/shared/ClinicalCalculatorsButton'
import { getVitalStatus, getCriticalVitals } from '@/lib/vitalSignsThresholds'
import { calculatePatientRisk } from '@/lib/patientRisk'
import type { VitalStatus } from '@/lib/vitalSignsThresholds'

// ── Helpers ───────────────────────────────────────────────────────────────────

function VitalCard({ icon, label, value, unit = '', status = 'normal' }: {
  icon: React.ReactNode; label: string; value: number | string
  unit?: string; status?: VitalStatus
}) {
  const border = status === 'critical' ? 'border-[var(--danger)]/30 bg-[var(--danger)]/5'
    : status === 'warning' ? 'border-[var(--warning)]/30 bg-[var(--warning)]/5'
    : 'border-[var(--border)] bg-[var(--surface-alt)]'
  const valueColor = status === 'critical' ? 'text-[var(--danger)]'
    : status === 'warning' ? 'text-[var(--warning)]'
    : 'text-[var(--foreground)]'
  return (
    <div className={`rounded-lg border p-3 ${border}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--foreground-subtle)]">{label}</span>
        <span className="text-[var(--foreground-subtle)]">{icon}</span>
      </div>
      <p className={`font-mono text-lg font-semibold tabular-nums leading-none ${valueColor}`}>
        {value}<span className="text-xs font-normal ml-0.5">{unit}</span>
      </p>
      {status !== 'normal' && (
        <p className={`mt-1 text-[10px] font-medium ${status === 'critical' ? 'text-[var(--danger)]' : 'text-[var(--warning)]'}`}>
          {status === 'critical' ? '⚠ Crítico' : '⚠ Atención'}
        </p>
      )}
    </div>
  )
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden ${className}`}>
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-alt)] px-4 py-2.5">
        <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-xs text-[var(--foreground-subtle)] shrink-0">{label}</span>
      <span className="text-xs text-right font-medium text-[var(--foreground)]">
        {value || <span className="font-normal text-[var(--foreground-subtle)]">—</span>}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const session = await auth()
  const actor = await getActorContext(session)
  const patient = await getPatientWithFullHistory(id, actor.organizationId)

  if (!patient) notFound()

  const age = calculateAge(patient.birthDate)
  const now = new Date()

  const uniqueAllergies = patient.allergies.filter(
    (a, idx, list) => list.findIndex(x => x.allergen === a.allergen) === idx
  )
  const severeAllergies = uniqueAllergies.filter(a => a.severity === 'SEVERE')
  const activeDiagnoses = extractActiveDiagnoses(patient.clinicalRecords)
  const recentMedications = extractRecentMedications(patient.clinicalRecords)
  const lastPrescriptionDate = patient.clinicalRecords
    .flatMap(r => r.prescriptions)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt ?? null
  const lastVitalRecord = patient.clinicalRecords.find(r => r.vitalSigns) ?? null
  const lastVitalSigns = lastVitalRecord?.vitalSigns ?? null
  const lastVitalDate = lastVitalRecord?.date ?? null

  const todayStr = new Date().toDateString()
  const todayPendingApt = patient.appointments.find(
    a => new Date(a.dateTime).toDateString() === todayStr && (a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
  )
  const consultaHref = `/pacientes/${patient.id}/historia/nueva-consulta${todayPendingApt ? `?citaId=${todayPendingApt.id}` : ''}`
  const nextAppointment = patient.appointments[0] ?? null

  const chronicDiagnosesCount = activeDiagnoses.filter(d => d.status === 'CHRONIC').length
  const daysSinceLastVisit = patient.clinicalRecords.length > 0
    ? calculateDaysSince(patient.clinicalRecords[0].date, now)
    : null
  const followUpOverdueDays = chronicDiagnosesCount >= 3 ? 60 : chronicDiagnosesCount >= 1 ? 90 : 180
  const isFollowUpOverdue = daysSinceLastVisit !== null && daysSinceLastVisit > followUpOverdueDays

  const risk = calculatePatientRisk({
    age, activeDiagnosesCount: activeDiagnoses.length, chronicDiagnosesCount,
    severeAllergiesCount: severeAllergies.length,
    lastVitalSigns: lastVitalSigns ? {
      bloodPressureSys: lastVitalSigns.bloodPressureSys, bloodPressureDia: lastVitalSigns.bloodPressureDia,
      heartRate: lastVitalSigns.heartRate, temperature: lastVitalSigns.temperature,
      oxygenSat: lastVitalSigns.oxygenSat, glucoseLevel: lastVitalSigns.glucoseLevel,
    } : null,
    daysSinceLastVisit,
  })

  const criticalVitals = lastVitalSigns ? getCriticalVitals({
    bloodPressureSys: lastVitalSigns.bloodPressureSys, bloodPressureDia: lastVitalSigns.bloodPressureDia,
    heartRate: lastVitalSigns.heartRate, temperature: lastVitalSigns.temperature,
    oxygenSat: lastVitalSigns.oxygenSat, glucoseLevel: lastVitalSigns.glucoseLevel,
  }) : []

  const uniqueBackgrounds = patient.medicalBackgrounds.filter(
    (b, idx, list) => list.findIndex(x => x.description === b.description && x.type === b.type) === idx
  )

  return (
    <div className="space-y-4">

      {/* ── Identidad del paciente ─────────────────────────────────────────── */}
      <div className="panel overflow-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-2.5">
          <Button variant="ghost" size="icon" asChild className="h-7 w-7">
            <Link href="/pacientes"><ArrowLeft className="h-3.5 w-3.5" /></Link>
          </Button>
          <span className="text-xs text-[var(--foreground-subtle)]">Pacientes /</span>
          <span className="text-xs font-medium text-[var(--foreground)]">{patient.firstName} {patient.lastName}</span>
        </div>

        {/* Datos del paciente + acciones */}
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                {patient.firstName} {patient.lastName}
              </h1>
              <RiskBadge level={risk.level} reasons={risk.reasons} />
            </div>

            {/* Píldoras de información clave */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-alt)] border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground-muted)]">
                {age} años · {genderLabel(patient.gender)}
              </span>
              {patient.bloodType && (
                <span className="inline-flex items-center rounded-md bg-[var(--primary-subtle)] border border-[var(--primary)]/20 px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
                  {bloodTypeLabel(patient.bloodType)}
                </span>
              )}
              {severeAllergies.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--danger)]/8 border border-[var(--danger)]/20 px-2.5 py-1 text-xs font-semibold text-[var(--danger)]">
                  <ShieldAlert className="h-3 w-3" />
                  Alergia: {severeAllergies.map(a => a.allergen).join(', ')}
                </span>
              )}
              {daysSinceLastVisit !== null && (
                <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs ${
                  isFollowUpOverdue
                    ? 'bg-[var(--warning)]/8 border-[var(--warning)]/20 font-medium text-[var(--warning)]'
                    : 'bg-[var(--surface-alt)] border-[var(--border)] text-[var(--foreground-subtle)]'
                }`}>
                  <Clock className="mr-1 h-3 w-3" />
                  {daysSinceLastVisit === 0 ? 'Consulta hoy' : `Última visita hace ${daysSinceLastVisit}d`}
                </span>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild size="sm">
              <Link href={consultaHref}>
                <Stethoscope className="mr-1.5 h-4 w-4" />
                Atender
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/citas/nueva?patientId=${patient.id}`}>
                <Calendar className="mr-1.5 h-4 w-4" />
                Agendar
              </Link>
            </Button>
            <PatientHeaderActions
              patientId={patient.id}
              patientName={`${patient.firstName} ${patient.lastName}`}
            />
          </div>
        </div>

        {/* Alertas críticas — dentro del header, solo si hay algo */}
        {criticalVitals.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--danger)]/20 bg-[var(--danger)]/5 px-5 py-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--danger)]" />
              <span className="text-xs font-semibold text-[var(--danger)]">Signos fuera de rango:</span>
            </div>
            {criticalVitals.map(v => (
              <span key={v.key} className={`text-xs font-medium ${v.status === 'critical' ? 'text-[var(--danger)]' : 'text-[var(--warning)]'}`}>
                {v.label} {v.value}{v.unit}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Navegación principal: tabs a pantalla completa ────────────────── */}
      <div className="panel overflow-hidden">
        <Tabs defaultValue={activeTab}>

          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="historia">
              Historia
              {patient.clinicalRecords.length > 0 && (
                <span className="ml-1.5 text-[11px] opacity-60">({patient.clinicalRecords.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="antecedentes">Antecedentes</TabsTrigger>
            <TabsTrigger value="documentos">
              Documentos
              {patient.documents.length > 0 && (
                <span className="ml-1.5 text-[11px] opacity-60">({patient.documents.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
          </TabsList>

          {/* ── RESUMEN ─────────────────────────────────────────────────────── */}
          <TabsContent value="resumen" className="p-5">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">

              {/* Resumen IA — ocupa todo el ancho en mobile, 2 cols en xl */}
              <div className="lg:col-span-2 xl:col-span-2">
                <PatientBriefing patientId={patient.id} hasConsultations={patient.clinicalRecords.length > 0} />
              </div>

              {/* Signos vitales */}
              {lastVitalSigns ? (
                <Card
                  title={`Signos vitales · ${lastVitalDate ? formatDate(lastVitalDate) : ''}`}
                  className="lg:col-span-2 xl:col-span-1"
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                    {lastVitalSigns.bloodPressureSys && lastVitalSigns.bloodPressureDia && (
                      <VitalCard icon={<Heart className="h-3.5 w-3.5" />} label="Presión art."
                        value={`${lastVitalSigns.bloodPressureSys}/${lastVitalSigns.bloodPressureDia}`} unit="mmHg"
                        status={getVitalStatus('bloodPressureSys', lastVitalSigns.bloodPressureSys)} />
                    )}
                    {lastVitalSigns.heartRate && (
                      <VitalCard icon={<Activity className="h-3.5 w-3.5" />} label="Frec. cardíaca"
                        value={lastVitalSigns.heartRate} unit="lpm"
                        status={getVitalStatus('heartRate', lastVitalSigns.heartRate)} />
                    )}
                    {lastVitalSigns.temperature && (
                      <VitalCard icon={<Thermometer className="h-3.5 w-3.5" />} label="Temperatura"
                        value={lastVitalSigns.temperature} unit="°C"
                        status={getVitalStatus('temperature', lastVitalSigns.temperature)} />
                    )}
                    {lastVitalSigns.oxygenSat && (
                      <VitalCard icon={<Wind className="h-3.5 w-3.5" />} label="SpO₂"
                        value={lastVitalSigns.oxygenSat} unit="%"
                        status={getVitalStatus('oxygenSat', lastVitalSigns.oxygenSat)} />
                    )}
                    {lastVitalSigns.glucoseLevel && (
                      <VitalCard icon={<Droplets className="h-3.5 w-3.5" />} label="Glucosa"
                        value={lastVitalSigns.glucoseLevel} unit="mg/dL"
                        status={getVitalStatus('glucoseLevel', lastVitalSigns.glucoseLevel)} />
                    )}
                    {lastVitalSigns.weight && (
                      <VitalCard icon={<TrendingUp className="h-3.5 w-3.5" />} label="Peso"
                        value={lastVitalSigns.weight} unit="kg" />
                    )}
                  </div>
                  <div className="mt-3">
                    <ClinicalCalculatorsButton
                      age={age} sex={patient.gender}
                      weightKg={lastVitalSigns?.weight} heightCm={lastVitalSigns?.height}
                      sbp={lastVitalSigns?.bloodPressureSys} dbp={lastVitalSigns?.bloodPressureDia}
                      rr={lastVitalSigns?.respiratoryRate}
                    />
                  </div>
                </Card>
              ) : (
                <Card title="Signos vitales">
                  <p className="text-sm text-[var(--foreground-subtle)]">Sin registros aún.</p>
                </Card>
              )}

              {/* Diagnósticos activos */}
              <Card title={`Diagnósticos activos · ${activeDiagnoses.length}`}>
                {activeDiagnoses.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-subtle)]">Sin diagnósticos activos.</p>
                ) : (
                  <div className="space-y-2">
                    {activeDiagnoses.slice(0, 5).map(dx => (
                      <div key={dx.id} className="flex items-start gap-2.5">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dx.status === 'CHRONIC' ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm leading-snug text-[var(--foreground)]">{dx.description}</p>
                            {dx.status === 'CHRONIC' && (
                              <span className="shrink-0 rounded bg-[var(--warning)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--warning)]">Crónico</span>
                            )}
                          </div>
                          {dx.code && <p className="text-[11px] text-[var(--foreground-subtle)]">{dx.code}</p>}
                        </div>
                      </div>
                    ))}
                    {activeDiagnoses.length > 5 && (
                      <p className="text-xs text-[var(--foreground-subtle)]">+{activeDiagnoses.length - 5} más</p>
                    )}
                  </div>
                )}
              </Card>

              {/* Medicación actual */}
              <Card title={`Medicación · ${recentMedications.length}${lastPrescriptionDate ? ` · ${formatDate(lastPrescriptionDate)}` : ''}`}>
                {recentMedications.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-subtle)]">Sin medicación registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {recentMedications.slice(0, 4).map(med => (
                      <div key={med.id} className="flex items-start gap-2">
                        <Pill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--foreground-subtle)]" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)]">{med.medication}</p>
                          <p className="text-xs text-[var(--foreground-subtle)]">{med.dosage} · {med.frequency}</p>
                        </div>
                      </div>
                    ))}
                    {recentMedications.length > 4 && (
                      <p className="text-xs text-[var(--foreground-subtle)]">+{recentMedications.length - 4} más</p>
                    )}
                  </div>
                )}
              </Card>

              {/* Próxima cita — al final, es info administrativa */}
              {nextAppointment && (
                <div className="lg:col-span-2 xl:col-span-3 flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-alt)] px-4 py-3">
                  <Calendar className="h-4 w-4 shrink-0 text-[var(--foreground-subtle)]" />
                  <span className="text-xs text-[var(--foreground-subtle)]">Próxima cita:</span>
                  <span className="text-xs font-medium text-[var(--foreground-muted)]">{formatDateTime(nextAppointment.dateTime)}</span>
                  {nextAppointment.reason && <span className="text-xs text-[var(--foreground-subtle)]">· {nextAppointment.reason}</span>}
                </div>
              )}

            </div>
          </TabsContent>

          {/* ── HISTORIA ────────────────────────────────────────────────────── */}
          <TabsContent value="historia" className="p-5">
            {patient.clinicalRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="h-10 w-10 text-[var(--border)]" />
                <p className="mt-3 text-sm font-medium text-[var(--foreground-muted)]">Sin historial clínico</p>
                <p className="mt-1 text-xs text-[var(--foreground-subtle)]">Esta es la primera consulta del paciente.</p>
                <Button size="sm" asChild className="mt-5 gap-1.5">
                  <Link href={consultaHref}><Stethoscope className="h-4 w-4" /> Iniciar primera consulta</Link>
                </Button>
              </div>
            ) : (
              <ConsultasTimeline
                patientId={patient.id}
                records={patient.clinicalRecords.map(record => ({
                  id: record.id, date: record.date.toISOString(), reason: record.reason,
                  subjective: record.subjective, objective: record.objective,
                  assessment: record.assessment, plan: record.plan, notes: record.notes,
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
                  noteTemplate: record.noteTemplate,
                  diagnoses: record.diagnoses,
                  prescriptions: record.prescriptions.map(rx => ({
                    id: rx.id, notes: rx.notes, createdAt: rx.createdAt.toISOString(), doctor: rx.doctor,
                    items: rx.items.map(item => ({
                      id: item.id, medication: item.medication, dosage: item.dosage,
                      frequency: item.frequency, duration: item.duration,
                      quantity: item.quantity, instructions: item.instructions,
                    })),
                  })),
                }))}
              />
            )}
          </TabsContent>

          {/* ── ANTECEDENTES ────────────────────────────────────────────────── */}
          <TabsContent value="antecedentes" className="p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card title="Antecedentes médicos">
                <BackgroundManager
                  patientId={patient.id}
                  backgrounds={uniqueBackgrounds.map(b => ({
                    id: b.id, type: b.type, description: b.description,
                    date: b.date ? b.date.toISOString() : null, notes: b.notes,
                  }))}
                />
              </Card>
              <Card title="Alergias">
                <AllergyManager
                  patientId={patient.id}
                  allergies={patient.allergies.map(a => ({
                    id: a.id, allergen: a.allergen, reaction: a.reaction, severity: a.severity, notes: a.notes,
                  }))}
                />
              </Card>
            </div>
          </TabsContent>

          {/* ── DOCUMENTOS ──────────────────────────────────────────────────── */}
          <TabsContent value="documentos" className="p-5">
            <Card title="Documentos clínicos">
              <DocumentManager
                patientId={patient.id}
                documents={patient.documents.map(doc => ({
                  id: doc.id, name: doc.name, description: doc.description,
                  fileUrl: doc.fileUrl, fileSize: doc.fileSize, mimeType: doc.mimeType,
                  createdAt: doc.createdAt.toISOString(), uploadedBy: doc.uploadedBy,
                }))}
              />
            </Card>
          </TabsContent>

          {/* ── PERFIL ──────────────────────────────────────────────────────── */}
          <TabsContent value="perfil" className="p-5">
            <div className="grid gap-4 lg:grid-cols-2">

              <Card title="Datos personales">
                <InfoRow label="Estado civil" value={patient.maritalStatus ? maritalStatusLabel(patient.maritalStatus) : null} />
                <InfoRow label="Ocupación" value={patient.occupation} />
                <InfoRow label="Documento" value={`${documentTypeLabel(patient.documentType)} ${patient.documentNumber}`} />
                <InfoRow label="N° seguro" value={patient.insuranceNumber} />
              </Card>

              <Card title="Contacto">
                <InfoRow label="Teléfono" value={patient.phone} />
                <InfoRow label="Email" value={patient.email} />
                <InfoRow label="Dirección" value={patient.address} />
                <InfoRow label="Ciudad" value={patient.city} />
              </Card>

              {(patient.emergencyContactName || patient.emergencyContactPhone) && (
                <Card title="Contacto de emergencia" className="lg:col-span-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8">
                    <InfoRow label="Nombre" value={patient.emergencyContactName} />
                    <InfoRow label="Teléfono" value={patient.emergencyContactPhone} />
                    <InfoRow label="Relación" value={patient.emergencyContactRel} />
                  </div>
                </Card>
              )}

              {patient.notes && (
                <Card title="Notas clínicas" className="lg:col-span-2">
                  <p className="text-sm text-[var(--foreground-muted)]">{patient.notes}</p>
                </Card>
              )}

            </div>
          </TabsContent>

        </Tabs>
      </div>

    </div>
  )
}
