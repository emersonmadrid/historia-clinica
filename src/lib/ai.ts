import Groq from 'groq-sdk'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })
}

export async function suggestCIE10(text: string): Promise<{ code: string; description: string }[]> {
  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0,
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: `Eres un experto en codificación CIE-10 para el contexto médico peruano.
Dado un texto clínico, devuelve hasta 4 sugerencias de diagnósticos CIE-10.
Formato de respuesta OBLIGATORIO — solo este JSON array, nada más:
[{"code":"I10","description":"Hipertensión esencial"},{"code":"I11.9","description":"Cardiopatía hipertensiva"}]
Sin texto antes ni después, sin markdown, sin bloques de código.`,
      },
      { role: 'user', content: text.trim() },
    ],
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? '[]'
  const clean = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(clean)
  return Array.isArray(parsed) ? parsed : []
}

export interface SOAPDraft {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export async function generateSOAP(params: {
  reason: string
  allergies: string[]
  activeConditions: string[]
  currentMedications: string[]
  vitalSigns?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    oxygenSat?: number
    weight?: number
    height?: number
  }
}): Promise<SOAPDraft> {
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
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 800,
    messages: [
      {
        role: 'system',
        content: `Eres un médico asistente experto redactando notas clínicas en formato SOAP para el contexto médico peruano.
Dado el motivo de consulta y contexto del paciente, genera un borrador SOAP conciso y profesional.
Formato de respuesta OBLIGATORIO — solo este JSON, nada más:
{"subjective":"...","objective":"...","assessment":"...","plan":"..."}
- Subjective: síntomas referidos por el paciente en tercera persona, máximo 2 oraciones
- Objective: hallazgos esperables al examen físico típicos para el motivo, máximo 2 oraciones
- Assessment: impresión diagnóstica probable, máximo 1 oración
- Plan: indicaciones concretas numeradas, máximo 4 puntos
Sin markdown, sin bloques de código, solo el JSON.`,
      },
      {
        role: 'user',
        content: `Motivo de consulta: ${params.reason}${context ? `\n\nContexto del paciente:\n${context}` : ''}`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
  const clean = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(clean)
  return {
    subjective: parsed.subjective ?? '',
    objective: parsed.objective ?? '',
    assessment: parsed.assessment ?? '',
    plan: parsed.plan ?? '',
  }
}
