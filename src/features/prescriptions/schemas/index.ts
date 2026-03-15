import { z } from 'zod'

export const prescriptionItemSchema = z.object({
  medication: z.string().min(1, 'Nombre del medicamento requerido'),
  dosage: z.string().min(1, 'Dosis requerida'),
  frequency: z.string().min(1, 'Frecuencia requerida'),
  duration: z.string().min(1, 'Duración requerida'),
  quantity: z.string().optional(),
  instructions: z.string().optional(),
})

export const createPrescriptionSchema = z.object({
  consultationId: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'Debe agregar al menos un medicamento'),
})

export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>
