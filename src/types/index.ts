import {
  User,
  Patient,
  ClinicalRecord,
  VitalSigns,
  Diagnosis,
  Allergy,
  MedicalBackground,
  Appointment,
  Role,
  Gender,
  DocumentType,
  BloodType,
  MaritalStatus,
  DiagnosisType,
  DiagnosisStatus,
  AllergySeverity,
  BackgroundType,
  AppointmentStatus,
} from '@prisma/client'

export type {
  User,
  Patient,
  ClinicalRecord,
  VitalSigns,
  Diagnosis,
  Allergy,
  MedicalBackground,
  Appointment,
  Role,
  Gender,
  DocumentType,
  BloodType,
  MaritalStatus,
  DiagnosisType,
  DiagnosisStatus,
  AllergySeverity,
  BackgroundType,
  AppointmentStatus,
}

export type PatientWithRelations = Patient & {
  clinicalRecords?: ClinicalRecordWithRelations[]
  appointments?: Appointment[]
  allergies?: Allergy[]
  medicalBackgrounds?: MedicalBackground[]
}

export type ClinicalRecordWithRelations = ClinicalRecord & {
  patient?: Patient
  doctor?: User
  vitalSigns?: VitalSigns | null
  diagnoses?: Diagnosis[]
}

export type AppointmentWithRelations = Appointment & {
  patient?: Patient
  doctor?: User
}

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  speciality?: string | null
}

export type DashboardStats = {
  totalPatients: number
  todayAppointments: number
  recentConsultations: number
  pendingAppointments: number
}
