'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useSession } from 'next-auth/react'
import { useForm, useFieldArray, Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Save, Pill, ShieldAlert, Sparkles, Loader2,
  Calendar, MessageSquare, Stethoscope, Brain, FlaskConical, FileText,
  Clock, Activity, Heart, Thermometer, Wind, Droplets, Share2, ChevronDown,
} from 'lucide-react'
import { getSpecialtyConfig } from '@/lib/specialtyConfig'
import { CIE10Input } from './CIE10Input'
import { VoiceDictationButton } from '@/components/shared/VoiceDictationButton'
import { toast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const SPECIALTY_LABELS: Record<string, string> = {
  GENERAL_MEDICINE: 'Medicina General',
  PSYCHOLOGY: 'Psicología',
  PSYCHIATRY: 'Psiquiatría',
  NUTRITION: 'Nutrición',
  PHYSIOTHERAPY: 'Fisioterapia',
  OTHER: 'Otra especialidad',
}

// ── Schema ────────────────────────────────────────────────────────────────────

const diagnosisSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  type: z.enum(['PRIMARY', 'SECONDARY', 'COMPLICATION']),
  status: z.enum(['ACTIVE', 'RESOLVED', 'CHRONIC']),
  notes: z.string().optional(),
})

const prescriptionItemSchema = z.object({
  medication: z.string().min(1, 'Requerido'),
  dosage: z.string().min(1, 'Requerido'),
  frequency: z.string().min(1, 'Requerido'),
  duration: z.string().min(1, 'Requerido'),
  quantity: z.string().optional(),
  instructions: z.string().optional(),
})

const prescriptionSchema = z.object({
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema),
})

const schema = z.object({
  reason: z.string().min(1, 'Motivo de consulta requerido'),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  notes: z.string().optional(),
  noteTemplate: z.enum(['SOAP', 'PSYCHOLOGY', 'NUTRITION', 'PHYSIOTHERAPY']).optional(),
  bloodPressureSys: z.string().optional(),
  bloodPressureDia: z.string().optional(),
  heartRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  temperature: z.string().optional(),
  oxygenSat: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  glucoseLevel: z.string().optional(),
  diagnoses: z.array(diagnosisSchema).optional(),
  prescriptions: z.array(prescriptionSchema).optional(),
})

type FormData = z.infer<typeof schema>

type ConsultationPayload = {
  patientId: string
  reason: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  notes: string | null
  noteTemplate?: string
  vitalSigns?: {
    bloodPressureSys: number | null; bloodPressureDia: number | null
    heartRate: number | null; respiratoryRate: number | null
    temperature: number | null; oxygenSat: number | null
    weight: number | null; height: number | null; bmi: number | null
    glucoseLevel: number | null
  }
  diagnoses: NonNullable<FormData['diagnoses']>
  prescriptions: Array<{
    notes?: string
    items: Array<{ medication: string; dosage: string; frequency: string; duration: string; quantity?: string; instructions?: string }>
  }>
}

type PatientContext = {
  name: string
  age: number | null
  gender: string | null
  bloodType: string | null
  allergies: { allergen: string; severity: string; reaction: string | null }[]
  activeConditions: string[]
  currentMedications: { medication: string; dosage: string; frequency: string }[]
  lastVisit: { date: string; reason: string } | null
  totalConsultas: number
}

type VitalKey = 'bloodPressureSys' | 'bloodPressureDia' | 'heartRate' | 'temperature' | 'oxygenSat' | 'glucoseLevel' | 'respiratoryRate'
type VitalStatus = 'normal' | 'warning' | 'danger'

function getVitalStatus(key: VitalKey, value: string): VitalStatus | null {
  const n = parseFloat(value)
  if (!value || isNaN(n)) return null
  switch (key) {
    case 'bloodPressureSys': return n < 120 ? 'normal' : n < 140 ? 'warning' : 'danger'
    case 'bloodPressureDia': return n < 80 ? 'normal' : n < 90 ? 'warning' : 'danger'
    case 'heartRate': return n >= 60 && n <= 100 ? 'normal' : n >= 50 && n <= 120 ? 'warning' : 'danger'
    case 'temperature': return n >= 36.1 && n <= 37.2 ? 'normal' : n < 38.0 ? 'warning' : 'danger'
    case 'oxygenSat': return n >= 95 ? 'normal' : n >= 90 ? 'warning' : 'danger'
    case 'glucoseLevel': return n >= 70 && n <= 100 ? 'normal' : n <= 125 ? 'warning' : 'danger'
    case 'respiratoryRate': return n >= 12 && n <= 20 ? 'normal' : n >= 10 && n <= 24 ? 'warning' : 'danger'
    default: return null
  }
}

const VITAL_LABELS: Record<VitalKey, string> = {
  bloodPressureSys: '<120', bloodPressureDia: '<80', heartRate: '60–100',
  temperature: '36.1–37.2', oxygenSat: '≥95%', glucoseLevel: '70–100', respiratoryRate: '12–20',
}

function VitalBadge({ vitalKey, value }: { vitalKey: VitalKey; value: string }) {
  const status = getVitalStatus(vitalKey, value)
  if (!status) return <span className="text-xs text-foreground-subtle">{VITAL_LABELS[vitalKey]}</span>
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
      status === 'normal' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-danger'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === 'normal' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-danger'
      }`} />
      {status === 'normal' ? 'Normal' : status === 'warning' ? 'Alerta' : 'Crítico'}
    </span>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-surface-alt px-4 py-2.5">
      <h3 className="section-kicker">{title}</h3>
      {action}
    </div>
  )
}

function Field({ label, error, hint, children, action }: {
  label: string; error?: string; hint?: string
  children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        {action}
      </div>
      {children}
      {hint && <p className="text-xs text-foreground-subtle">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function PatientSidebar({ ctx, loading }: { ctx: PatientContext | null; loading: boolean }) {
  if (loading || !ctx) {
    return (
      <div className="space-y-3 p-4">
        {[80, 60, 100, 80, 60].map((w, i) => (
          <div key={i} className="h-3 animate-pulse bg-border-subtle" style={{ width: `${w}%` }} />
        ))}
      </div>
    )
  }

  const severeAllergies = ctx.allergies.filter(a => a.severity === 'SEVERE')
  const otherAllergies = ctx.allergies.filter(a => a.severity !== 'SEVERE')

  return (
    <div className="divide-y divide-border-subtle text-xs">
      {/* Identity */}
      <div className="px-4 py-3">
        <p className="font-bold text-sm text-foreground leading-tight">{ctx.name}</p>
        <p className="mt-0.5 text-foreground-muted">
          {ctx.age ? `${ctx.age} años` : ''}
          {ctx.gender ? ` · ${ctx.gender === 'FEMALE' ? 'F' : ctx.gender === 'MALE' ? 'M' : ctx.gender}` : ''}
          {ctx.bloodType ? ` · ${ctx.bloodType}` : ''}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-foreground-subtle">
          <FileText className="h-3 w-3 shrink-0" />
          {ctx.totalConsultas === 0 ? 'Primera consulta' : `${ctx.totalConsultas} consulta${ctx.totalConsultas !== 1 ? 's' : ''} previas`}
        </div>
        {ctx.lastVisit && (
          <div className="mt-1 flex items-center gap-1.5 text-foreground-subtle">
            <Clock className="h-3 w-3 shrink-0" />
            Última: {new Date(ctx.lastVisit.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Allergies */}
      {ctx.allergies.length > 0 && (
        <div className="px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Alergias</p>
          <div className="space-y-1">
            {severeAllergies.map((a, i) => (
              <div key={i} className="flex items-center gap-2 border border-danger/30 bg-danger/5 px-2 py-1">
                <ShieldAlert className="h-3 w-3 shrink-0 text-danger" />
                <span className="font-semibold text-danger">{a.allergen}</span>
                {a.reaction && <span className="truncate text-danger/70">({a.reaction})</span>}
              </div>
            ))}
            {otherAllergies.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 text-foreground-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                {a.allergen}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active conditions */}
      {ctx.activeConditions.length > 0 && (
        <div className="px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Diagnósticos activos</p>
          <div className="space-y-1">
            {ctx.activeConditions.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 text-foreground-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span className="leading-snug">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current medications */}
      {ctx.currentMedications.length > 0 && (
        <div className="px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Medicación actual</p>
          <div className="space-y-1">
            {ctx.currentMedications.slice(0, 4).map((m, i) => (
              <div key={i} className="text-foreground-muted">
                <span className="font-medium text-foreground">{m.medication}</span>
                {m.dosage && <span className="ml-1 text-xs">{m.dosage}</span>}
                {m.frequency && <span className="ml-1 text-xs text-foreground-subtle">· {m.frequency}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last visit reason */}
      {ctx.lastVisit && (
        <div className="px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">Última consulta</p>
          <p className="leading-snug text-foreground-muted">{ctx.lastVisit.reason}</p>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function NuevaConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const citaId = searchParams.get('citaId')
  const { data: session } = useSession()

  const specialtyConfig = getSpecialtyConfig(session?.user?.specialty)
  const noteTemplate = specialtyConfig.noteTemplate
  const soapLabels = {
    subjective: { label: specialtyConfig.sections.s.label, hint: specialtyConfig.sections.s.hint },
    objective:  { label: specialtyConfig.sections.o.label, hint: specialtyConfig.sections.o.hint },
    assessment: { label: specialtyConfig.sections.a.label, hint: specialtyConfig.sections.a.hint },
    plan:       { label: specialtyConfig.sections.p.label, hint: specialtyConfig.sections.p.hint },
  }
  const [sessionType, setSessionType] = useState('')

  // Referral state
  const [showReferral, setShowReferral] = useState(false)
  const [referralSpecialty, setReferralSpecialty] = useState('')
  const [referralUrgency, setReferralUrgency] = useState('ROUTINE')
  const [referralReason, setReferralReason] = useState('')
  const [referralDoctorId, setReferralDoctorId] = useState('')
  const [referralNotes, setReferralNotes] = useState('')
  const [orgDoctors, setOrgDoctors] = useState<{ id: string; name: string; speciality: string | null }[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [ctxLoading, setCtxLoading] = useState(true)
  const [patientCtx, setPatientCtx] = useState<PatientContext | null>(null)
  const [citaLinked, setCitaLinked] = useState(false)
  const [patientAllergies, setPatientAllergies] = useState<{ allergen: string; severity: string; reaction: string | null }[]>([])
  const [patientData, setPatientData] = useState<{ allergies: string[]; activeConditions: string[]; currentMedications: string[] }>({ allergies: [], activeConditions: [], currentMedications: [] })

  const [hasDraft, setHasDraft] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [lastDiagnoses, setLastDiagnoses] = useState<{ code: string; description: string; type: 'PRIMARY' | 'SECONDARY' | 'COMPLICATION'; status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC' }[]>([])
  const [lastRxItems, setLastRxItems] = useState<{ medication: string; dosage: string; frequency: string; duration: string; quantity?: string; instructions?: string }[]>([])

  const [guideLoading, setGuideLoading] = useState(false)
  const [guideGenerated, setGuideGenerated] = useState(false)
  const [guideCollapsed, setGuideCollapsed] = useState(false)
  const [clinicalGuide, setClinicalGuide] = useState<{ ask: string[]; examine: string[]; consider: string[]; workup: string[] } | null>(null)
  const guideDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [aiDiagnoses, setAiDiagnoses] = useState<{ code: string; description: string }[]>([])
  const aiDiagnosesLoading = false
  const [aiRxSuggestions, setAiRxSuggestions] = useState<{ medication: string; dosage: string; frequency: string; duration: string; instructions?: string }[]>([])
  const [aiRxLoading, setAiRxLoading] = useState(false)
  const [aiRxDismissed, setAiRxDismissed] = useState(false)

  // Load patient context
  useEffect(() => {
    fetch(`/api/pacientes/${patientId}`)
      .then(r => r.json())
      .then(d => {
        if (!d.firstName) return

        // Build sidebar context
        const age = d.birthDate
          ? Math.floor((Date.now() - new Date(d.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null

        const seen = new Set<string>()
        const uniqueAllergies = (d.allergies ?? []).filter((a: { allergen: string }) => {
          if (seen.has(a.allergen)) return false
          seen.add(a.allergen)
          return true
        })
        setPatientAllergies(uniqueAllergies)

        const activeConditions: string[] = (d.clinicalRecords ?? [])
          .flatMap((r: { diagnoses: { status: string; description: string }[] }) => r.diagnoses)
          .filter((dx: { status: string }) => dx.status === 'ACTIVE' || dx.status === 'CHRONIC')
          .reduce((acc: string[], dx: { description: string }) => {
            if (!acc.includes(dx.description)) acc.push(dx.description)
            return acc
          }, [])

        const lastRecord = (d.clinicalRecords ?? [])[0] ?? null
        if (lastRecord?.diagnoses?.length) {
          setLastDiagnoses(lastRecord.diagnoses.map((dx: { code: string; description: string; type: string; status: string }) => ({
            code: dx.code, description: dx.description,
            type: (dx.type as 'PRIMARY' | 'SECONDARY' | 'COMPLICATION') ?? 'PRIMARY',
            status: (dx.status as 'ACTIVE' | 'RESOLVED' | 'CHRONIC') ?? 'CHRONIC',
          })))
        }
        const lastPrescription = (d.clinicalRecords ?? [])
          .flatMap((r: { prescriptions: { createdAt: string; items: { medication: string; dosage: string; frequency: string }[] }[] }) => r.prescriptions)
          .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

        const currentMedications: { medication: string; dosage: string; frequency: string }[] = lastPrescription?.items ?? []
        if (lastPrescription?.items?.length) {
          setLastRxItems(lastPrescription.items.map((it: { medication: string; dosage: string; frequency: string; duration: string; quantity?: string; instructions?: string }) => ({
            medication: it.medication, dosage: it.dosage, frequency: it.frequency,
            duration: it.duration, quantity: it.quantity, instructions: it.instructions,
          })))
        }
        const allergiesStr = uniqueAllergies.map((a: { allergen: string }) => a.allergen)

        setPatientCtx({
          name: `${d.firstName} ${d.lastName}`,
          age,
          gender: d.gender,
          bloodType: d.bloodType,
          allergies: uniqueAllergies,
          activeConditions,
          currentMedications,
          lastVisit: lastRecord ? { date: lastRecord.date, reason: lastRecord.reason } : null,
          totalConsultas: (d.clinicalRecords ?? []).length,
        })
        setPatientData({ allergies: allergiesStr, activeConditions, currentMedications: currentMedications.map((m: { medication: string; dosage: string }) => `${m.medication} ${m.dosage}`) })
      })
      .catch(() => {})
      .finally(() => setCtxLoading(false))
  }, [patientId])

  const {
    register, handleSubmit, control, watch, setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { diagnoses: [], prescriptions: [] },
  })

  useEffect(() => {
    if (!citaId) return
    fetch(`/api/citas/${citaId}`)
      .then(r => r.json())
      .then(d => {
        if (d.reason) {
          setValue('reason', d.reason, { shouldDirty: false })
          setCitaLinked(true)
        }
      })
      .catch(() => {})
  }, [citaId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { fields: diagnosisFields, append: appendDiagnosis, remove: removeDiagnosis } = useFieldArray({ control, name: 'diagnoses' })
  const { fields: rxFields, append: appendRx, remove: removeRx } = useFieldArray({ control, name: 'prescriptions' })

  const weight = watch('weight')
  const height = watch('height')
  const bmi = (weight && height)
    ? ((parseFloat(weight) / ((parseFloat(height) / 100) ** 2)) || null)?.toFixed(1) ?? null
    : null

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    const payload: ConsultationPayload = {
      patientId, reason: data.reason,
      subjective: data.subjective || null, objective: data.objective || null,
      assessment: data.assessment || null, plan: data.plan || null, notes: data.notes || null,
      noteTemplate,
      vitalSigns: {
        bloodPressureSys: data.bloodPressureSys ? parseInt(data.bloodPressureSys) : null,
        bloodPressureDia: data.bloodPressureDia ? parseInt(data.bloodPressureDia) : null,
        heartRate: data.heartRate ? parseInt(data.heartRate) : null,
        respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : null,
        temperature: data.temperature ? parseFloat(data.temperature) : null,
        oxygenSat: data.oxygenSat ? parseFloat(data.oxygenSat) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        height: data.height ? parseFloat(data.height) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        glucoseLevel: data.glucoseLevel ? parseFloat(data.glucoseLevel) : null,
      },
      diagnoses: data.diagnoses || [],
      prescriptions: (data.prescriptions || [])
        .map(rx => ({ notes: rx.notes || undefined, items: rx.items.filter(it => it.medication && it.dosage && it.frequency && it.duration) }))
        .filter(rx => rx.items.length > 0),
    }
    const hasVitals = Object.values(payload.vitalSigns!).some(v => v !== null)
    if (!hasVitals) delete payload.vitalSigns

    try {
      const res = await fetch('/api/consultas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        toast({ variant: 'error', title: 'Error al guardar', description: err.error })
        return
      }
      if (citaId) {
        fetch(`/api/citas/${citaId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete' }),
        }).catch(() => {})
      }
      localStorage.removeItem(`draft_consulta_${patientId}`)
      // Create referral if filled
      if (showReferral && referralSpecialty && referralReason.trim()) {
        const record = await res.clone().json().catch(() => null)
        fetch('/api/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            toSpecialty: referralSpecialty,
            reason: referralReason,
            urgency: referralUrgency,
            notes: referralNotes || null,
            toDoctorId: referralDoctorId || null,
            consultationId: record?.id ?? null,
          }),
        }).catch(() => toast({ variant: 'error', title: 'Consulta guardada, derivación no enviada' }))
      }
      toast({ variant: 'success', title: 'Consulta registrada correctamente' })
      router.push(`/pacientes/${patientId}`)
      router.refresh()
    } catch {
      toast({ variant: 'error', title: 'Error inesperado' })
    } finally {
      setIsLoading(false)
    }
  }

  const TEST_PATTERNS = /^(test|prueba|hola|asdf|qwerty|demo|ejemplo|abc|123|sample)\b/i
  const handleFetchGuide = async (reason: string) => {
    if (!reason?.trim() || reason.trim().length < 8 || TEST_PATTERNS.test(reason.trim())) return
    setGuideLoading(true)
    try {
      const res = await fetch('/api/ai/clinical-guide', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, ...patientData, specialty: session?.user?.specialty }),
      })
      if (!res.ok) throw new Error()
      setClinicalGuide(await res.json())
    } catch { /* silent */ }
    finally { setGuideLoading(false) }
  }

  const triggerPrescriptionSuggestions = async (diagnosisNames: string[]) => {
    if (diagnosisNames.length === 0) return
    setAiRxLoading(true); setAiRxDismissed(false)
    try {
      const res = await fetch('/api/ai/prescriptions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnoses: diagnosisNames, allergies: patientData.allergies, currentMedications: patientData.currentMedications }),
      })
      if (!res.ok) throw new Error()
      const s = await res.json()
      if (Array.isArray(s)) setAiRxSuggestions(s)
    } catch { /* silent */ }
    finally { setAiRxLoading(false) }
  }

  const acceptAiDiagnosis = (dx: { code: string; description: string }) => {
    appendDiagnosis({ code: dx.code, description: dx.description, type: 'PRIMARY', status: 'ACTIVE', notes: '' })
    setAiDiagnoses(prev => prev.filter(d => d.code !== dx.code))
    triggerPrescriptionSuggestions([...(watch('diagnoses') ?? []).map(d => d.description), dx.description])
  }

  const acceptAiRxSuggestion = (rx: typeof aiRxSuggestions[0]) => {
    appendRx({ notes: '', items: [{ medication: rx.medication, dosage: rx.dosage, frequency: rx.frequency, duration: rx.duration, quantity: '', instructions: rx.instructions ?? '' }] })
    setAiRxSuggestions(prev => prev.filter(s => s.medication !== rx.medication))
  }

  const checkDrugInteraction = (medicationName: string): string | null => {
    if (!medicationName || patientData.allergies.length === 0) return null
    const nameLower = medicationName.toLowerCase()
    const match = patientData.allergies.find(a => nameLower.includes(a.toLowerCase()) || a.toLowerCase().includes(nameLower.split(' ')[0]))
    return match ? `Posible interacción: alergia a ${match}` : null
  }

  const reason = watch('reason')
  useEffect(() => {
    if (!reason || reason.trim().length < 15 || guideGenerated || guideLoading) return
    if (guideDebounceRef.current) clearTimeout(guideDebounceRef.current)
    guideDebounceRef.current = setTimeout(() => { setGuideGenerated(true); handleFetchGuide(reason) }, 2000)
    return () => { if (guideDebounceRef.current) clearTimeout(guideDebounceRef.current) }
  }, [reason]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Check for draft on mount + load org doctors
  useEffect(() => {
    const draft = localStorage.getItem(`draft_consulta_${patientId}`)
    if (draft) setHasDraft(true)
    fetch('/api/users').then(r => r.json()).then(setOrgDoctors).catch(() => {})
  }, [patientId])

  // Auto-save draft every 10s when dirty
  const allFormValues = watch()
  useEffect(() => {
    if (!isDirty || draftRestored) return
    const timer = setTimeout(() => {
      localStorage.setItem(`draft_consulta_${patientId}`, JSON.stringify(allFormValues))
    }, 5000)
    return () => clearTimeout(timer)
  }, [allFormValues, isDirty, patientId, draftRestored]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasSevereAllergy = patientAllergies.some(a => a.severity === 'SEVERE')

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 flex-col">

      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0 rounded-sm">
          <Link href={`/pacientes/${patientId}`} aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">Nueva consulta</h2>
            {citaLinked && (
              <span className="flex items-center gap-1 border border-border bg-background px-2 py-0.5 text-xs text-foreground-muted">
                <Calendar className="h-2.5 w-2.5" />
                Cita vinculada
              </span>
            )}
          </div>
          {patientCtx && (
            <p className="truncate text-xs text-foreground-muted">{patientCtx.name}</p>
          )}
        </div>
        <Button type="button" disabled={isLoading} onClick={handleSubmit(onSubmit)} className="shrink-0 gap-1.5">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      {/* ── Draft recovery banner ── */}
      {hasDraft && !draftRestored && (
        <div className="flex shrink-0 items-center justify-between border-b border-warning/30 bg-warning/10 px-4 py-2">
          <p className="text-xs text-warning font-medium">Tienes un borrador no guardado de esta consulta.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs font-medium text-warning hover:underline"
              onClick={() => {
                try {
                  const draft = localStorage.getItem(`draft_consulta_${patientId}`)
                  if (!draft) return
                  const d = JSON.parse(draft) as FormData
                  Object.entries(d).forEach(([key, val]) => setValue(key as keyof FormData, val as never, { shouldDirty: true }))
                  setDraftRestored(true)
                  setHasDraft(false)
                } catch { setHasDraft(false) }
              }}
            >
              Restaurar
            </button>
            <button
              type="button"
              className="text-xs text-foreground-subtle hover:underline"
              onClick={() => { localStorage.removeItem(`draft_consulta_${patientId}`); setHasDraft(false) }}
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* ── Body (three panels) ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── LEFT: Patient context sidebar ── */}
        <aside className="hidden w-[220px] shrink-0 overflow-y-auto border-r border-border bg-surface lg:flex lg:flex-col">
          <div className="border-b border-border bg-surface-alt px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">Contexto del paciente</p>
          </div>

          {hasSevereAllergy && (
            <div className="border-b border-danger/20 bg-danger/5 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-danger" />
                <p className="text-xs font-bold text-danger">Alergia severa</p>
              </div>
              <div className="mt-1 space-y-0.5">
                {patientAllergies.filter(a => a.severity === 'SEVERE').map((a, i) => (
                  <p key={i} className="text-xs font-semibold text-danger">{a.allergen}</p>
                ))}
              </div>
            </div>
          )}

          <PatientSidebar ctx={patientCtx} loading={ctxLoading} />
        </aside>

        {/* ── CENTER + RIGHT: form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── CENTER: Motivo + SOAP workspace ── */}
          <div className="flex flex-1 flex-col min-h-0 border-r border-border">

            {/* Motivo header */}
            <div className="shrink-0 border-b border-border bg-surface p-4 space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Motivo de consulta *</Label>
                    {specialtyConfig.sessionTypes && (
                      <Select value={sessionType} onValueChange={setSessionType}>
                        <SelectTrigger className="h-6 w-auto gap-1 border-0 bg-transparent px-2 text-xs text-foreground-subtle shadow-none hover:bg-surface-muted focus:ring-0">
                          <SelectValue placeholder="Tipo de sesión" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialtyConfig.sessionTypes.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Input className="text-sm" placeholder="¿Por qué consulta el paciente hoy?" {...register('reason')} autoFocus />
                  {errors.reason?.message && <p className="text-xs text-danger">{errors.reason.message}</p>}
                </div>
              </div>
              {/* AI clinical guide */}
              {(guideLoading || clinicalGuide) && (
                <div className="rounded-md border border-primary/20 bg-primary/5 overflow-hidden">
                  <button type="button" onClick={() => setGuideCollapsed(v => !v)}
                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-colors">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="flex-1 text-left text-xs font-semibold uppercase tracking-wide text-primary">Guía clínica IA</p>
                    {guideLoading ? <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      : <ChevronDown className={`h-3.5 w-3.5 text-primary transition-transform ${guideCollapsed ? '-rotate-90' : ''}`} />}
                  </button>
                  {!guideCollapsed && (
                    <>
                      {guideLoading && (
                        <div className="grid grid-cols-2 gap-px border-t border-primary/10 sm:grid-cols-4">
                          {Object.values(specialtyConfig.guideLabels).map(label => (
                            <div key={label} className="bg-surface px-3 py-2">
                              <p className="mb-1.5 text-xs font-semibold uppercase text-foreground-subtle">{label}</p>
                              {[1,2,3].map(i => <div key={i} className="mb-1 h-2 animate-pulse rounded bg-border" style={{ width: `${55 + i * 15}%` }} />)}
                            </div>
                          ))}
                        </div>
                      )}
                      {clinicalGuide && !guideLoading && (
                        <div className="grid grid-cols-2 gap-px border-t border-primary/10 sm:grid-cols-4">
                          {[
                            { label: specialtyConfig.guideLabels.ask,     icon: MessageSquare, items: clinicalGuide.ask },
                            { label: specialtyConfig.guideLabels.examine,  icon: Stethoscope,   items: clinicalGuide.examine },
                            { label: specialtyConfig.guideLabels.consider, icon: Brain,         items: clinicalGuide.consider },
                            { label: specialtyConfig.guideLabels.workup,   icon: FlaskConical,  items: clinicalGuide.workup },
                          ].map(({ label, icon: Icon, items }) => (
                            <div key={label} className="bg-surface px-3 py-2">
                              <div className="mb-1.5 flex items-center gap-1.5">
                                <Icon className="h-3 w-3 text-primary" />
                                <p className="text-xs font-semibold uppercase text-foreground-subtle">{label}</p>
                              </div>
                              <ul className="space-y-1">
                                {items.map((item, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground-muted">
                                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />{item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* SOAP 2×2 grid — fills remaining height */}
            <div className="min-h-0 flex-1 grid grid-cols-2 grid-rows-2">
              {([
                { key: 'subjective' as const, letter: 'S', letterCls: 'bg-blue-600',    placeholder: specialtyConfig.sections.s.placeholder, cls: 'border-b border-r border-border' },
                { key: 'objective'  as const, letter: 'O', letterCls: 'bg-teal-600',    placeholder: specialtyConfig.sections.o.placeholder, cls: 'border-b border-border' },
                { key: 'assessment' as const, letter: 'A', letterCls: 'bg-amber-600',   placeholder: specialtyConfig.sections.a.placeholder, cls: 'border-r border-border' },
                { key: 'plan'       as const, letter: 'P', letterCls: 'bg-emerald-600', placeholder: specialtyConfig.sections.p.placeholder, cls: '' },
              ] as { key: 'subjective'|'objective'|'assessment'|'plan'; letter: string; letterCls: string; placeholder: string; cls: string }[]).map(({ key, letter, letterCls, placeholder, cls }) => {
                const { label, hint } = soapLabels[key]
                return (
                  <div key={key} className={`flex flex-col min-h-0 bg-surface ${cls}`}>
                    {/* Cell header */}
                    <div className="flex shrink-0 items-center justify-between bg-surface-alt px-3 py-1.5 border-b border-border">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${letterCls}`}>{letter}</span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle shrink-0">{label}</span>
                        {hint && <span className="hidden xl:inline truncate text-xs text-foreground-subtle/60">· {hint}</span>}
                      </div>
                      <VoiceDictationButton onTranscript={(text) => {
                        const current = watch(key) ?? ''
                        setValue(key, current ? `${current} ${text}` : text, { shouldDirty: true })
                      }} />
                    </div>
                    {/* Plan toolbar */}
                    {key === 'plan' && (
                      <div className="shrink-0 flex items-center gap-1 border-b border-border bg-surface-alt/60 px-3 py-1">
                        <button
                          type="button"
                          onClick={() => appendRx({ notes: '', items: [{ medication: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }] })}
                          className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                        >
                          <Pill className="h-3 w-3" /> Receta rápida
                        </button>
                        <span className="text-border">|</span>
                        <button
                          type="button"
                          onClick={() => setShowReferral(true)}
                          className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-muted"
                        >
                          <Share2 className="h-3 w-3" /> Derivar
                        </button>
                      </div>
                    )}
                    <textarea
                      placeholder={placeholder}
                      className="flex-1 min-h-0 w-full resize-none bg-transparent p-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]/40 focus:outline-none"
                      {...register(key)}
                    />
                  </div>
                )
              })}
            </div>

            {/* Bottom action bar */}
            <div className="shrink-0 flex items-center justify-between border-t border-border bg-surface px-4 py-3">
              <Button variant="ghost" type="button" asChild className="text-[var(--foreground-subtle)]">
                <Link href={`/pacientes/${patientId}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isLoading ? 'Guardando...' : 'Guardar consulta'}
              </Button>
            </div>
          </div>

          {/* ── RIGHT: Structured data panel ── */}
          <aside className="hidden lg:flex w-[300px] shrink-0 flex-col overflow-y-auto divide-y divide-border bg-surface">

            {/* Signos vitales */}
            {specialtyConfig.vitals && (
              <div>
                <div className="flex items-center justify-between bg-surface-alt px-4 py-2 border-b border-border">
                  <h3 className="section-kicker">Signos vitales</h3>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {specialtyConfig.vitals.primary.includes('bp') && (<>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-foreground-subtle flex items-center gap-1"><Heart className="h-2.5 w-2.5" /> PA Sis</label>
                        <VitalBadge vitalKey="bloodPressureSys" value={watch('bloodPressureSys') ?? ''} />
                      </div>
                      <Input type="number" placeholder="120" className="h-8 text-sm" {...register('bloodPressureSys')} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-foreground-subtle">PA Dia</label>
                        <VitalBadge vitalKey="bloodPressureDia" value={watch('bloodPressureDia') ?? ''} />
                      </div>
                      <Input type="number" placeholder="80" className="h-8 text-sm" {...register('bloodPressureDia')} />
                    </div>
                  </>)}
                  {specialtyConfig.vitals.primary.includes('heartRate') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-foreground-subtle flex items-center gap-1"><Activity className="h-2.5 w-2.5" /> FC (lpm)</label>
                        <VitalBadge vitalKey="heartRate" value={watch('heartRate') ?? ''} />
                      </div>
                      <Input type="number" placeholder="72" className="h-8 text-sm" {...register('heartRate')} />
                    </div>
                  )}
                  {specialtyConfig.vitals.primary.includes('temperature') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-foreground-subtle flex items-center gap-1"><Thermometer className="h-2.5 w-2.5" /> Temp °C</label>
                        <VitalBadge vitalKey="temperature" value={watch('temperature') ?? ''} />
                      </div>
                      <Input type="number" step="0.1" placeholder="36.5" className="h-8 text-sm" {...register('temperature')} />
                    </div>
                  )}
                  {specialtyConfig.vitals.primary.includes('oxygenSat') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-foreground-subtle flex items-center gap-1"><Wind className="h-2.5 w-2.5" /> SpO2 (%)</label>
                        <VitalBadge vitalKey="oxygenSat" value={watch('oxygenSat') ?? ''} />
                      </div>
                      <Input type="number" step="0.1" placeholder="98" className="h-8 text-sm" {...register('oxygenSat')} />
                    </div>
                  )}
                  {specialtyConfig.vitals.primary.includes('weight') && (
                    <div className="space-y-1">
                      <label className="text-xs text-foreground-subtle">Peso (kg)</label>
                      <Input type="number" step="0.1" placeholder="70" className="h-8 text-sm" {...register('weight')} />
                    </div>
                  )}
                  {specialtyConfig.vitals.primary.includes('glucose') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-foreground-subtle flex items-center gap-1"><Droplets className="h-2.5 w-2.5" /> Glucosa</label>
                        <VitalBadge vitalKey="glucoseLevel" value={watch('glucoseLevel') ?? ''} />
                      </div>
                      <Input type="number" step="0.1" placeholder="100" className="h-8 text-sm" {...register('glucoseLevel')} />
                    </div>
                  )}
                  {specialtyConfig.vitals.expanded.includes('respiratoryRate') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-foreground-subtle">FR (rpm)</label>
                        <VitalBadge vitalKey="respiratoryRate" value={watch('respiratoryRate') ?? ''} />
                      </div>
                      <Input type="number" placeholder="16" className="h-8 text-sm" {...register('respiratoryRate')} />
                    </div>
                  )}
                  {specialtyConfig.vitals.expanded.includes('height') && (
                    <div className="space-y-1">
                      <label className="text-xs text-foreground-subtle">Talla (cm)</label>
                      <Input type="number" placeholder="170" className="h-8 text-sm" {...register('height')} />
                    </div>
                  )}
                  {specialtyConfig.vitals.expanded.includes('bmi') && bmi && (
                    <div className="col-span-2 flex items-center gap-2 border border-border bg-surface-alt px-3 py-1.5 text-xs">
                      <span className="text-foreground-subtle">IMC</span>
                      <span className="font-mono font-semibold text-foreground">{bmi} kg/m²</span>
                      <span className={parseFloat(bmi) < 18.5 ? 'text-warning' : parseFloat(bmi) < 25 ? 'text-success' : parseFloat(bmi) < 30 ? 'text-warning' : 'text-danger'}>
                        {parseFloat(bmi) < 18.5 ? 'Bajo peso' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Sobrepeso' : 'Obesidad'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnósticos */}
            <div>
              <div className="flex items-center justify-between bg-surface-alt px-4 py-2 border-b border-border">
                <h3 className="section-kicker">Diagnósticos CIE-10</h3>
                <div className="flex items-center gap-2">
                  {lastDiagnoses.length > 0 && diagnosisFields.length === 0 && (
                    <button type="button" className="text-xs text-primary hover:underline"
                      onClick={() => lastDiagnoses.forEach(dx => appendDiagnosis({ ...dx, notes: '' }))}>
                      Copiar anterior
                    </button>
                  )}
                  <Button type="button" variant="outline" size="sm" className="h-6 gap-1 px-2 text-xs"
                    onClick={() => appendDiagnosis({ code: '', description: '', type: 'PRIMARY', status: 'ACTIVE', notes: '' })}>
                    <Plus className="h-3 w-3" /> Agregar
                  </Button>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {(aiDiagnoses.length > 0 || aiDiagnosesLoading) && (
                  <div className="border border-primary/20 bg-primary/5 p-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3 w-3" /> Sugerencias IA
                    </div>
                    {aiDiagnoses.map(dx => (
                      <div key={dx.code} className="flex items-center justify-between gap-2 border border-border bg-surface px-2 py-1.5">
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-foreground">{dx.code}</span>
                          <span className="ml-1.5 text-xs text-foreground-muted truncate"> {dx.description}</span>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => acceptAiDiagnosis(dx)} className="h-5 shrink-0 px-1.5 text-xs">+</Button>
                      </div>
                    ))}
                  </div>
                )}
                {diagnosisFields.length === 0
                  ? <p className="py-2 text-center text-xs text-foreground-subtle">Sin diagnósticos</p>
                  : diagnosisFields.map((field, index) => (
                    <div key={field.id} className="border border-border p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        {diagnosisFields.length > 1 && <span className="text-xs font-semibold text-foreground-subtle">Dx {index + 1}</span>}
                        <Button type="button" variant="ghost" size="icon" className="ml-auto h-5 w-5 text-danger hover:bg-danger/10" onClick={() => removeDiagnosis(index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Controller control={control} name={`diagnoses.${index}.code`} render={({ field: cf }) => (
                        <Controller control={control} name={`diagnoses.${index}.description`} render={({ field: df }) => (
                          <CIE10Input
                            codeValue={cf.value} descriptionValue={df.value}
                            onSelect={(code, desc) => { cf.onChange(code); df.onChange(desc) }}
                            codeProps={{ ...cf, onChange: cf.onChange as React.ChangeEventHandler<HTMLInputElement> }}
                            descriptionProps={{ ...df, onChange: df.onChange as React.ChangeEventHandler<HTMLInputElement> }}
                            codeError={errors.diagnoses?.[index]?.code?.message}
                            descriptionError={errors.diagnoses?.[index]?.description?.message}
                          />
                        )} />
                      )} />
                      <div className="grid grid-cols-2 gap-2">
                        <Controller control={control} name={`diagnoses.${index}.type`} render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRIMARY">Principal</SelectItem>
                              <SelectItem value="SECONDARY">Secundario</SelectItem>
                              <SelectItem value="COMPLICATION">Complicación</SelectItem>
                            </SelectContent>
                          </Select>
                        )} />
                        <Controller control={control} name={`diagnoses.${index}.status`} render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Activo</SelectItem>
                              <SelectItem value="RESOLVED">Resuelto</SelectItem>
                              <SelectItem value="CHRONIC">Crónico</SelectItem>
                            </SelectContent>
                          </Select>
                        )} />
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Recetas */}
            {specialtyConfig.showPrescriptions && (
              <div>
                <div className="flex items-center justify-between bg-surface-alt px-4 py-2 border-b border-border">
                  <h3 className="section-kicker">Recetas</h3>
                  <div className="flex items-center gap-2">
                    {lastRxItems.length > 0 && rxFields.length === 0 && (
                      <button type="button" className="text-xs text-primary hover:underline"
                        onClick={() => appendRx({ notes: 'Continuar medicación anterior', items: lastRxItems.map(it => ({ medication: it.medication, dosage: it.dosage, frequency: it.frequency, duration: it.duration, quantity: it.quantity ?? '', instructions: it.instructions ?? '' })) })}>
                        Copiar anterior
                      </button>
                    )}
                    <Button type="button" variant="outline" size="sm" className="h-6 gap-1 px-2 text-xs"
                      onClick={() => appendRx({ notes: '', items: [{ medication: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }] })}>
                      <Plus className="h-3 w-3" /> Agregar
                    </Button>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {(aiRxSuggestions.length > 0 || aiRxLoading) && !aiRxDismissed && (
                    <div className="border border-primary/20 bg-primary/5 p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary"><Sparkles className="h-3 w-3" /> Sugerida por IA</div>
                        <button type="button" onClick={() => setAiRxDismissed(true)} className="text-xs text-foreground-subtle hover:text-foreground">Ignorar</button>
                      </div>
                      {aiRxLoading && <div className="flex items-center gap-2 text-xs text-foreground-muted"><Loader2 className="h-3 w-3 animate-spin" /> Generando...</div>}
                      {aiRxSuggestions.map((rx, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 border border-border bg-surface px-2 py-1.5">
                          <div className="text-xs min-w-0">
                            <span className="font-semibold text-foreground">{rx.medication}</span>
                            <span className="ml-1 text-foreground-muted">{rx.dosage} · {rx.frequency}</span>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => acceptAiRxSuggestion(rx)} className="h-5 shrink-0 px-1.5 text-xs">+</Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {rxFields.length === 0
                    ? <p className="py-2 text-center text-xs text-foreground-subtle">Sin recetas</p>
                    : rxFields.map((rxField, rxIndex) => (
                      <RxBlock key={rxField.id} rxIndex={rxIndex} control={control} register={register} errors={errors} removeRx={removeRx} watch={watch} checkDrugInteraction={checkDrugInteraction} />
                    ))
                  }
                </div>
              </div>
            )}

            {/* Derivar paciente — se activa desde el toolbar del Plan */}
            {showReferral && (
            <div>
              <div className="flex items-center justify-between bg-surface-alt px-4 py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Share2 className="h-3.5 w-3.5 text-foreground-subtle" />
                  <h3 className="section-kicker">Derivar paciente</h3>
                  {referralSpecialty && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{SPECIALTY_LABELS[referralSpecialty] ?? referralSpecialty}</span>
                  )}
                </div>
                <button type="button" onClick={() => setShowReferral(false)}
                  className="text-foreground-subtle hover:text-foreground transition-colors text-xs px-1">✕</button>
              </div>
              <div className="space-y-2 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Especialidad *</Label>
                    <Select value={referralSpecialty} onValueChange={setReferralSpecialty}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(SPECIALTY_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Urgencia</Label>
                    <Select value={referralUrgency} onValueChange={setReferralUrgency}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROUTINE">Rutina</SelectItem>
                        <SelectItem value="PRIORITY">Prioritario</SelectItem>
                        <SelectItem value="URGENT">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Médico destino (opcional)</Label>
                  <Select value={referralDoctorId || '__none__'} onValueChange={v => setReferralDoctorId(v === '__none__' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sin especificar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin especificar</SelectItem>
                      {orgDoctors.filter(d => d.id !== session?.user?.id).map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}{d.speciality ? ` · ${d.speciality}` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Motivo *</Label>
                  <Textarea placeholder="Motivo clínico..." rows={2} className="resize-none text-xs"
                    value={referralReason} onChange={e => setReferralReason(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-foreground-subtle">Notas (opcional)</Label>
                  <Textarea placeholder="Para el especialista..." rows={2} className="resize-none text-xs"
                    value={referralNotes} onChange={e => setReferralNotes(e.target.value)} />
                </div>
              </div>
            </div>
            )}

          </aside>

        </form>

      </div>
    </div>
  )
}

// ── RxBlock sub-component ─────────────────────────────────────────────────────

function RxBlock({ rxIndex, control, register, errors, removeRx, watch, checkDrugInteraction }: {
  rxIndex: number; control: Control<FormData>; register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>; removeRx: (index: number) => void
  watch: (name: string) => string | undefined; checkDrugInteraction: (name: string) => string | null
}) {
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: `prescriptions.${rxIndex}.items` })

  return (
    <div className="border border-border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Pill className="h-3.5 w-3.5 text-foreground-subtle" /> Receta {rxIndex + 1}
        </span>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-danger hover:bg-danger/10" onClick={() => removeRx(rxIndex)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        {itemFields.map((itemField, itemIndex) => (
          <div key={itemField.id} className="border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Medicamento {itemIndex + 1}</span>
              {itemFields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-danger hover:bg-danger/10" onClick={() => removeItem(itemIndex)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <Label className="text-xs">Medicamento *</Label>
                <Input placeholder="Amoxicilina" className="text-sm" {...register(`prescriptions.${rxIndex}.items.${itemIndex}.medication`)} />
                {errors.prescriptions?.[rxIndex]?.items?.[itemIndex]?.medication && (
                  <p className="text-xs text-danger">{errors.prescriptions[rxIndex].items[itemIndex].medication.message}</p>
                )}
                {(() => {
                  const w = checkDrugInteraction(watch(`prescriptions.${rxIndex}.items.${itemIndex}.medication`) ?? '')
                  return w ? <p className="flex items-center gap-1 text-xs text-warning"><ShieldAlert className="h-3 w-3 shrink-0" />{w}</p> : null
                })()}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dosis *</Label>
                <Input placeholder="500mg" className="text-sm" {...register(`prescriptions.${rxIndex}.items.${itemIndex}.dosage`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frecuencia *</Label>
                <Input placeholder="Cada 8h" className="text-sm" {...register(`prescriptions.${rxIndex}.items.${itemIndex}.frequency`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duración *</Label>
                <Input placeholder="7 días" className="text-sm" {...register(`prescriptions.${rxIndex}.items.${itemIndex}.duration`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cantidad</Label>
                <Input placeholder="21 tabletas" className="text-sm" {...register(`prescriptions.${rxIndex}.items.${itemIndex}.quantity`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Instrucciones</Label>
                <Input placeholder="Con alimentos" className="text-sm" {...register(`prescriptions.${rxIndex}.items.${itemIndex}.instructions`)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button" variant="outline" size="sm" className="w-full border-dashed text-xs"
        onClick={() => appendItem({ medication: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' })}
      >
        <Plus className="mr-1 h-3 w-3" /> Agregar medicamento
      </Button>

      <div className="space-y-1">
        <Label className="text-xs text-foreground-muted">Indicaciones generales (opcional)</Label>
        <Textarea placeholder="Reposo, abundantes líquidos..." rows={2} className="resize-none text-sm" {...register(`prescriptions.${rxIndex}.notes`)} />
      </div>
    </div>
  )
}
