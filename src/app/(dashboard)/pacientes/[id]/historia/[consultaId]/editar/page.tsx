'use client'

import { useState, useEffect, use } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Sparkles, Loader2 } from 'lucide-react'
import { CIE10Input } from '../../nueva-consulta/CIE10Input'
import { toast } from '@/hooks/useToast'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/shared/FormField'

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
})

type FormData = z.infer<typeof schema>

export default function EditarConsultaPage({
  params,
}: {
  params: Promise<{ id: string; consultaId: string }>
}) {
  const { id: patientId, consultaId } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [soapLoading, setSoapLoading] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [patientData, setPatientData] = useState<{
    allergies: string[]
    activeConditions: string[]
    currentMedications: string[]
  }>({ allergies: [], activeConditions: [], currentMedications: [] })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { diagnoses: [] },
  })

  const { fields: diagnosisFields, append: appendDiagnosis, remove: removeDiagnosis } = useFieldArray({
    control,
    name: 'diagnoses',
  })

  // Load consultation data
  useEffect(() => {
    Promise.all([
      fetch(`/api/consultas/${consultaId}`).then(r => r.json()),
      fetch(`/api/pacientes/${patientId}`).then(r => r.json()),
    ])
      .then(([consulta, patient]) => {
        if (patient.firstName) setPatientName(`${patient.firstName} ${patient.lastName}`)

        // Build AI context
        const allergies = (patient.allergies ?? []).map((a: { allergen: string }) => a.allergen)
        const activeConditions = (patient.clinicalRecords ?? [])
          .flatMap((r: { diagnoses: { status: string; description: string }[] }) => r.diagnoses)
          .filter((dx: { status: string }) => dx.status === 'ACTIVE' || dx.status === 'CHRONIC')
          .reduce((acc: string[], dx: { description: string }) => {
            if (!acc.includes(dx.description)) acc.push(dx.description)
            return acc
          }, [])
        setPatientData({ allergies, activeConditions, currentMedications: [] })

        const vs = consulta.vitalSigns
        reset({
          reason: consulta.reason ?? '',
          subjective: consulta.subjective ?? '',
          objective: consulta.objective ?? '',
          assessment: consulta.assessment ?? '',
          plan: consulta.plan ?? '',
          notes: consulta.notes ?? '',
          bloodPressureSys: vs?.bloodPressureSys != null ? String(vs.bloodPressureSys) : '',
          bloodPressureDia: vs?.bloodPressureDia != null ? String(vs.bloodPressureDia) : '',
          heartRate: vs?.heartRate != null ? String(vs.heartRate) : '',
          respiratoryRate: vs?.respiratoryRate != null ? String(vs.respiratoryRate) : '',
          temperature: vs?.temperature != null ? String(vs.temperature) : '',
          oxygenSat: vs?.oxygenSat != null ? String(vs.oxygenSat) : '',
          weight: vs?.weight != null ? String(vs.weight) : '',
          height: vs?.height != null ? String(vs.height) : '',
          glucoseLevel: vs?.glucoseLevel != null ? String(vs.glucoseLevel) : '',
          diagnoses: (consulta.diagnoses ?? []).map((d: {
            code: string; description: string; type: string; status: string; notes: string | null
          }) => ({
            code: d.code,
            description: d.description,
            type: d.type as 'PRIMARY' | 'SECONDARY' | 'COMPLICATION',
            status: d.status as 'ACTIVE' | 'RESOLVED' | 'CHRONIC',
            notes: d.notes ?? '',
          })),
        })
      })
      .catch(() => toast({ variant: 'error', title: 'Error al cargar la consulta' }))
      .finally(() => setLoadingData(false))
  }, [consultaId, patientId, reset])

  const weight = watch('weight')
  const height = watch('height')

  const calculateBMI = () => {
    if (weight && height) {
      const w = parseFloat(weight)
      const h = parseFloat(height) / 100
      if (w > 0 && h > 0) return (w / (h * h)).toFixed(1)
    }
    return null
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    const bmi = calculateBMI()

    const vitalSigns = {
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
    }

    const payload = {
      reason: data.reason,
      subjective: data.subjective || null,
      objective: data.objective || null,
      assessment: data.assessment || null,
      plan: data.plan || null,
      notes: data.notes || null,
      vitalSigns,
      diagnoses: data.diagnoses || [],
    }

    try {
      const res = await fetch(`/api/consultas/${consultaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        toast({ variant: 'error', title: 'Error al guardar', description: err.error })
        return
      }

      toast({ variant: 'success', title: 'Consulta actualizada correctamente' })
      router.push(`/pacientes/${patientId}`)
      router.refresh()
    } catch {
      toast({ variant: 'error', title: 'Error inesperado', description: 'Por favor, intente nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

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
      toast({ variant: 'error', title: 'Error al generar SOAP' })
    } finally {
      setSoapLoading(false)
    }
  }

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const bmi = calculateBMI()

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-subtle" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumb items={[
        { label: 'Pacientes', href: '/pacientes' },
        { label: patientName || 'Paciente', href: `/pacientes/${patientId}` },
        { label: 'Editar Consulta' },
      ]} />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/pacientes/${patientId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Editar Consulta</h2>
          {patientName && <p className="text-sm text-foreground-muted">Paciente: {patientName}</p>}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground-muted">
        Está editando una consulta existente. Las recetas no se modifican aquí — gestionelas desde el detalle de la consulta.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Reason */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motivo de Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField label="Motivo" error={errors.reason?.message}>
              <Input placeholder="Motivo principal de la consulta..." {...register('reason')} />
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
                <div className="flex h-10 w-full items-center rounded-md border border-border bg-background px-3 text-sm text-foreground-muted">
                  {bmi ? `${bmi} kg/m²` : <span className="text-foreground-subtle">Auto</span>}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateSOAP}
              disabled={soapLoading}
              className="shrink-0"
            >
              {soapLoading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Generando...</span></>
                : <><Sparkles className="h-3.5 w-3.5" /><span className="hidden sm:inline">Generar con IA</span><span className="sm:hidden">IA</span></>
              }
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="S — Subjetivo" hint="Síntomas referidos por el paciente">
                <Textarea placeholder="El paciente refiere..." rows={4} {...register('subjective')} />
              </FormField>
              <FormField label="O — Objetivo" hint="Hallazgos del examen físico y exámenes">
                <Textarea placeholder="Al examen físico..." rows={4} {...register('objective')} />
              </FormField>
              <FormField label="A — Evaluación/Diagnóstico" hint="Impresión diagnóstica">
                <Textarea placeholder="Diagnóstico diferencial..." rows={4} {...register('assessment')} />
              </FormField>
              <FormField label="P — Plan" hint="Tratamiento, indicaciones, seguimiento">
                <Textarea placeholder="1. Medicación: ..." rows={4} {...register('plan')} />
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
              <p className="text-sm text-foreground-subtle text-center py-4">
                No hay diagnósticos. Use el botón para agregar.
              </p>
            ) : (
              diagnosisFields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground-muted uppercase">
                      Diagnóstico {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-danger hover:text-danger hover:bg-danger/10"
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
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Textarea placeholder="Observaciones adicionales..." rows={3} {...register('notes')} />
          </CardContent>
        </Card>

        {/* Sticky save bar */}
        <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 border-t border-border bg-surface/95 backdrop-blur px-4 sm:px-6 py-4">
          <div className="flex items-center justify-end max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <Button variant="outline" type="button" asChild>
                <Link href={`/pacientes/${patientId}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
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
