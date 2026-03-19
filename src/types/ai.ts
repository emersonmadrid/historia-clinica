export interface CIE10Suggestion {
  code: string
  description: string
}

export interface SOAPDraft {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface PatientBriefing {
  situation: string
  lastVisit: string
  pending: string
  alerts: string
}

export interface GenerateSOAPParams {
  reason: string
  allergies: string[]
  activeConditions: string[]
  currentMedications: string[]
  vitalSigns?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    oxygenSat?: number
  }
}

export interface GenerateBriefingParams {
  patientName: string
  age: number
  gender: string
  allergies: string[]
  activeConditions: string[]
  currentMedications: string[]
  consultations: {
    date: string
    reason: string
    assessment: string | null
    plan: string | null
    diagnoses: string[]
  }[]
}

export interface PrescriptionSuggestion {
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface SuggestPrescriptionsParams {
  diagnoses: string[]
  allergies: string[]
  currentMedications: string[]
  age?: number
}

export interface DailyBriefingPatient {
  name: string
  reason: string
  note: string
  priority: 'high' | 'normal'
}

export interface DailyBriefing {
  summary: string
  patients: DailyBriefingPatient[]
}

export interface ClinicalGuide {
  ask: string[]
  examine: string[]
  consider: string[]
  workup: string[]
}

export interface GenerateClinicalGuideParams {
  reason: string
  allergies: string[]
  activeConditions: string[]
  currentMedications: string[]
  specialty?: string
}

export interface GenerateAssessmentPlanParams {
  reason: string
  diagnoses: string[]
  vitalSigns: Record<string, string | number | null>
  allergies: string[]
  activeConditions: string[]
  currentMedications: string[]
  age?: number
}

export interface GenerateDailyBriefingParams {
  doctorName: string
  patients: Array<{
    name: string
    reason: string
    activeConditions: string[]
    allergies: string[]
    daysSinceLastVisit: number | null
  }>
}
