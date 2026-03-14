import { z } from 'zod'

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  doctorId: z.string().min(1, 'Doctor requerido'),
  dateTime: z.string().min(1, 'Fecha y hora requerida'),
  duration: z.number().int().min(15).max(120).default(30),
  reason: z.string().min(1, 'Motivo requerido'),
  notes: z.string().optional().nullable(),
})
