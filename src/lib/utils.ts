import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, pattern = 'dd/MM/yyyy') {
  return format(new Date(date), pattern, { locale: es })
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

export function calculateAge(birthDate: Date | string): number {
  return differenceInYears(new Date(), new Date(birthDate))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function bloodTypeLabel(bloodType: string): string {
  const map: Record<string, string> = {
    A_POS: 'A+',
    A_NEG: 'A-',
    B_POS: 'B+',
    B_NEG: 'B-',
    AB_POS: 'AB+',
    AB_NEG: 'AB-',
    O_POS: 'O+',
    O_NEG: 'O-',
  }
  return map[bloodType] || bloodType
}

export function genderLabel(gender: string): string {
  const map: Record<string, string> = {
    MALE: 'Masculino',
    FEMALE: 'Femenino',
    OTHER: 'Otro',
  }
  return map[gender] || gender
}

export function maritalStatusLabel(status: string): string {
  const map: Record<string, string> = {
    SINGLE: 'Soltero/a',
    MARRIED: 'Casado/a',
    DIVORCED: 'Divorciado/a',
    WIDOWED: 'Viudo/a',
    COHABITANT: 'Conviviente',
  }
  return map[status] || status
}

export function documentTypeLabel(type: string): string {
  const map: Record<string, string> = {
    DNI: 'DNI',
    CE: 'Carné de Extranjería',
    PASSPORT: 'Pasaporte',
    RUC: 'RUC',
  }
  return map[type] || type
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN: 'Administrador',
    DOCTOR: 'Doctor/a',
    NURSE: 'Enfermero/a',
    RECEPTIONIST: 'Recepcionista',
  }
  return map[role] || role
}

export function appointmentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'Agendada',
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
    NO_SHOW: 'No asistió',
  }
  return map[status] || status
}

export function diagnosisStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Activo',
    RESOLVED: 'Resuelto',
    CHRONIC: 'Crónico',
  }
  return map[status] || status
}

export function severityLabel(severity: string): string {
  const map: Record<string, string> = {
    MILD: 'Leve',
    MODERATE: 'Moderado',
    SEVERE: 'Grave',
  }
  return map[severity] || severity
}

export function backgroundTypeLabel(type: string): string {
  const map: Record<string, string> = {
    PERSONAL: 'Personal',
    FAMILY: 'Familiar',
    SURGICAL: 'Quirúrgico',
    PHARMACOLOGICAL: 'Farmacológico',
    OBSTETRIC: 'Obstétrico',
  }
  return map[type] || type
}
