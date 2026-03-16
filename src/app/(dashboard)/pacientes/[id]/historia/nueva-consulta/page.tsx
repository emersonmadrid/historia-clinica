'use client'

import { useState, useEffect, use } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Pill, ShieldAlert, Sparkles, Loader2 } from 'lucide-react'
import { CIE10Input } from './CIE10Input'
import { toast } from '@/hooks/useToast'
import { Breadcrumb } from '@/components/ui/breadcrumb'
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
import { Separator } from '@/components/ui/separator'

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
  // Vital Signs
  bloodPressureSys: z.string().optional(),
  bloodPressureDia: z.string().optional(),
  heartRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  temperature: z.string().optional(),
  oxygenSat: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  glucoseLevel: z.string().optional(),
  // Diagnoses
  diagnoses: z.array(diagnosisSchema).optional(),
  // Prescriptions
  prescriptions: z.array(prescriptionSchema).optional(),
})

type FormData = z.infer<typeof schema>

function FormField({
  label,
  error,
  children,
  hint,
}: {
  label: string
  error?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function NuevaConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [soapLoading, setSoapLoading] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [patientAllergies, setPatientAllergies] = useState<{ allergen: string; severity: string; reaction: string | null }[]>([])
  const [patientData, setPatientData] = useState<{
    allergies: string[]
    activeConditions: string[]
    currentMedications: string[]
  }>({ allergies: [], activeConditions: [], currentMedications: [] })

  useEffect(() => {
    fetch(`/api/pacientes/${patientId}`)
      .then(r => r.json())
      .then(d => {
        if (d.firstName) setPatientName(`${d.firstName} ${d.lastName}`)
        if (d.allergies) {
          // Deduplicate by allergen name
          const seen = new Set<string>()
          setPatientAllergies(
            d.allergies.filter((a: { allergen: string }) => {
              if (seen.has(a.allergen)) return false
              seen.add(a.allergen)
              return true
            })
          )
        }

        // Build AI context from patient data
        const allergies = (d.allergies ?? []).map((a: { allergen: string }) => a.allergen)
        const activeConditions = (d.clinicalRecords ?? [])
          .flatMap((r: { diagnoses: { status: string; description: string; code: string }[] }) => r.diagnoses)
          .filter((dx: { status: string }) => dx.status === 'ACTIVE' || dx.status === 'CHRONIC')
          .reduce((acc: string[], dx: { code: string; description: string }) => {
            if (!acc.find(x => x === dx.description)) acc.push(dx.description)
            return acc
          }, [])
        const lastPrescription = (d.clinicalRecords ?? [])
          .flatMap((r: { prescriptions: { createdAt: string; items: { medication: string; dosage: string }[] }[] }) => r.prescriptions)
          .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        const currentMedications = (lastPrescription?.items ?? []).map(
          (it: { medication: string; dosage: string }) => `${it.medication} ${it.dosage}`
        )
        setPatientData({ allergies, activeConditions, currentMedications })
      })
      .catch(() => {})
  }, [patientId])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      diagnoses: [],
      prescriptions: [],
    },
  })

  const { fields: diagnosisFields, append: appendDiagnosis, remove: removeDiagnosis } = useFieldArray({
    control,
    name: 'diagnoses',
  })

  const { fields: rxFields, append: appendRx, remove: removeRx } = useFieldArray({
    control,
    name: 'prescriptions',
  })

  // Auto-calculate BMI
  const weight = watch('weight')
  const height = watch('height')

  const calculateBMI = () => {
    if (weight && height) {
      const w = parseFloat(weight)
      const h = parseFloat(height) / 100
      if (w > 0 && h > 0) {
        return (w / (h * h)).toFixed(1)
      }
    }
    return null
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    const bmi = calculateBMI()

    const payload = {
      patientId,
      reason: data.reason,
      subjective: data.subjective || null,
      objective: data.objective || null,
      assessment: data.assessment || null,
      plan: data.plan || null,
      notes: data.notes || null,
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
        .map(rx => ({
          notes: rx.notes || undefined,
          items: rx.items.filter(
            it => it.medication && it.dosage && it.frequency && it.duration
          ),
        }))
        .filter(rx => rx.items.length > 0),
    }

    // Remove vitalSigns if all null
    const hasVitalSigns = Object.values(payload.vitalSigns).some(v => v !== null)
    if (!hasVitalSigns) {
      ;(payload as any).vitalSigns = undefined
    }

    try {
      const res = await fetch('/api/consultas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        toast({ variant: 'error', title: 'Error al guardar la consulta', description: err.error })
        return
      }

      toast({ variant: 'success', title: 'Consulta registrada correctamente' })
      router.push(`/pacientes/${patientId}`)
      router.refresh()
    } catch {
      toast({ variant: 'error', title: 'Error inesperado', description: 'Por favor, intente nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  const bmi = calculateBMI()

  const handleGenerateSOAP = async () => {
    const reason = watch('reason')
    if (!reason?.trim()) {
      toast({ variant: 'error', title: 'Escribe el motivo de consulta primero' })
      return
    }
    setSoapLoading(true)
    try {
      const sys = watch('bloodPressureSys')
      const dia = watch('bloodPressureDia')
      const res = await fetch('/api/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          ...patientData,
          vitalSigns: {
            bloodPressure: sys && dia ? `${sys}/${dia}` : undefined,
            heartRate: watch('heartRate') ? parseInt(watch('heartRate')!) : undefined,
            temperature: watch('temperature') ? parseFloat(watch('temperature')!) : undefined,
            oxygenSat: watch('oxygenSat') ? parseFloat(watch('oxygenSat')!) : undefined,
          },
        }),
      })
      if (!res.ok) throw new Error()
      const soap = await res.json()
      if (soap.subjective) setValue('subjective', soap.subjective, { shouldDirty: true })
      if (soap.objective) setValue('objective', soap.objective, { shouldDirty: true })
      if (soap.assessment) setValue('assessment', soap.assessment, { shouldDirty: true })
      if (soap.plan) setValue('plan', soap.plan, { shouldDirty: true })
      toast({ variant: 'success', title: 'Borrador SOAP generado', description: 'Revisa y ajusta según tu criterio clínico.' })
    } catch {
      toast({ variant: 'error', title: 'Error al generar SOAP', description: 'Intenta nuevamente.' })
    } finally {
      setSoapLoading(false)
    }
  }

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <Breadcrumb items={[
        { label: 'Pacientes', href: '/pacientes' },
        { label: patientName || 'Paciente', href: `/pacientes/${patientId}` },
        { label: 'Nueva Consulta' },
      ]} />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/pacientes/${patientId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nueva Consulta</h2>
          {patientName && (
            <p className="text-sm text-slate-500">Paciente: {patientName}</p>
          )}
        </div>
      </div>

      {/* Allergy banner */}
      {patientAllergies.length > 0 && (
        <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
          patientAllergies.some(a => a.severity === 'SEVERE')
            ? 'border-red-200 bg-red-50'
            : 'border-amber-200 bg-amber-50'
        }`}>
          <ShieldAlert className={`h-5 w-5 shrink-0 mt-0.5 ${patientAllergies.some(a => a.severity === 'SEVERE') ? 'text-red-600' : 'text-amber-600'}`} />
          <div>
            <p className={`text-sm font-semibold ${patientAllergies.some(a => a.severity === 'SEVERE') ? 'text-red-700' : 'text-amber-700'}`}>
              Alergias registradas — verificar antes de prescribir
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {patientAllergies.map((a, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    a.severity === 'SEVERE'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : a.severity === 'MODERATE'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {a.allergen}{a.reaction ? ` (${a.reaction})` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Reason */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motivo de Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField label="Motivo" error={errors.reason?.message}>
              <Input
                placeholder="Describe el motivo principal de la consulta..."
                {...register('reason')}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signos Vitales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <FormField label="PA Sistólica">
                  <Input type="number" placeholder="120" {...register('bloodPressureSys')} />
                </FormField>
                <FormField label="PA Diastólica">
                  <Input type="number" placeholder="80" {...register('bloodPressureDia')} />
                </FormField>
              </div>

              <FormField label="FC (lpm)">
                <Input type="number" placeholder="72" {...register('heartRate')} />
              </FormField>

              <FormField label="FR (rpm)">
                <Input type="number" placeholder="16" {...register('respiratoryRate')} />
              </FormField>

              <FormField label="Temperatura °C">
                <Input type="number" step="0.1" placeholder="36.5" {...register('temperature')} />
              </FormField>

              <FormField label="Sat O2 (%)">
                <Input type="number" step="0.1" placeholder="98" {...register('oxygenSat')} />
              </FormField>

              <FormField label="Peso (kg)">
                <Input type="number" step="0.1" placeholder="70" {...register('weight')} />
              </FormField>

              <FormField label="Talla (cm)">
                <Input type="number" placeholder="170" {...register('height')} />
              </FormField>

              <FormField label="IMC">
                <div className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                  {bmi ? `${bmi} kg/m²` : <span className="text-slate-400">Auto</span>}
                </div>
              </FormField>

              <FormField label="Glucosa (mg/dL)">
                <Input type="number" step="0.1" placeholder="100" {...register('glucoseLevel')} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* SOAP */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Formato SOAP</CardTitle>
            <button
              type="button"
              onClick={handleGenerateSOAP}
              disabled={soapLoading}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {soapLoading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Generando...</span></>
                : <><Sparkles className="h-3.5 w-3.5" /><span className="hidden sm:inline">Generar con IA</span><span className="sm:hidden">IA</span></>
              }
            </button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label="S — Subjetivo"
                hint="Síntomas referidos por el paciente"
              >
                <Textarea
                  placeholder="El paciente refiere dolor en... desde hace... días. Niega fiebre..."
                  rows={4}
                  {...register('subjective')}
                />
              </FormField>

              <FormField
                label="O — Objetivo"
                hint="Hallazgos del examen físico y exámenes"
              >
                <Textarea
                  placeholder="Al examen: paciente en ABEG, ABEH. Piel: normocoloreada..."
                  rows={4}
                  {...register('objective')}
                />
              </FormField>

              <FormField
                label="A — Evaluación/Diagnóstico"
                hint="Impresión diagnóstica"
              >
                <Textarea
                  placeholder="Diagnóstico diferencial, impresión clínica..."
                  rows={4}
                  {...register('assessment')}
                />
              </FormField>

              <FormField
                label="P — Plan"
                hint="Tratamiento, indicaciones, seguimiento"
              >
                <Textarea
                  placeholder="1. Medicación: ...\n2. Indicaciones: ...\n3. Control en ..."
                  rows={4}
                  {...register('plan')}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Diagnoses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Diagnósticos (CIE-10)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendDiagnosis({ code: '', description: '', type: 'PRIMARY', status: 'ACTIVE', notes: '' })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnosisFields.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay diagnósticos agregados. Use el botón para agregar.
              </p>
            ) : (
              diagnosisFields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Diagnóstico {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeDiagnosis(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Controller
                    control={control}
                    name={`diagnoses.${index}.code`}
                    render={({ field: codeField }) => (
                      <Controller
                        control={control}
                        name={`diagnoses.${index}.description`}
                        render={({ field: descField }) => (
                          <CIE10Input
                            codeValue={codeField.value}
                            descriptionValue={descField.value}
                            onSelect={(code, description) => {
                              codeField.onChange(code)
                              descField.onChange(description)
                            }}
                            codeProps={{ ...codeField, onChange: codeField.onChange as any }}
                            descriptionProps={{ ...descField, onChange: descField.onChange as any }}
                            codeError={errors.diagnoses?.[index]?.code?.message}
                            descriptionError={errors.diagnoses?.[index]?.description?.message}
                          />
                        )}
                      />
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Tipo">
                      <Controller
                        control={control}
                        name={`diagnoses.${index}.type`}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRIMARY">Principal</SelectItem>
                              <SelectItem value="SECONDARY">Secundario</SelectItem>
                              <SelectItem value="COMPLICATION">Complicación</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>

                    <FormField label="Estado">
                      <Controller
                        control={control}
                        name={`diagnoses.${index}.status`}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Activo</SelectItem>
                              <SelectItem value="RESOLVED">Resuelto</SelectItem>
                              <SelectItem value="CHRONIC">Crónico</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-[#0EA5E9]" />
              Recetas (opcional)
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendRx({ notes: '', items: [{ medication: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }] })}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar Receta
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {rxFields.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay recetas agregadas. Use el botón para agregar una receta con medicamentos.
              </p>
            ) : (
              rxFields.map((rxField, rxIndex) => (
                <RxBlock
                  key={rxField.id}
                  rxIndex={rxIndex}
                  control={control}
                  register={register}
                  errors={errors}
                  removeRx={removeRx}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Observaciones adicionales..."
              rows={3}
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* Sticky save bar */}
        <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 border-t border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6 py-4">
          <div className="flex items-center justify-end max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <Button variant="outline" type="button" asChild>
                <Link href={`/pacientes/${patientId}`}>Cancelar</Link>
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
                    Guardar Consulta
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

// Extracted sub-component to keep the main component clean
function RxBlock({
  rxIndex,
  control,
  register,
  errors,
  removeRx,
}: {
  rxIndex: number
  control: any
  register: any
  errors: any
  removeRx: (index: number) => void
}) {
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: `prescriptions.${rxIndex}.items`,
  })

  return (
    <div className="rounded-lg border border-[#A5F3FC] bg-[#F0F9FF]/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#075985] flex items-center gap-1.5">
          <Pill className="h-4 w-4" />
          Receta {rxIndex + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => removeRx(rxIndex)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Medication items */}
      <div className="space-y-3">
        {itemFields.map((itemField, itemIndex) => (
          <div key={itemField.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Medicamento {itemIndex + 1}
              </span>
              {itemFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeItem(itemIndex)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Medicamento *</Label>
                <Input
                  placeholder="Ej: Amoxicilina"
                  {...register(`prescriptions.${rxIndex}.items.${itemIndex}.medication`)}
                />
                {errors.prescriptions?.[rxIndex]?.items?.[itemIndex]?.medication && (
                  <p className="text-xs text-red-600">{errors.prescriptions[rxIndex].items[itemIndex].medication.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Dosis *</Label>
                <Input
                  placeholder="Ej: 500mg"
                  {...register(`prescriptions.${rxIndex}.items.${itemIndex}.dosage`)}
                />
                {errors.prescriptions?.[rxIndex]?.items?.[itemIndex]?.dosage && (
                  <p className="text-xs text-red-600">{errors.prescriptions[rxIndex].items[itemIndex].dosage.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Frecuencia *</Label>
                <Input
                  placeholder="Ej: Cada 8 horas"
                  {...register(`prescriptions.${rxIndex}.items.${itemIndex}.frequency`)}
                />
                {errors.prescriptions?.[rxIndex]?.items?.[itemIndex]?.frequency && (
                  <p className="text-xs text-red-600">{errors.prescriptions[rxIndex].items[itemIndex].frequency.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Duración *</Label>
                <Input
                  placeholder="Ej: 7 días"
                  {...register(`prescriptions.${rxIndex}.items.${itemIndex}.duration`)}
                />
                {errors.prescriptions?.[rxIndex]?.items?.[itemIndex]?.duration && (
                  <p className="text-xs text-red-600">{errors.prescriptions[rxIndex].items[itemIndex].duration.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Cantidad <span className="text-slate-400">(opcional)</span></Label>
                <Input
                  placeholder="Ej: 21 tabletas"
                  {...register(`prescriptions.${rxIndex}.items.${itemIndex}.quantity`)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Instrucciones <span className="text-slate-400">(opcional)</span></Label>
                <Input
                  placeholder="Ej: Tomar con alimentos"
                  {...register(`prescriptions.${rxIndex}.items.${itemIndex}.instructions`)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed"
        onClick={() => appendItem({ medication: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' })}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Agregar medicamento
      </Button>

      {/* Prescription notes */}
      <div className="space-y-1.5">
        <Label>Indicaciones generales <span className="text-slate-400">(opcional)</span></Label>
        <Textarea
          placeholder="Ej: Reposo relativo, abundantes líquidos..."
          rows={2}
          {...register(`prescriptions.${rxIndex}.notes`)}
        />
      </div>
    </div>
  )
}
