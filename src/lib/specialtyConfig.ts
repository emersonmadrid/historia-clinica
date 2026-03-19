/**
 * Specialty Configuration
 *
 * Each specialty defines its own consultation workflow — sections, fields,
 * and behavior — following the approach used by major clinical SaaS platforms.
 */

export type SpecialtyKey =
  | 'GENERAL_MEDICINE'
  | 'PSYCHOLOGY'
  | 'PSYCHIATRY'
  | 'NUTRITION'
  | 'PHYSIOTHERAPY'
  | 'OTHER'

export type NoteTemplateKey = 'SOAP' | 'PSYCHOLOGY' | 'NUTRITION' | 'PHYSIOTHERAPY'

export interface SoapSection {
  /** Display label shown in the form (e.g. "S — Subjetivo") */
  label: string
  /** Short abbreviation used in badges/display (e.g. "S") */
  abbr: string
  /** Placeholder text for the textarea */
  placeholder: string
  /** Tooltip / helper hint shown below the label */
  hint: string
}

export interface VitalsConfig {
  /** Which vital fields to show in the primary row */
  primary: ('bp' | 'heartRate' | 'temperature' | 'oxygenSat' | 'weight' | 'glucose')[]
  /** Which vital fields to show in the expanded section */
  expanded: ('respiratoryRate' | 'height' | 'bmi')[]
}

export interface SpecialtyConfig {
  /** Display name */
  label: string
  /** Which note template to persist in DB */
  noteTemplate: NoteTemplateKey
  /** Badge shown on consultation card (color, label, icon name) */
  badge: {
    color: string        // Tailwind color classes for bg/text/border
    label: string
  }
  /** SOAP/equivalent section definitions */
  sections: {
    s: SoapSection
    o: SoapSection
    a: SoapSection
    p: SoapSection
  }
  /** Vital signs configuration — null means hide the section */
  vitals: VitalsConfig | null
  /** Whether to show prescriptions section */
  showPrescriptions: boolean
  /** Whether to show CIE-10 diagnosis section */
  showDiagnoses: boolean
  /** Session type options (for mental health specialties) */
  sessionTypes: { value: string; label: string }[] | null
  /** Notes section label */
  notesLabel: string
  /** AI clinical guide adapts based on this system hint */
  aiSpecialtyHint: string
  /** Labels for the 4 columns of the AI clinical guide */
  guideLabels: { ask: string; examine: string; consider: string; workup: string }
}

// ── Configurations per specialty ─────────────────────────────────────────────

export const SPECIALTY_CONFIGS: Record<SpecialtyKey, SpecialtyConfig> = {

  GENERAL_MEDICINE: {
    label: 'Medicina General',
    noteTemplate: 'SOAP',
    badge: { color: 'bg-teal-500/10 text-teal-700 border-teal-500/20', label: 'Medicina General' },
    sections: {
      s: {
        label: 'S — Subjetivo',
        abbr: 'S',
        placeholder: 'Motivo de consulta, síntomas principales, historia de la enfermedad actual...',
        hint: 'Lo que refiere el paciente: síntomas, inicio, evolución, factores desencadenantes',
      },
      o: {
        label: 'O — Objetivo',
        abbr: 'O',
        placeholder: 'Examen físico, hallazgos, resultados de laboratorio o imágenes...',
        hint: 'Hallazgos observables: examen físico, signos vitales relevantes, laboratorio',
      },
      a: {
        label: 'A — Evaluación',
        abbr: 'A',
        placeholder: 'Diagnóstico presuntivo o definitivo, razonamiento clínico...',
        hint: 'Impresión diagnóstica y razonamiento clínico',
      },
      p: {
        label: 'P — Plan',
        abbr: 'P',
        placeholder: 'Tratamiento, indicaciones, derivaciones, próxima cita...',
        hint: 'Acciones a tomar: medicamentos, indicaciones, seguimiento',
      },
    },
    vitals: {
      primary: ['bp', 'heartRate', 'temperature', 'oxygenSat', 'weight', 'glucose'],
      expanded: ['respiratoryRate', 'height', 'bmi'],
    },
    showPrescriptions: true,
    showDiagnoses: true,
    sessionTypes: null,
    notesLabel: 'Notas clínicas adicionales',
    aiSpecialtyHint: 'medicina general',
    guideLabels: { ask: 'Preguntar', examine: 'Examinar', consider: 'Considerar', workup: 'Solicitar' },
  },

  PSYCHOLOGY: {
    label: 'Psicología',
    noteTemplate: 'PSYCHOLOGY',
    badge: { color: 'bg-violet-500/10 text-violet-700 border-violet-500/20', label: 'Psicología' },
    sections: {
      s: {
        label: 'M — Motivo e historia',
        abbr: 'M',
        placeholder: 'Motivo de consulta, historia del problema, relato del paciente...',
        hint: 'Relato del paciente, historia del problema actual, antecedentes psicológicos relevantes',
      },
      o: {
        label: 'E — Examen del estado mental',
        abbr: 'E',
        placeholder: 'Aspecto general, orientación, atención, memoria, lenguaje, afecto, pensamiento, conducta...',
        hint: 'Observación conductual y examen del estado mental (orientación, atención, afecto, pensamiento)',
      },
      a: {
        label: 'F — Formulación clínica',
        abbr: 'F',
        placeholder: 'Hipótesis diagnóstica, análisis funcional, factores predisponentes, precipitantes y mantenedores...',
        hint: 'Hipótesis diagnóstica, análisis funcional y formulación del caso',
      },
      p: {
        label: 'I — Intervención y plan',
        abbr: 'I',
        placeholder: 'Técnicas aplicadas en sesión, tareas asignadas, objetivos terapéuticos, frecuencia de sesiones...',
        hint: 'Técnicas aplicadas, objetivos terapéuticos, tareas entre sesiones, frecuencia',
      },
    },
    vitals: null,
    showPrescriptions: false,
    showDiagnoses: true,
    sessionTypes: [
      { value: 'INDIVIDUAL', label: 'Individual' },
      { value: 'GROUP', label: 'Grupal' },
      { value: 'COUPLES', label: 'Pareja' },
      { value: 'FAMILY', label: 'Familiar' },
    ],
    notesLabel: 'Notas de sesión',
    aiSpecialtyHint: 'psicología clínica',
    guideLabels: { ask: 'Explorar', examine: 'Observar', consider: 'Hipótesis', workup: 'Escalas' },
  },

  PSYCHIATRY: {
    label: 'Psiquiatría',
    noteTemplate: 'PSYCHOLOGY',
    badge: { color: 'bg-purple-500/10 text-purple-700 border-purple-500/20', label: 'Psiquiatría' },
    sections: {
      s: {
        label: 'M — Motivo y anamnesis',
        abbr: 'M',
        placeholder: 'Motivo de consulta, historia psiquiátrica, antecedentes familiares, consumo de sustancias...',
        hint: 'Relato del paciente, historia psiquiátrica y familiar, antecedentes médicos relevantes',
      },
      o: {
        label: 'E — Examen del estado mental',
        abbr: 'E',
        placeholder: 'Apariencia, conciencia, orientación, atención, memoria, lenguaje, afecto, pensamiento, percepción, juicio, introspección...',
        hint: 'Examen del estado mental completo: conciencia, orientación, pensamiento, afecto, percepción',
      },
      a: {
        label: 'F — Formulación diagnóstica',
        abbr: 'F',
        placeholder: 'Diagnóstico DSM-5/CIE-10, diagnóstico diferencial, nivel de severidad, factores de riesgo...',
        hint: 'Diagnóstico psiquiátrico, diagnóstico diferencial, nivel de severidad y factores de riesgo',
      },
      p: {
        label: 'I — Plan de tratamiento',
        abbr: 'I',
        placeholder: 'Farmacoterapia, psicoterapia, hospitalización, seguimiento, educación al paciente/familia...',
        hint: 'Farmacoterapia, intervención psicoterapéutica, seguimiento y plan de seguridad',
      },
    },
    vitals: {
      primary: ['bp', 'weight'],
      expanded: ['height', 'bmi'],
    },
    showPrescriptions: true,
    showDiagnoses: true,
    sessionTypes: [
      { value: 'INDIVIDUAL', label: 'Individual' },
      { value: 'FAMILY', label: 'Familiar' },
    ],
    notesLabel: 'Notas clínicas',
    aiSpecialtyHint: 'psiquiatría',
    guideLabels: { ask: 'Anamnesis', examine: 'Estado mental', consider: 'Diagnósticos', workup: 'Estudios' },
  },

  NUTRITION: {
    label: 'Nutrición',
    noteTemplate: 'NUTRITION',
    badge: { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', label: 'Nutrición' },
    sections: {
      s: {
        label: 'A — Anamnesis nutricional',
        abbr: 'A',
        placeholder: 'Motivo de consulta, hábitos alimentarios, horarios de comida, actividad física, antecedentes, objetivos del paciente...',
        hint: 'Historia alimentaria, hábitos, actividad física, objetivos y antecedentes clínicos relevantes',
      },
      o: {
        label: 'E — Evaluación nutricional',
        abbr: 'E',
        placeholder: 'Evaluación antropométrica (peso, talla, IMC, circunferencias), examen físico nutricional, resultados de laboratorio...',
        hint: 'Datos antropométricos, evaluación bioquímica, composición corporal',
      },
      a: {
        label: 'D — Diagnóstico nutricional',
        abbr: 'D',
        placeholder: 'Estado nutricional actual, diagnóstico nutricional, metas calóricas y de macronutrientes...',
        hint: 'Diagnóstico del estado nutricional, metas y requerimientos calórico-proteicos',
      },
      p: {
        label: 'P — Plan alimentario',
        abbr: 'P',
        placeholder: 'Distribución de macronutrientes, plan de alimentación, recomendaciones específicas, próxima evaluación...',
        hint: 'Plan nutricional, distribución de macros, recomendaciones y seguimiento',
      },
    },
    vitals: {
      primary: ['weight'],
      expanded: ['height', 'bmi'],
    },
    showPrescriptions: false,
    showDiagnoses: true,
    sessionTypes: null,
    notesLabel: 'Observaciones nutricionales',
    aiSpecialtyHint: 'nutrición clínica',
    guideLabels: { ask: 'Indagar', examine: 'Medir', consider: 'Diagnóstico', workup: 'Laboratorio' },
  },

  PHYSIOTHERAPY: {
    label: 'Fisioterapia',
    noteTemplate: 'PHYSIOTHERAPY',
    badge: { color: 'bg-orange-500/10 text-orange-700 border-orange-500/20', label: 'Fisioterapia' },
    sections: {
      s: {
        label: 'S — Motivo y anamnesis',
        abbr: 'S',
        placeholder: 'Motivo de consulta, localización del dolor, EVA (0-10), inicio, mecanismo de lesión, factores agravantes y aliviantes...',
        hint: 'Síntomas, escala de dolor EVA (0-10), historia de la lesión y factores influyentes',
      },
      o: {
        label: 'E — Evaluación física',
        abbr: 'E',
        placeholder: 'Inspección postural, rangos de movimiento (ROM), fuerza muscular, pruebas especiales, palpación, sensibilidad...',
        hint: 'Evaluación funcional: postura, ROM, fuerza, pruebas especiales y palpación',
      },
      a: {
        label: 'D — Diagnóstico kinésico',
        abbr: 'D',
        placeholder: 'Diagnóstico fisioterapéutico, disfunciones identificadas, pronóstico funcional...',
        hint: 'Diagnóstico kinésico/fisioterapéutico y pronóstico funcional',
      },
      p: {
        label: 'T — Plan de tratamiento',
        abbr: 'T',
        placeholder: 'Modalidades terapéuticas (electroterapia, termoterapia, ultrasonido), ejercicios prescritos, frecuencia, objetivos a corto y largo plazo...',
        hint: 'Modalidades, ejercicios terapéuticos, frecuencia de sesiones y objetivos funcionales',
      },
    },
    vitals: null,
    showPrescriptions: false,
    showDiagnoses: true,
    sessionTypes: null,
    notesLabel: 'Observaciones de la sesión',
    aiSpecialtyHint: 'fisioterapia y rehabilitación',
    guideLabels: { ask: 'Historia', examine: 'Evaluar', consider: 'Diagnóstico', workup: 'Estudios' },
  },

  OTHER: {
    label: 'Otra especialidad',
    noteTemplate: 'SOAP',
    badge: { color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', label: 'Consulta' },
    sections: {
      s: {
        label: 'S — Subjetivo',
        abbr: 'S',
        placeholder: 'Motivo de consulta y síntomas referidos por el paciente...',
        hint: 'Lo que refiere el paciente',
      },
      o: {
        label: 'O — Objetivo',
        abbr: 'O',
        placeholder: 'Hallazgos del examen físico...',
        hint: 'Hallazgos observables',
      },
      a: {
        label: 'A — Evaluación',
        abbr: 'A',
        placeholder: 'Diagnóstico presuntivo...',
        hint: 'Impresión diagnóstica',
      },
      p: {
        label: 'P — Plan',
        abbr: 'P',
        placeholder: 'Tratamiento e indicaciones...',
        hint: 'Plan de tratamiento',
      },
    },
    vitals: {
      primary: ['bp', 'heartRate', 'temperature', 'oxygenSat', 'weight', 'glucose'],
      expanded: ['respiratoryRate', 'height', 'bmi'],
    },
    showPrescriptions: true,
    showDiagnoses: true,
    sessionTypes: null,
    notesLabel: 'Notas adicionales',
    aiSpecialtyHint: 'medicina clínica',
    guideLabels: { ask: 'Preguntar', examine: 'Examinar', consider: 'Considerar', workup: 'Solicitar' },
  },
}

export function getSpecialtyConfig(specialty: string | null | undefined): SpecialtyConfig {
  return SPECIALTY_CONFIGS[(specialty as SpecialtyKey) ?? 'GENERAL_MEDICINE'] ?? SPECIALTY_CONFIGS.GENERAL_MEDICINE
}

/** Maps a specialty to its note template for DB persistence */
export function getNoteTemplate(specialty: string | null | undefined): NoteTemplateKey {
  return getSpecialtyConfig(specialty).noteTemplate
}
