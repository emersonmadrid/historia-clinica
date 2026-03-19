import { z } from 'zod'
import { prescriptionItemSchema } from '@/features/prescriptions/schemas'

export const vitalSignsSchema = z.object({
  height: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  bmi: z.number().optional().nullable(),
  temperature: z.number().optional().nullable(),
  bloodPressureSys: z.number().int().optional().nullable(),
  bloodPressureDia: z.number().int().optional().nullable(),
  heartRate: z.number().int().optional().nullable(),
  oxygenSat: z.number().optional().nullable(),
  respiratoryRate: z.number().int().optional().nullable(),
  glucoseLevel: z.number().optional().nullable(),
})

export const diagnosisSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  type: z.enum(['PRIMARY', 'SECONDARY', 'COMPLICATION']).default('PRIMARY'),
  status: z.enum(['ACTIVE', 'RESOLVED', 'CHRONIC']).default('ACTIVE'),
  notes: z.string().optional().nullable(),
})

export const prescriptionInConsultationSchema = z.object({
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1),
})

export const createConsultationSchema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  reason: z.string().min(1, 'Motivo de consulta requerido'),
  subjective: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  assessment: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  noteTemplate: z.enum(['SOAP', 'PSYCHOLOGY', 'NUTRITION']).optional().default('SOAP'),
  vitalSigns: vitalSignsSchema.optional(),
  diagnoses: z.array(diagnosisSchema).optional(),
  prescriptions: z.array(prescriptionInConsultationSchema).optional(),
})

export const createReferralSchema = z.object({
  patientId: z.string().min(1),
  toSpecialty: z.enum(['GENERAL_MEDICINE', 'PSYCHOLOGY', 'PSYCHIATRY', 'NUTRITION', 'PHYSIOTHERAPY', 'OTHER']),
  reason: z.string().min(1, 'Motivo de derivación requerido'),
  urgency: z.enum(['ROUTINE', 'PRIORITY', 'URGENT']).default('ROUTINE'),
  notes: z.string().optional().nullable(),
  toDoctorId: z.string().optional().nullable(),
  consultationId: z.string().optional().nullable(),
})

export const updateReferralSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional().nullable(),
})
