'use client'

import { useState, useEffect, use } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
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
  const [patientName, setPatientName] = useState('')

  useEffect(() => {
    fetch(`/api/pacientes/${patientId}`)
      .then(r => r.json())
      .then(d => {
        if (d.firstName) setPatientName(`${d.firstName} ${d.lastName}`)
      })
      .catch(() => {})
  }, [patientId])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      diagnoses: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'diagnoses',
  })

  // Auto-calculate BMI
  const weight = watch('weight')
  const height = watch('height')

  useEffect(() => {
    if (weight && height) {
      const w = parseFloat(weight)
      const h = parseFloat(height) / 100
      if (w > 0 && h > 0) {
        const bmi = w / (h * h)
        // BMI is calculated but not a form field — we'll include it in submission
      }
    }
  }, [weight, height])

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
    }

    // Remove vitalSigns if all null
    const hasVitalSigns = Object.values(payload.vitalSigns).some(v => v !== null)
    if (!hasVitalSigns) {
      (payload as any).vitalSigns = undefined
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
      router.push(`/pacientes/${patientId}/historia`)
      router.refresh()
    } catch {
      toast({ variant: 'error', title: 'Error inesperado', description: 'Por favor, intente nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  const bmi = calculateBMI()

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb items={[
        { label: 'Pacientes', href: '/pacientes' },
        { label: patientName || 'Paciente', href: `/pacientes/${patientId}` },
        { label: 'Historia', href: `/pacientes/${patientId}/historia` },
        { label: 'Nueva Consulta' },
      ]} />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/pacientes/${patientId}/historia`}>
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <FormField label="PA Sistólica (mmHg)">
                  <Input type="number" placeholder="120" {...register('bloodPressureSys')} />
                </FormField>
                <FormField label="PA Diastólica (mmHg)">
                  <Input type="number" placeholder="80" {...register('bloodPressureDia')} />
                </FormField>
              </div>

              <FormField label="FC (lpm)">
                <Input type="number" placeholder="72" {...register('heartRate')} />
              </FormField>

              <FormField label="FR (rpm)">
                <Input type="number" placeholder="16" {...register('respiratoryRate')} />
              </FormField>

              <FormField label="Temperatura (°C)">
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
                  {bmi ? `${bmi} kg/m²` : <span className="text-slate-400">Auto-calculado</span>}
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
          <CardHeader>
            <CardTitle className="text-base">Formato SOAP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label="S — Subjetivo"
              hint="Síntomas y quejas del paciente (en primera persona)"
            >
              <Textarea
                placeholder="El paciente refiere dolor en... desde hace... días. Niega fiebre..."
                rows={3}
                {...register('subjective')}
              />
            </FormField>

            <Separator />

            <FormField
              label="O — Objetivo"
              hint="Hallazgos del examen físico y resultados de exámenes"
            >
              <Textarea
                placeholder="Al examen: paciente en ABEG, ABEH. Piel: normocoloreada. Abdomen: blando, depresible..."
                rows={3}
                {...register('objective')}
              />
            </FormField>

            <Separator />

            <FormField
              label="A — Evaluación/Diagnóstico"
              hint="Impresión diagnóstica"
            >
              <Textarea
                placeholder="Diagnóstico diferencial, impresión clínica..."
                rows={3}
                {...register('assessment')}
              />
            </FormField>

            <Separator />

            <FormField
              label="P — Plan"
              hint="Tratamiento, indicaciones, seguimiento"
            >
              <Textarea
                placeholder="1. Medicación: ...\n2. Indicaciones: ...\n3. Control en ..."
                rows={3}
                {...register('plan')}
              />
            </FormField>
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
                append({ code: '', description: '', type: 'PRIMARY', status: 'ACTIVE', notes: '' })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay diagnósticos agregados. Use el botón para agregar.
              </p>
            ) : (
              fields.map((field, index) => (
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
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <FormField label="Código CIE-10" error={errors.diagnoses?.[index]?.code?.message}>
                      <Input
                        placeholder="J00"
                        {...register(`diagnoses.${index}.code`)}
                      />
                    </FormField>

                    <div className="sm:col-span-3">
                      <FormField label="Descripción" error={errors.diagnoses?.[index]?.description?.message}>
                        <Input
                          placeholder="Rinofaringitis aguda..."
                          {...register(`diagnoses.${index}.description`)}
                        />
                      </FormField>
                    </div>
                  </div>

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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href={`/pacientes/${patientId}/historia`}>Cancelar</Link>
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
      </form>
    </div>
  )
}
