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
