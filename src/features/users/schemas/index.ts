import { z } from 'zod'

const SPECIALTY_ENUM = z.enum(['GENERAL_MEDICINE', 'PSYCHOLOGY', 'PSYCHIATRY', 'NUTRITION', 'PHYSIOTHERAPY', 'OTHER'])

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']),
  specialty: SPECIALTY_ENUM.optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']).optional(),
  specialty: SPECIALTY_ENUM.optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
})
