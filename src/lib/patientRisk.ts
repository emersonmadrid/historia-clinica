import { getVitalStatus } from './vitalSignsThresholds'

export type RiskLevel = 'bajo' | 'moderado' | 'alto' | 'critico'

export interface RiskInput {
  age: number
  activeDiagnosesCount: number
  chronicDiagnosesCount: number
  severeAllergiesCount: number
  lastVitalSigns?: {
    bloodPressureSys?: number | null
    bloodPressureDia?: number | null
    heartRate?: number | null
    temperature?: number | null
    oxygenSat?: number | null
    glucoseLevel?: number | null
  } | null
  daysSinceLastVisit?: number | null
}

export interface RiskResult {
  level: RiskLevel
  score: number
  reasons: string[]
}

export function calculatePatientRisk(input: RiskInput): RiskResult {
  let score = 0
  const reasons: string[] = []

  // Age
  if (input.age >= 80) { score += 3; reasons.push('Edad ≥80 años') }
  else if (input.age >= 65) { score += 2; reasons.push('Edad ≥65 años') }
  else if (input.age >= 50) score += 1

  // Chronic diagnoses
  if (input.chronicDiagnosesCount >= 3) {
    score += 3
    reasons.push(`${input.chronicDiagnosesCount} condiciones crónicas`)
  } else if (input.chronicDiagnosesCount === 2) {
    score += 2
    reasons.push('2 condiciones crónicas')
  } else if (input.chronicDiagnosesCount === 1) {
    score += 1
  }

  // Active non-chronic diagnoses
  const acuteActive = Math.max(0, input.activeDiagnosesCount - input.chronicDiagnosesCount)
  if (acuteActive >= 4) { score += 2; reasons.push(`${acuteActive} diagnósticos activos`) }
  else if (acuteActive >= 2) score += 1

  // Severe allergies
  if (input.severeAllergiesCount > 0) {
    score += 1
    reasons.push(`${input.severeAllergiesCount} alergia(s) severa(s)`)
  }

  // Vital signs
  if (input.lastVitalSigns) {
    const checks = [
      { key: 'bloodPressureSys', val: input.lastVitalSigns.bloodPressureSys, label: 'PA sistólica' },
      { key: 'bloodPressureDia', val: input.lastVitalSigns.bloodPressureDia, label: 'PA diastólica' },
      { key: 'heartRate', val: input.lastVitalSigns.heartRate, label: 'FC' },
      { key: 'temperature', val: input.lastVitalSigns.temperature, label: 'Temperatura' },
      { key: 'oxygenSat', val: input.lastVitalSigns.oxygenSat, label: 'SpO2' },
      { key: 'glucoseLevel', val: input.lastVitalSigns.glucoseLevel, label: 'Glucosa' },
    ]
    for (const { key, val, label } of checks) {
      const status = getVitalStatus(key, val)
      if (status === 'critical') { score += 3; reasons.push(`${label} crítico/a`) }
      else if (status === 'warning') { score += 1; reasons.push(`${label} alterado/a`) }
    }
  }

  // Lack of follow-up for high-risk patients
  if (
    input.daysSinceLastVisit !== null &&
    input.daysSinceLastVisit !== undefined &&
    input.daysSinceLastVisit > 365 &&
    (input.chronicDiagnosesCount > 0 || input.age >= 65)
  ) {
    score += 1
    reasons.push('Sin control en >1 año')
  }

  let level: RiskLevel
  if (score >= 8) level = 'critico'
  else if (score >= 5) level = 'alto'
  else if (score >= 3) level = 'moderado'
  else level = 'bajo'

  return { level, score, reasons }
}
