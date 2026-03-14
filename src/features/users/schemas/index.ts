import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']),
  speciality: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']).optional(),
  speciality: z.string().optional().nullable(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
})
