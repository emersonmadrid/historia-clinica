export interface VitalRange {
  warning: { low?: number; high?: number }
  critical: { low?: number; high?: number }
  unit: string
  label: string
}

export const VITAL_THRESHOLDS: Record<string, VitalRange> = {
  bloodPressureSys: {
    warning: { low: 90, high: 140 },
    critical: { low: 80, high: 180 },
    unit: 'mmHg',
    label: 'PA Sistólica',
  },
  bloodPressureDia: {
    warning: { low: 60, high: 90 },
    critical: { low: 50, high: 120 },
    unit: 'mmHg',
    label: 'PA Diastólica',
  },
  heartRate: {
    warning: { low: 60, high: 100 },
    critical: { low: 40, high: 130 },
    unit: 'lpm',
    label: 'Frecuencia Cardíaca',
  },
  temperature: {
    warning: { low: 36.0, high: 37.5 },
    critical: { low: 35.0, high: 39.0 },
    unit: '°C',
    label: 'Temperatura',
  },
  oxygenSat: {
    warning: { low: 95 },
    critical: { low: 90 },
    unit: '%',
    label: 'SpO2',
  },
  glucoseLevel: {
    warning: { low: 70, high: 140 },
    critical: { low: 50, high: 250 },
    unit: 'mg/dL',
    label: 'Glucosa',
  },
  respiratoryRate: {
    warning: { low: 12, high: 20 },
    critical: { low: 8, high: 30 },
    unit: 'rpm',
    label: 'Frecuencia Respiratoria',
  },
}

export type VitalStatus = 'normal' | 'warning' | 'critical'

export function getVitalStatus(key: string, value: number | null | undefined): VitalStatus {
  if (value == null) return 'normal'
  const range = VITAL_THRESHOLDS[key]
  if (!range) return 'normal'

  const { critical, warning } = range
  if (
    (critical.low !== undefined && value < critical.low) ||
    (critical.high !== undefined && value > critical.high)
  )
    return 'critical'
  if (
    (warning.low !== undefined && value < warning.low) ||
    (warning.high !== undefined && value > warning.high)
  )
    return 'warning'
  return 'normal'
}

export function getCriticalVitals(vitalSigns: {
  bloodPressureSys?: number | null
  bloodPressureDia?: number | null
  heartRate?: number | null
  temperature?: number | null
  oxygenSat?: number | null
  glucoseLevel?: number | null
  respiratoryRate?: number | null
}): Array<{ key: string; value: number; status: VitalStatus; label: string; unit: string }> {
  const result = []
  for (const [key, value] of Object.entries(vitalSigns)) {
    if (value == null) continue
    const status = getVitalStatus(key, value as number)
    if (status !== 'normal') {
      result.push({
        key,
        value: value as number,
        status,
        label: VITAL_THRESHOLDS[key]?.label ?? key,
        unit: VITAL_THRESHOLDS[key]?.unit ?? '',
      })
    }
  }
  return result
}
