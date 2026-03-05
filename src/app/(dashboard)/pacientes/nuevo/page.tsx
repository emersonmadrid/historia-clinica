'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from '@/hooks/useToast'
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

export default function NuevoPacientePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: 'DNI',
      gender: 'MALE',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          bloodType: data.bloodType || undefined,
          maritalStatus: data.maritalStatus || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast({ variant: 'error', title: 'Error al crear el paciente', description: err.error })
        return
      }

      const patient = await res.json()
      toast({ variant: 'success', title: 'Paciente creado correctamente' })
      router.push(`/pacientes/${patient.id}`)
    } catch {
      toast({ variant: 'error', title: 'Error inesperado', description: 'Por favor, intente nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pacientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nuevo Paciente</h2>
          <p className="text-sm text-slate-500">Complete los datos del paciente</p>
        </div>
      </div>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nombre" required error={errors.firstName?.message}>
              <Input placeholder="Nombres" {...register('firstName')} />
            </FormField>

            <FormField label="Apellido" required error={errors.lastName?.message}>
              <Input placeholder="Apellidos" {...register('lastName')} />
            </FormField>

            <FormField label="Tipo de Documento" required error={errors.documentType?.message}>
              <Select
                defaultValue="DNI"
                onValueChange={(v) => setValue('documentType', v as FormData['documentType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Select
                defaultValue="MALE"
                onValueChange={(v) => setValue('gender', v as FormData['gender'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Masculino</SelectItem>
                  <SelectItem value="FEMALE">Femenino</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Estado Civil" error={errors.maritalStatus?.message}>
              <Select onValueChange={(v) => setValue('maritalStatus', v as FormData['maritalStatus'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
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
              <Select onValueChange={(v) => setValue('bloodType', v as FormData['bloodType'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
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

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de Contacto</CardTitle>
          </CardHeader>
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

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacto de Emergencia</CardTitle>
          </CardHeader>
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

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Observaciones adicionales sobre el paciente..."
              rows={3}
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href="/pacientes">Cancelar</Link>
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
                Guardar Paciente
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
