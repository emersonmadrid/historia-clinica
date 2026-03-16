import Groq from 'groq-sdk'
import { AI_MODELS, AI_PROMPTS } from './ai.config'
import type {
  CIE10Suggestion,
  SOAPDraft,
  PatientBriefing,
  GenerateSOAPParams,
  GenerateBriefingParams,
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
