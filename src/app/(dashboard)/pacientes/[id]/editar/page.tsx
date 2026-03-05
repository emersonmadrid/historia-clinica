'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Save } from 'lucide-react'
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

const schema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  documentType: z.enum(['DNI', 'CE', 'PASSPORT', 'RUC']),
  documentNumber: z.string().min(1, 'Número de documento requerido'),
  birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  bloodType: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG', '']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'COHABITANT', '']).optional(),
  occupation: z.string().optional(),
  insuranceNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRel: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function EditarPacientePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    fetch(`/api/pacientes/${id}`)
      .then((r) => r.json())
      .then((patient) => {
        if (patient.error) { setLoadError(patient.error); return }
        reset({
          firstName: patient.firstName ?? '',
          lastName: patient.lastName ?? '',
          documentType: patient.documentType ?? 'DNI',
          documentNumber: patient.documentNumber ?? '',
          birthDate: patient.birthDate ? format(new Date(patient.birthDate), 'yyyy-MM-dd') : '',
          gender: patient.gender ?? 'MALE',
          phone: patient.phone ?? '',
          email: patient.email ?? '',
          address: patient.address ?? '',
          city: patient.city ?? '',
          bloodType: patient.bloodType ?? '',
          maritalStatus: patient.maritalStatus ?? '',
          occupation: patient.occupation ?? '',
          insuranceNumber: patient.insuranceNumber ?? '',
          emergencyContactName: patient.emergencyContactName ?? '',
          emergencyContactPhone: patient.emergencyContactPhone ?? '',
          emergencyContactRel: patient.emergencyContactRel ?? '',
          notes: patient.notes ?? '',
        })
      })
      .catch(() => setLoadError('No se pudo cargar el paciente'))
  }, [id, reset])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/pacientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          bloodType: data.bloodType || null,
          maritalStatus: data.maritalStatus || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast({ variant: 'error', title: 'Error al guardar', description: err.error })
        return
      }
      toast({ variant: 'success', title: 'Paciente actualizado correctamente' })
      router.push(`/pacientes/${id}`)
    } catch {
      toast({ variant: 'error', title: 'Error inesperado', description: 'Intente nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {loadError}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb items={[
        { label: 'Pacientes', href: '/pacientes' },
        { label: 'Perfil', href: `/pacientes/${id}` },
        { label: 'Editar' },
      ]} />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/pacientes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Editar Paciente</h2>
          <p className="text-sm text-slate-500">Modifica los datos del paciente</p>
        </div>
      </div>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos Personales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nombre" required error={errors.firstName?.message}>
              <Input placeholder="Nombres" {...register('firstName')} />
            </FormField>
            <FormField label="Apellido" required error={errors.lastName?.message}>
              <Input placeholder="Apellidos" {...register('lastName')} />
            </FormField>
            <FormField label="Tipo de Documento" required error={errors.documentType?.message}>
              <Select value={watch('documentType')} onValueChange={(v) => setValue('documentType', v as FormData['documentType'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="CE">Carné de Extranjería</SelectItem>
                  <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                  <SelectItem value="RUC">RUC</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Número de Documento" required error={errors.documentNumber?.message}>
              <Input placeholder="12345678" {...register('documentNumber')} />
            </FormField>
            <FormField label="Fecha de Nacimiento" required error={errors.birthDate?.message}>
              <Input type="date" {...register('birthDate')} />
            </FormField>
            <FormField label="Género" required error={errors.gender?.message}>
              <Select value={watch('gender')} onValueChange={(v) => setValue('gender', v as FormData['gender'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Masculino</SelectItem>
                  <SelectItem value="FEMALE">Femenino</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Estado Civil" error={errors.maritalStatus?.message}>
              <Select value={watch('maritalStatus') ?? ''} onValueChange={(v) => setValue('maritalStatus', v as FormData['maritalStatus'])}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Soltero/a</SelectItem>
                  <SelectItem value="MARRIED">Casado/a</SelectItem>
                  <SelectItem value="DIVORCED">Divorciado/a</SelectItem>
                  <SelectItem value="WIDOWED">Viudo/a</SelectItem>
                  <SelectItem value="COHABITANT">Conviviente</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Grupo Sanguíneo" error={errors.bloodType?.message}>
              <Select value={watch('bloodType') ?? ''} onValueChange={(v) => setValue('bloodType', v as FormData['bloodType'])}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A_POS">A+</SelectItem>
                  <SelectItem value="A_NEG">A-</SelectItem>
                  <SelectItem value="B_POS">B+</SelectItem>
                  <SelectItem value="B_NEG">B-</SelectItem>
                  <SelectItem value="AB_POS">AB+</SelectItem>
                  <SelectItem value="AB_NEG">AB-</SelectItem>
                  <SelectItem value="O_POS">O+</SelectItem>
                  <SelectItem value="O_NEG">O-</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Ocupación" error={errors.occupation?.message}>
              <Input placeholder="Ej: Docente, Comerciante..." {...register('occupation')} />
            </FormField>
            <FormField label="N° Seguro/SIS" error={errors.insuranceNumber?.message}>
              <Input placeholder="Número de seguro" {...register('insuranceNumber')} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Datos de Contacto</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Teléfono" error={errors.phone?.message}>
              <Input placeholder="+51 999 999 999" {...register('phone')} />
            </FormField>
            <FormField label="Correo Electrónico" error={errors.email?.message}>
              <Input type="email" placeholder="correo@ejemplo.com" {...register('email')} />
            </FormField>
            <FormField label="Dirección" error={errors.address?.message}>
              <Input placeholder="Av. Principal 123" {...register('address')} />
            </FormField>
            <FormField label="Ciudad" error={errors.city?.message}>
              <Input placeholder="Lima" {...register('city')} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contacto de Emergencia</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Nombre" error={errors.emergencyContactName?.message}>
              <Input placeholder="Nombre completo" {...register('emergencyContactName')} />
            </FormField>
            <FormField label="Teléfono" error={errors.emergencyContactPhone?.message}>
              <Input placeholder="+51 999 999 999" {...register('emergencyContactPhone')} />
            </FormField>
            <FormField label="Parentesco" error={errors.emergencyContactRel?.message}>
              <Input placeholder="Ej: Esposo/a, Hijo/a" {...register('emergencyContactRel')} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Notas Adicionales</CardTitle></CardHeader>
          <CardContent>
            <Textarea placeholder="Observaciones adicionales..." rows={3} {...register('notes')} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href={`/pacientes/${id}`}>Cancelar</Link>
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
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
