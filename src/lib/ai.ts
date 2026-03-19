import Groq from 'groq-sdk'
import { AI_MODELS, AI_PROMPTS, getClinicalGuidePrompt } from './ai.config'
import type {
  CIE10Suggestion,
  SOAPDraft,
  PatientBriefing,
  GenerateSOAPParams,
  GenerateBriefingParams,
  PrescriptionSuggestion,
  SuggestPrescriptionsParams,
  DailyBriefing,
  GenerateDailyBriefingParams,
  ClinicalGuide,
  GenerateClinicalGuideParams,
  GenerateAssessmentPlanParams,
} from '@/types/ai'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })
}

function parseJSON<T>(raw: string, fallback: T): T {
  try {
    const clean = raw
      .trim()
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
    return JSON.parse(clean)
  } catch {
    return fallback
  }
}

export async function suggestCIE10(text: string): Promise<CIE10Suggestion[]> {
  const completion = await getGroq().chat.completions.create({
    model: AI_MODELS.fast,
    temperature: 0,
    max_tokens: 300,
    messages: [
      { role: 'system', content: AI_PROMPTS.cie10 },
      { role: 'user', content: text.trim() },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '[]'
  const parsed = parseJSON<CIE10Suggestion[]>(raw, [])
  return Array.isArray(parsed) ? parsed : []
}

export async function generateSOAP(params: GenerateSOAPParams): Promise<SOAPDraft> {
  const context = [
    params.allergies.length > 0 ? `Alergias: ${params.allergies.join(', ')}` : null,
    params.activeConditions.length > 0 ? `Condiciones activas: ${params.activeConditions.join(', ')}` : null,
    params.currentMedications.length > 0 ? `Medicación actual: ${params.currentMedications.join(', ')}` : null,
    params.vitalSigns?.bloodPressure ? `PA: ${params.vitalSigns.bloodPressure} mmHg` : null,
    params.vitalSigns?.heartRate ? `FC: ${params.vitalSigns.heartRate} lpm` : null,
    params.vitalSigns?.temperature ? `Temp: ${params.vitalSigns.temperature}°C` : null,
    params.vitalSigns?.oxygenSat ? `SpO2: ${params.vitalSigns.oxygenSat}%` : null,
  ].filter(Boolean).join('\n')

  const completion = await getGroq().chat.completions.create({
    model: AI_MODELS.smart,
    temperature: 0.3,
    max_tokens: 800,
    messages: [
      { role: 'system', content: AI_PROMPTS.soap },
      {
        role: 'user',
        content: `Motivo de consulta: ${params.reason}${context ? `\n\nContexto del paciente:\n${context}` : ''}`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const parsed = parseJSON<SOAPDraft>(raw, { subjective: '', objective: '', assessment: '', plan: '' })
  return {
    subjective: parsed.subjective ?? '',
    objective: parsed.objective ?? '',
    assessment: parsed.assessment ?? '',
    plan: parsed.plan ?? '',
  }
}

export async function generateClinicalGuide(params: GenerateClinicalGuideParams): Promise<ClinicalGuide> {
  const context = [
    params.allergies.length > 0 ? `Alergias: ${params.allergies.join(', ')}` : null,
    params.activeConditions.length > 0 ? `Condiciones activas: ${params.activeConditions.join(', ')}` : null,
    params.currentMedications.length > 0 ? `Medicación actual: ${params.currentMedications.join(', ')}` : null,
  ].filter(Boolean).join('\n')

  const completion = await getGroq().chat.completions.create({
    model: AI_MODELS.smart,
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      { role: 'system', content: getClinicalGuidePrompt(params.specialty ?? '') },
      { role: 'user', content: `Motivo: ${params.reason}${context ? `\n\nContexto del paciente:\n${context}` : ''}` },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const parsed = parseJSON<ClinicalGuide>(raw, { ask: [], examine: [], consider: [], workup: [] })
  return {
    ask: Array.isArray(parsed.ask) ? parsed.ask : [],
    examine: Array.isArray(parsed.examine) ? parsed.examine : [],
    consider: Array.isArray(parsed.consider) ? parsed.consider : [],
    workup: Array.isArray(parsed.workup) ? parsed.workup : [],
  }
}

export async function generateAssessmentPlan(
  params: GenerateAssessmentPlanParams
): Promise<Pick<SOAPDraft, 'assessment' | 'plan'>> {
  // Solo datos estructurados y validados — nunca texto libre del médico
  const vitals = Object.entries(params.vitalSigns)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  const lines = [
    `Motivo: ${params.reason}`,
    params.diagnoses.length > 0 ? `Diagnósticos considerados: ${params.diagnoses.join(', ')}` : null,
    vitals ? `Signos vitales: ${vitals}` : null,
    params.activeConditions.length > 0 ? `Condiciones activas del paciente: ${params.activeConditions.join(', ')}` : null,
    params.allergies.length > 0 ? `Alergias: ${params.allergies.join(', ')}` : null,
    params.currentMedications.length > 0 ? `Medicación actual: ${params.currentMedications.join(', ')}` : null,
    params.age ? `Edad del paciente: ${params.age} años` : null,
  ].filter(Boolean).join('\n')

  const completion = await getGroq().chat.completions.create({
    model: AI_MODELS.smart,
    temperature: 0.3,
    max_tokens: 500,
    messages: [
      { role: 'system', content: AI_PROMPTS.assessmentPlan },
      { role: 'user', content: lines },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const parsed = parseJSON<{ assessment: string; plan: string }>(raw, { assessment: '', plan: '' })
  return {
    assessment: parsed.assessment ?? '',
    plan: parsed.plan ?? '',
  }
}

export async function suggestPrescriptions(params: SuggestPrescriptionsParams): Promise<PrescriptionSuggestion[]> {
  const context = [
    `Diagnósticos: ${params.diagnoses.join(', ')}`,
    params.allergies.length > 0 ? `Alergias conocidas (NO recetar): ${params.allergies.join(', ')}` : null,
    params.currentMedications.length > 0 ? `Ya toma: ${params.currentMedications.join(', ')}` : null,
    params.age ? `Edad: ${params.age} años` : null,
  ].filter(Boolean).join('\n')

  const completion = await getGroq().chat.completions.create({
    model: AI_MODELS.smart,
    temperature: 0.2,
    max_tokens: 500,
    messages: [
      { role: 'system', content: AI_PROMPTS.prescriptions },
      { role: 'user', content: context },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '[]'
  const parsed = parseJSON<PrescriptionSuggestion[]>(raw, [])
  return Array.isArray(parsed) ? parsed.slice(0, 3) : []
}

export async function generateDailyBriefing(params: GenerateDailyBriefingParams): Promise<DailyBriefing> {
  if (params.patients.length === 0) {
    return { summary: `Sin pacientes programados para hoy, ${params.doctorName}.`, patients: [] }
  }

  const patientsContext = params.patients.map((p, i) =>
    [
      `Paciente ${i + 1}: ${p.name}`,
      `Motivo: ${p.reason}`,
      p.activeConditions.length > 0 ? `Condiciones: ${p.activeConditions.join(', ')}` : null,
      p.allergies.length > 0 ? `Alergias: ${p.allergies.join(', ')}` : null,
      p.daysSinceLastVisit !== null ? `Última visita: hace ${p.daysSinceLastVisit} días` : 'Primera consulta',
    ].filter(Boolean).join('. ')
  ).join('\n')

  const completion = await getGroq().chat.completions.create({
    model: AI_MODELS.smart,
    temperature: 0.3,
    max_tokens: 600,
    messages: [
      { role: 'system', content: AI_PROMPTS.dailyBriefing },
      { role: 'user', content: `Doctor: ${params.doctorName}\n\nPacientes de hoy:\n${patientsContext}` },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const parsed = parseJSON<DailyBriefing>(raw, { summary: '', patients: [] })
  return {
    summary: parsed.summary ?? '',
    patients: Array.isArray(parsed.patients) ? parsed.patients : [],
  }
}

export async function generateBriefing(params: GenerateBriefingParams): Promise<PatientBriefing> {
  const lastConsultations = params.consultations.slice(0, 5).map((c, i) =>
    `Consulta ${i + 1} (${c.date}): Motivo: ${c.reason}.${c.diagnoses.length > 0 ? ` Dx: ${c.diagnoses.join(', ')}.` : ''}${c.plan ? ` Plan: ${c.plan}` : ''}`
  ).join('\n')

  const context = [
    `Paciente: ${params.patientName}, ${params.age} años, ${params.gender}`,
    params.allergies.length > 0 ? `Alergias: ${params.allergies.join(', ')}` : null,
    params.activeConditions.length > 0 ? `Condiciones activas: ${params.activeConditions.join(', ')}` : null,
    params.currentMedications.length > 0 ? `Medicación actual: ${params.currentMedications.join(', ')}` : null,
    params.consultations.length > 0 ? `\nÚltimas consultas:\n${lastConsultations}` : 'Sin consultas previas',
  ].filter(Boolean).join('\n')

  const completion = await getGroq().chat.completions.create({
    model: AI_MODELS.smart,
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      { role: 'system', content: AI_PROMPTS.briefing },
      { role: 'user', content: context },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const parsed = parseJSON<PatientBriefing>(raw, { situation: '', lastVisit: '', pending: '', alerts: '' })
  return {
    situation: parsed.situation ?? '',
    lastVisit: parsed.lastVisit ?? '',
    pending: parsed.pending ?? '',
    alerts: parsed.alerts ?? '',
  }
}
