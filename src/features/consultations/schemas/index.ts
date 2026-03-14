import { z } from 'zod'

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

export const createConsultationSchema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  reason: z.string().min(1, 'Motivo de consulta requerido'),
  subjective: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  assessment: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  vitalSigns: vitalSignsSchema.optional(),
  diagnoses: z.array(diagnosisSchema).optional(),
})
