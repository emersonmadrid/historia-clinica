export const AI_MODELS = {
  fast: 'llama-3.1-8b-instant',      // CIE-10: bajo costo, respuesta rápida
  smart: 'llama-3.3-70b-versatile',  // SOAP y briefing: mayor razonamiento
} as const

export const AI_PROMPTS = {
  cie10: `Eres un experto en codificación CIE-10 para el contexto médico peruano.
Dado un texto clínico, devuelve hasta 4 sugerencias de diagnósticos CIE-10.
Formato de respuesta OBLIGATORIO — solo este JSON array, nada más:
[{"code":"I10","description":"Hipertensión esencial"},{"code":"I11.9","description":"Cardiopatía hipertensiva"}]
Sin texto antes ni después, sin markdown, sin bloques de código.`,

  soap: `Eres un médico asistente experto redactando notas clínicas en formato SOAP para el contexto médico peruano.
Dado el motivo de consulta y contexto del paciente, genera un borrador SOAP conciso y profesional.
Formato de respuesta OBLIGATORIO — solo este JSON, nada más:
{"subjective":"...","objective":"...","assessment":"...","plan":"..."}
- Subjective: síntomas referidos por el paciente en tercera persona, máximo 2 oraciones
- Objective: hallazgos esperables al examen físico típicos para el motivo, máximo 2 oraciones
- Assessment: impresión diagnóstica probable, máximo 1 oración
- Plan: indicaciones concretas numeradas, máximo 4 puntos
Sin markdown, sin bloques de código, solo el JSON.`,

  briefing: `Eres un asistente clínico que prepara un briefing rápido para el médico antes de ver al paciente.
Analiza el historial y devuelve un resumen ejecutivo útil y directo.
Formato OBLIGATORIO — solo este JSON, nada más:
{"situation":"...","lastVisit":"...","pending":"...","alerts":"..."}
- situation: estado clínico actual en 1-2 oraciones, lo más relevante
- lastVisit: resumen de la última consulta en 1 oración
- pending: cosas que quedaron pendientes (exámenes, controles, derivaciones) en 1 oración, o vacío si no hay
- alerts: patrones preocupantes como medicamentos incompatibles con alergias, tendencias negativas en 1 oración, o vacío si no hay
Sin markdown, sin bloques de código, solo el JSON.`,
} as const
