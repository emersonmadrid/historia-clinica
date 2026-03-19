/**
 * Seed realista para clínica de medicina general en Lima, Perú.
 * Borra toda la data clínica (pacientes, citas, consultas) y genera
 * 12 pacientes con historia médica verosímil.
 *
 * Ejecutar: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-realistic.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Helpers ──────────────────────────────────────────────────────────────────

const today = new Date()
const d = (offsetDays: number, h = 0, m = 0) => {
  const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays)
  dt.setHours(h, m, 0, 0)
  return dt
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🧹 Limpiando data clínica...')

  // Borrar en orden por dependencias FK
  await prisma.auditLog.deleteMany()
  await prisma.vitalSigns.deleteMany()
  await prisma.diagnosis.deleteMany()
  await prisma.prescriptionItem.deleteMany()
  await prisma.prescription.deleteMany()
  await prisma.clinicalRecord.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.allergy.deleteMany()
  await prisma.medicalBackground.deleteMany()
  await prisma.patientDocument.deleteMany()
  await prisma.patient.deleteMany()

  console.log('✅ Data clínica eliminada.\n')

  // Obtener organización y doctores existentes
  const org = await prisma.organization.findFirst()
  if (!org) throw new Error('No hay organización. Ejecuta primero el seed principal.')

  const doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR', email: 'doctor@clinica.com' } })
  const doctorAna = await prisma.user.findFirst({ where: { role: 'DOCTOR', email: 'dra.garcia@clinica.com' } })
  if (!doctor) throw new Error('No se encontró el doctor principal.')

  const doc1 = doctor
  const doc2 = doctorAna ?? doctor

  console.log('🏥 Organización:', org.name)
  console.log('👨‍⚕️ Doctor principal:', doc1.name)

  // ── PACIENTES ───────────────────────────────────────────────────────────────

  console.log('\n👥 Creando pacientes...')

  const p1 = await prisma.patient.create({ data: {
    firstName: 'María Concepción', lastName: 'González Quispe',
    documentType: 'DNI', documentNumber: '28741056',
    birthDate: new Date('1970-04-12'), gender: 'FEMALE',
    bloodType: 'O_POS', maritalStatus: 'MARRIED',
    phone: '987654321', email: 'maria.gonzalez@gmail.com',
    address: 'Jr. Pachacútec 345, Villa María del Triunfo', city: 'Lima',
    occupation: 'Ama de casa',
    emergencyContactName: 'Carlos González Quispe', emergencyContactPhone: '987111222', emergencyContactRel: 'Esposo',
    organizationId: org.id,
  }})

  const p2 = await prisma.patient.create({ data: {
    firstName: 'Juan Carlos', lastName: 'Pérez López',
    documentType: 'DNI', documentNumber: '41823094',
    birthDate: new Date('1986-09-23'), gender: 'MALE',
    bloodType: 'A_POS', maritalStatus: 'SINGLE',
    phone: '961234567', email: 'jcperez@hotmail.com',
    address: 'Av. Universitaria 1820, Comas', city: 'Lima',
    occupation: 'Mecánico automotriz',
    emergencyContactName: 'Rosa López de Pérez', emergencyContactPhone: '961888777', emergencyContactRel: 'Madre',
    organizationId: org.id,
  }})

  const p3 = await prisma.patient.create({ data: {
    firstName: 'Carmen Rosa', lastName: 'Flores Medina',
    documentType: 'DNI', documentNumber: '07345621',
    birthDate: new Date('1956-01-30'), gender: 'FEMALE',
    bloodType: 'B_POS', maritalStatus: 'WIDOWED',
    phone: '975432100', email: undefined,
    address: 'Calle Los Alamos 112, San Juan de Lurigancho', city: 'Lima',
    occupation: 'Jubilada',
    emergencyContactName: 'Jorge Flores Medina', emergencyContactPhone: '975100200', emergencyContactRel: 'Hijo',
    organizationId: org.id,
  }})

  const p4 = await prisma.patient.create({ data: {
    firstName: 'Luis Alberto', lastName: 'Torres Sánchez',
    documentType: 'DNI', documentNumber: '33812476',
    birthDate: new Date('1979-07-05'), gender: 'MALE',
    bloodType: 'A_NEG', maritalStatus: 'MARRIED',
    phone: '999334455', email: 'ltorres@empresa.com',
    address: 'Av. La Molina 2310, La Molina', city: 'Lima',
    occupation: 'Contador',
    emergencyContactName: 'Silvia Sánchez de Torres', emergencyContactPhone: '999556677', emergencyContactRel: 'Esposa',
    organizationId: org.id,
  }})

  const p5 = await prisma.patient.create({ data: {
    firstName: 'Ana Patricia', lastName: 'Vargas Huanca',
    documentType: 'DNI', documentNumber: '74561230',
    birthDate: new Date('1994-11-17'), gender: 'FEMALE',
    bloodType: 'O_NEG', maritalStatus: 'SINGLE',
    phone: '946789012', email: 'avargas.h@gmail.com',
    address: 'Jr. Junín 890, Cercado de Lima', city: 'Lima',
    occupation: 'Psicóloga',
    emergencyContactName: 'Pedro Vargas Huanca', emergencyContactPhone: '946100200', emergencyContactRel: 'Padre',
    organizationId: org.id,
  }})

  const p6 = await prisma.patient.create({ data: {
    firstName: 'Roberto', lastName: 'Mamani Ccopa',
    documentType: 'DNI', documentNumber: '02145678',
    birthDate: new Date('1952-06-20'), gender: 'MALE',
    bloodType: 'AB_POS', maritalStatus: 'MARRIED',
    phone: '920111333',
    address: 'Av. Tupac Amaru 4560, Independencia', city: 'Lima',
    occupation: 'Jubilado',
    emergencyContactName: 'Felicitas Ccopa de Mamani', emergencyContactPhone: '920222444', emergencyContactRel: 'Esposa',
    organizationId: org.id,
  }})

  const p7 = await prisma.patient.create({ data: {
    firstName: 'Sofía Elena', lastName: 'Ríos Palomino',
    documentType: 'DNI', documentNumber: '93210145',
    birthDate: new Date('2015-03-08'), gender: 'FEMALE',
    bloodType: 'A_POS', maritalStatus: undefined,
    phone: undefined,
    address: 'Calle Primavera 45, Surco', city: 'Lima',
    occupation: 'Estudiante',
    emergencyContactName: 'Carla Palomino de Ríos', emergencyContactPhone: '999876543', emergencyContactRel: 'Madre',
    organizationId: org.id,
  }})

  const p8 = await prisma.patient.create({ data: {
    firstName: 'Miguel Ángel', lastName: 'Castro Reyes',
    documentType: 'DNI', documentNumber: '19876543',
    birthDate: new Date('1978-12-03'), gender: 'MALE',
    bloodType: 'O_POS', maritalStatus: 'MARRIED',
    phone: '985123456', email: 'mcastro.r@outlook.com',
    address: 'Av. Colonial 3400, Callao', city: 'Callao',
    occupation: 'Operario de planta',
    emergencyContactName: 'Sandra Reyes de Castro', emergencyContactPhone: '985654321', emergencyContactRel: 'Esposa',
    organizationId: org.id,
  }})

  const p9 = await prisma.patient.create({ data: {
    firstName: 'Elena Natividad', lastName: 'Huanca Ticona',
    documentType: 'DNI', documentNumber: '10234567',
    birthDate: new Date('1967-08-25'), gender: 'FEMALE',
    bloodType: 'B_NEG', maritalStatus: 'DIVORCED',
    phone: '934567890', email: 'ehuanca@yahoo.com',
    address: 'Jr. Huancavelica 1250, La Victoria', city: 'Lima',
    occupation: 'Comerciante',
    emergencyContactName: 'Marco Ticona Huanca', emergencyContactPhone: '934111222', emergencyContactRel: 'Hijo',
    organizationId: org.id,
  }})

  const p10 = await prisma.patient.create({ data: {
    firstName: 'Diego Armando', lastName: 'Salas Gutiérrez',
    documentType: 'DNI', documentNumber: '76543210',
    birthDate: new Date('2002-05-14'), gender: 'MALE',
    bloodType: 'O_POS', maritalStatus: 'SINGLE',
    phone: '912345678', email: 'dsalas@gmail.com',
    address: 'Av. Benavides 4321, Surquillo', city: 'Lima',
    occupation: 'Universitario',
    emergencyContactName: 'Beatriz Gutiérrez de Salas', emergencyContactPhone: '912888999', emergencyContactRel: 'Madre',
    organizationId: org.id,
  }})

  const p11 = await prisma.patient.create({ data: {
    firstName: 'Rosa Isabel', lastName: 'Puma Coaquira',
    documentType: 'DNI', documentNumber: '45612378',
    birthDate: new Date('1989-02-14'), gender: 'FEMALE',
    bloodType: 'A_POS', maritalStatus: 'MARRIED',
    phone: '967891234', email: 'rpuma@gmail.com',
    address: 'Calle San Martín 567, Breña', city: 'Lima',
    occupation: 'Profesora',
    emergencyContactName: 'Alfredo Coaquira Puma', emergencyContactPhone: '967444555', emergencyContactRel: 'Esposo',
    organizationId: org.id,
  }})

  const p12 = await prisma.patient.create({ data: {
    firstName: 'Alejandro César', lastName: 'Condori Mamani',
    documentType: 'DNI', documentNumber: '06789012',
    birthDate: new Date('1962-10-30'), gender: 'MALE',
    bloodType: 'O_POS', maritalStatus: 'MARRIED',
    phone: '976543210', email: 'acondori@gmail.com',
    address: 'Av. Argentina 2100, Carmen de la Legua', city: 'Callao',
    occupation: 'Técnico electricista',
    emergencyContactName: 'Margarita Mamani de Condori', emergencyContactPhone: '976111222', emergencyContactRel: 'Esposa',
    organizationId: org.id,
  }})

  console.log('✅ 12 pacientes creados.')

  // ── ALERGIAS ────────────────────────────────────────────────────────────────

  await prisma.allergy.createMany({ data: [
    // María González
    { patientId: p1.id, allergen: 'Metamizol (Dipirona)', reaction: 'Urticaria generalizada', severity: 'MODERATE' },
    // Juan Carlos Pérez
    { patientId: p2.id, allergen: 'Penicilina', reaction: 'Angioedema, dificultad respiratoria', severity: 'SEVERE' },
    { patientId: p2.id, allergen: 'Ácido acetilsalicílico', reaction: 'Broncoespasmo, rinitis', severity: 'MODERATE' },
    // Carmen Flores
    { patientId: p3.id, allergen: 'Contraste yodado', reaction: 'Reacción anafiláctica leve', severity: 'SEVERE' },
    // Luis Torres
    { patientId: p4.id, allergen: 'Sulfonamidas', reaction: 'Erupción cutánea maculopapular', severity: 'MILD' },
    // Roberto Mamani
    { patientId: p6.id, allergen: 'Alopurinol', reaction: 'Síndrome de Stevens-Johnson leve', severity: 'SEVERE' },
    // Elena Huanca
    { patientId: p9.id, allergen: 'Látex', reaction: 'Dermatitis de contacto', severity: 'MILD' },
    // Alejandro Condori
    { patientId: p12.id, allergen: 'Clopidogrel', reaction: 'Trombocitopenia', severity: 'MODERATE' },
  ]})

  // ── ANTECEDENTES ────────────────────────────────────────────────────────────

  await prisma.medicalBackground.createMany({ data: [
    // p1 - María
    { patientId: p1.id, type: 'PERSONAL', description: 'Hipertensión arterial esencial desde 2015' },
    { patientId: p1.id, type: 'PERSONAL', description: 'Diabetes mellitus tipo 2 desde 2018' },
    { patientId: p1.id, type: 'PERSONAL', description: 'Hipotiroidismo primario desde 2020' },
    { patientId: p1.id, type: 'FAMILY', description: 'Madre: HTA, DM2. Padre: IAM a los 58 años. Hermana: dislipidemia.' },
    { patientId: p1.id, type: 'SURGICAL', description: 'Cesárea (2000). Colecistectomía laparoscópica (2016).' },
    { patientId: p1.id, type: 'PHARMACOLOGICAL', description: 'Enalapril 10mg/d, Metformina 850mg c/12h, Levotiroxina 75mcg/d, Atorvastatina 20mg/noche' },
    // p2 - Juan Carlos
    { patientId: p2.id, type: 'PERSONAL', description: 'Asma bronquial alérgica desde los 10 años' },
    { patientId: p2.id, type: 'PERSONAL', description: 'Rinitis alérgica perenne' },
    { patientId: p2.id, type: 'FAMILY', description: 'Madre asmática. Abuela materna con EPOC.' },
    { patientId: p2.id, type: 'PHARMACOLOGICAL', description: 'Budesonida/Formoterol 160/4.5 mcg inhalado c/12h. Salbutamol de rescate.' },
    // p3 - Carmen
    { patientId: p3.id, type: 'PERSONAL', description: 'EPOC GOLD III diagnosticado 2014 (exfumadora 30 paq/año)' },
    { patientId: p3.id, type: 'PERSONAL', description: 'Insuficiencia cardíaca con FE reducida 35% (2019)' },
    { patientId: p3.id, type: 'PERSONAL', description: 'Hipertensión arterial desde 2010' },
    { patientId: p3.id, type: 'SURGICAL', description: 'Cateterismo cardíaco diagnóstico (2019)' },
    { patientId: p3.id, type: 'PHARMACOLOGICAL', description: 'Bisoprolol 5mg/d, Enalapril 5mg c/12h, Furosemida 40mg/d, Espironolactona 25mg/d, Bromuro de ipratropio + salbutamol inhalado' },
    // p4 - Luis Torres
    { patientId: p4.id, type: 'PERSONAL', description: 'Diabetes mellitus tipo 2 desde 2017' },
    { patientId: p4.id, type: 'PERSONAL', description: 'Dislipidemia mixta' },
    { patientId: p4.id, type: 'PERSONAL', description: 'Obesidad grado I (IMC 31)' },
    { patientId: p4.id, type: 'FAMILY', description: 'Padre con DM2 e IAM. Tío materno con ACV.' },
    { patientId: p4.id, type: 'PHARMACOLOGICAL', description: 'Metformina 1g c/12h, Atorvastatina 40mg/noche' },
    // p5 - Ana
    { patientId: p5.id, type: 'PERSONAL', description: 'Trastorno de ansiedad generalizada desde 2021' },
    { patientId: p5.id, type: 'PERSONAL', description: 'Insomnio crónico' },
    { patientId: p5.id, type: 'PHARMACOLOGICAL', description: 'Sertralina 50mg/d. Melatonina 3mg al dormir (SOS).' },
    // p6 - Roberto
    { patientId: p6.id, type: 'PERSONAL', description: 'Hipertensión arterial desde 2005' },
    { patientId: p6.id, type: 'PERSONAL', description: 'Hiperuricemia y gota articular crónica desde 2012' },
    { patientId: p6.id, type: 'PERSONAL', description: 'Hiperplasia benigna de próstata (HBP) desde 2018' },
    { patientId: p6.id, type: 'SURGICAL', description: 'Herniorrafia inguinal derecha (2008)' },
    { patientId: p6.id, type: 'PHARMACOLOGICAL', description: 'Losartán 50mg/d, Tamsulosina 0.4mg/d, Febuxostat 80mg/d (por alergia a Alopurinol)' },
    // p7 - Sofía
    { patientId: p7.id, type: 'PERSONAL', description: 'Asma bronquial alérgica desde los 3 años' },
    { patientId: p7.id, type: 'PERSONAL', description: 'Dermatitis atópica leve' },
    { patientId: p7.id, type: 'FAMILY', description: 'Padre con rinitis alérgica. Madre con asma.' },
    { patientId: p7.id, type: 'PHARMACOLOGICAL', description: 'Fluticasona 50mcg inhalado c/12h. Salbutamol de rescate.' },
    // p8 - Miguel Castro
    { patientId: p8.id, type: 'PERSONAL', description: 'Lumbalgia crónica mecánica desde 2016 (trabajo físico pesado)' },
    { patientId: p8.id, type: 'PERSONAL', description: 'Hipertensión arterial desde 2020' },
    { patientId: p8.id, type: 'SURGICAL', description: 'Meniscectomía rodilla derecha artroscópica (2015)' },
    { patientId: p8.id, type: 'PHARMACOLOGICAL', description: 'Enalapril 5mg/d, Ibuprofeno 400mg SOS (lumbalgia)' },
    // p9 - Elena
    { patientId: p9.id, type: 'PERSONAL', description: 'Hipotiroidismo primario desde 2014' },
    { patientId: p9.id, type: 'PERSONAL', description: 'Menopausia quirúrgica (histerectomía 2019)' },
    { patientId: p9.id, type: 'PERSONAL', description: 'Osteopenia lumbar (densitometría 2022)' },
    { patientId: p9.id, type: 'SURGICAL', description: 'Histerectomía total abdominal por miomatosis (2019)' },
    { patientId: p9.id, type: 'PHARMACOLOGICAL', description: 'Levotiroxina 100mcg/d, Calcio 600mg + Vit D 400UI c/12h' },
    // p12 - Alejandro Condori
    { patientId: p12.id, type: 'PERSONAL', description: 'IAM STEMI anterior tratado con ACTP primaria + stent DES en DA (enero 2024)' },
    { patientId: p12.id, type: 'PERSONAL', description: 'Hipertensión arterial desde 2015' },
    { patientId: p12.id, type: 'PERSONAL', description: 'Dislipidemia aterogénica' },
    { patientId: p12.id, type: 'FAMILY', description: 'Padre fallecido por IAM a los 55 años. Hermano con angina estable.' },
    { patientId: p12.id, type: 'PHARMACOLOGICAL', description: 'AAS 100mg/d, Ticagrelor 90mg c/12h, Atorvastatina 80mg/noche, Bisoprolol 5mg/d, Enalapril 10mg c/12h' },
  ]})

  console.log('✅ Alergias y antecedentes cargados.')

  // ── CONSULTAS HISTÓRICAS ────────────────────────────────────────────────────

  console.log('\n📋 Generando consultas históricas...')

  // ── p1 María González: control crónico 3 consultas ──
  const cr1a = await prisma.clinicalRecord.create({ data: {
    patientId: p1.id, doctorId: doc1.id,
    date: d(-90), reason: 'Control HTA + DM2 + hipotiroidismo',
    subjective: 'Paciente refiere buena tolerancia a medicación. Glicemias en casa 130-160 mg/dL en ayunas. Tensión arterial matutina 140/85 en casa. Refiere cansancio moderado y estreñimiento ocasional.',
    objective: 'ABEG, LOTEP. Peso: 74 kg. Talla: 158 cm. IMC: 29.6. PA: 142/88 mmHg. FC: 76 lpm. FR: 16 rpm. T°: 36.5°C. Sat O2: 97%. Glucosa capilar: 148 mg/dL. Tiroides no palpable. Sin edemas.',
    assessment: 'HTA esencial moderadamente controlada. DM2 con mal control glucémico. Hipotiroidismo en seguimiento.',
    plan: '1. Aumentar Metformina a 1g c/12h. 2. Solicitar HbA1c, perfil lipídico, TSH, creatinina, orina completa. 3. Mantener Levotiroxina 75mcg. 4. Dieta hipocalórica e hiposódica reforzada. 5. Control en 4 semanas.',
    notes: 'Paciente con adherencia aceptable. Educación sobre automonitoreo de glucosa.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr1a.id, height: 158, weight: 74, bmi: 29.6, temperature: 36.5, bloodPressureSys: 142, bloodPressureDia: 88, heartRate: 76, oxygenSat: 97, respiratoryRate: 16, glucoseLevel: 148 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr1a.id, code: 'I10', description: 'Hipertensión esencial (primaria)', type: 'PRIMARY', status: 'CHRONIC' },
    { consultationId: cr1a.id, code: 'E11', description: 'Diabetes mellitus tipo 2', type: 'SECONDARY', status: 'CHRONIC' },
    { consultationId: cr1a.id, code: 'E03.9', description: 'Hipotiroidismo no especificado', type: 'SECONDARY', status: 'CHRONIC' },
  ]})

  const cr1b = await prisma.clinicalRecord.create({ data: {
    patientId: p1.id, doctorId: doc1.id,
    date: d(-60), reason: 'Control laboratorios + ajuste de medicación',
    subjective: 'Paciente trae resultados de laboratorio. Refiere mejoría del cansancio. Glicemias en casa 120-145 mg/dL. TA en casa 138/82. Cumple con dieta en 70%.',
    objective: 'Peso: 73.2 kg. IMC: 29.3. PA: 138/84 mmHg. FC: 74 lpm. Sat O2: 97%. Lab: HbA1c 7.8%, Col total 218, LDL 145, HDL 38, TG 240, Creatinina 0.9, TSH 3.2.',
    assessment: 'DM2 con control subóptimo (HbA1c 7.8%). HTA moderadamente controlada. Dislipidemia aterogénica. Hipotiroidismo compensado.',
    plan: '1. Agregar Glibenclamida 5mg con el desayuno. 2. Aumentar Atorvastatina a 40mg. 3. Referencia a nutrición. 4. TSH en 3 meses. 5. Control en 1 mes.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr1b.id, height: 158, weight: 73.2, bmi: 29.3, temperature: 36.6, bloodPressureSys: 138, bloodPressureDia: 84, heartRate: 74, oxygenSat: 97, respiratoryRate: 16, glucoseLevel: 138 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr1b.id, code: 'E11', description: 'Diabetes mellitus tipo 2', type: 'PRIMARY', status: 'CHRONIC', notes: 'HbA1c 7.8% - control subóptimo' },
    { consultationId: cr1b.id, code: 'E78.5', description: 'Hiperlipidemia mixta', type: 'SECONDARY', status: 'ACTIVE' },
  ]})
  const rx1b = await prisma.prescription.create({ data: { consultationId: cr1b.id, patientId: p1.id, doctorId: doc1.id, notes: 'Tomar con el desayuno. No suspender sin consultar.' }})
  await prisma.prescriptionItem.createMany({ data: [
    { prescriptionId: rx1b.id, medication: 'Glibenclamida', dosage: '5 mg', frequency: 'Una vez al día (con el desayuno)', duration: '30 días', quantity: '30 tabletas', instructions: 'No suspender sin avisar al médico. Vigilar hipoglicemia.' },
    { prescriptionId: rx1b.id, medication: 'Atorvastatina', dosage: '40 mg', frequency: 'Una vez al día (en la noche)', duration: '30 días', quantity: '30 tabletas', instructions: 'Tomar en la noche. Evitar toronja.' },
  ]})

  const cr1c = await prisma.clinicalRecord.create({ data: {
    patientId: p1.id, doctorId: doc1.id,
    date: d(-30), reason: 'Control mensual HTA + DM2',
    subjective: 'Paciente refiere glicemias en casa 110-130 mg/dL. No ha tenido episodios de hipoglicemia. TA matutina 132/80. Tolera bien medicación. Sin cefalea ni mareos.',
    objective: 'Peso: 72.5 kg. IMC: 29.1. PA: 134/82 mmHg. FC: 72 lpm. Sat O2: 98%. Glucosa capilar: 118 mg/dL. Sin edemas periféricos.',
    assessment: 'HTA bien controlada. DM2 con mejoría del control glucémico. Dislipidemia en tratamiento.',
    plan: '1. Continuar esquema actual. 2. HbA1c en 6 semanas para evaluar meta. 3. Reforzar actividad física 30 min/d. 4. Control en 1 mes.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr1c.id, height: 158, weight: 72.5, bmi: 29.1, temperature: 36.5, bloodPressureSys: 134, bloodPressureDia: 82, heartRate: 72, oxygenSat: 98, respiratoryRate: 16, glucoseLevel: 118 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr1c.id, code: 'I10', description: 'Hipertensión esencial (primaria)', type: 'PRIMARY', status: 'CHRONIC' },
    { consultationId: cr1c.id, code: 'E11', description: 'Diabetes mellitus tipo 2', type: 'SECONDARY', status: 'CHRONIC', notes: 'Control mejorando' },
  ]})

  // ── p2 Juan Carlos Pérez: asma + exacerbación ──
  const cr2a = await prisma.clinicalRecord.create({ data: {
    patientId: p2.id, doctorId: doc1.id,
    date: d(-75), reason: 'Control asma bronquial + rinitis',
    subjective: 'Paciente refiere buen control del asma. Usa corticoide inhalado regularmente. Episodios nocturnos 1-2 veces/semana. Usa salbutamol de rescate 2-3 veces por semana. Trabajo en taller mecánico con exposición a polvos y solventes.',
    objective: 'FC: 82 lpm. FR: 18 rpm. Sat O2: 97%. FEM: 78% del predicho. Sibilancias leves al esfuerzo. Sin uso de músculos accesorios.',
    assessment: 'Asma bronquial parcialmente controlada (GINA paso 3). Rinitis alérgica persistente.',
    plan: '1. Aumentar dosis Budesonida/Formoterol a 320/9 mcg c/12h. 2. Agregar loratadina 10mg/d para rinitis. 3. Recomendar uso de mascarilla en taller. 4. Espirómetría en 2 meses. 5. Control en 6 semanas.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr2a.id, height: 172, weight: 78, bmi: 26.4, temperature: 36.7, bloodPressureSys: 118, bloodPressureDia: 76, heartRate: 82, oxygenSat: 97, respiratoryRate: 18 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr2a.id, code: 'J45.1', description: 'Asma predominantemente alérgica, moderada persistente', type: 'PRIMARY', status: 'CHRONIC' },
    { consultationId: cr2a.id, code: 'J30.1', description: 'Rinitis alérgica debida a polen', type: 'SECONDARY', status: 'ACTIVE' },
  ]})

  const cr2b = await prisma.clinicalRecord.create({ data: {
    patientId: p2.id, doctorId: doc1.id,
    date: d(-20), reason: 'Exacerbación asmática moderada',
    subjective: 'Paciente acude por cuadro de 2 días de evolución con disnea progresiva, sibilancias y tos seca. Refiere exposición a polvo en taller sin mascarilla. Usó salbutamol 8 veces en las últimas 24h con mejoría parcial. No fiebre.',
    objective: 'Paciente ansioso, habla entrecortada. FC: 108 lpm. FR: 26 rpm. Sat O2: 91% al aire ambiental. FEM: 55% del predicho. Sibilancias difusas bilaterales espiratorias e inspiratorias. Sin cianosis.',
    assessment: 'Exacerbación asmática moderada. Desencadenada por exposición ocupacional.',
    plan: '1. Salbutamol nebulizado 2.5mg c/20min x 3 dosis. 2. Ipratropio 0.5mg nebulizado x 1 dosis. 3. Prednisona 40mg VO x 5 días. 4. Alta con control en 48h. 5. Budesonida/Formoterol 320/9 mcg c/12h. 6. Derivar a médico ocupacional.',
    notes: 'Post-nebulización: Sat O2 96%, FR 20, FEM 72%. Mejoría significativa. Alta con indicaciones.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr2b.id, height: 172, weight: 78, bmi: 26.4, temperature: 36.9, bloodPressureSys: 122, bloodPressureDia: 80, heartRate: 108, oxygenSat: 91, respiratoryRate: 26 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr2b.id, code: 'J45.1', description: 'Exacerbación de asma moderada', type: 'PRIMARY', status: 'ACTIVE' },
  ]})
  const rx2b = await prisma.prescription.create({ data: { consultationId: cr2b.id, patientId: p2.id, doctorId: doc1.id, notes: 'Completar ciclo de prednisona. No suspender abruptamente.' }})
  await prisma.prescriptionItem.createMany({ data: [
    { prescriptionId: rx2b.id, medication: 'Prednisona', dosage: '40 mg', frequency: 'Una vez al día (mañana con alimentos)', duration: '5 días', quantity: '5 tabletas', instructions: 'Tomar con comida. No suspender abruptamente.' },
    { prescriptionId: rx2b.id, medication: 'Budesonida/Formoterol', dosage: '320/9 mcg', frequency: '1 inhalación cada 12 horas', duration: '30 días', quantity: '1 inhalador', instructions: 'Enjuagar boca después de cada uso para prevenir candidiasis oral.' },
    { prescriptionId: rx2b.id, medication: 'Salbutamol (rescate)', dosage: '100 mcg/dosis', frequency: 'Según necesidad (máx 4 veces/día)', duration: '30 días', quantity: '1 inhalador', instructions: 'Solo usar si hay síntomas. Si necesita más de 4 veces al día, acudir a emergencias.' },
  ]})

  // ── p3 Carmen Flores: EPOC + IC ──
  const cr3a = await prisma.clinicalRecord.create({ data: {
    patientId: p3.id, doctorId: doc1.id,
    date: d(-45), reason: 'Control EPOC + insuficiencia cardíaca',
    subjective: 'Paciente refiere disnea a grandes esfuerzos (subir 1 piso). Tos productiva matutina con expectoración mucosa. Edema bilateral de tobillos vespertino (+). No disnea paroxística nocturna. Duerme con 2 almohadas. Peso estable.',
    objective: 'Paciente facies congestiva. Sat O2: 88% (habitual para ella). FC: 86 lpm. FR: 22 rpm. PA: 148/92. Sibilancias y roncus difusos. Murmullo vesicular disminuido en bases. Edema bilateral 2+ hasta tobillos. PVY aumentada.',
    assessment: 'EPOC GOLD III con exacerbación moderada. Insuficiencia cardíaca descompensada leve (FE 35%).',
    plan: '1. Ajustar Furosemida a 40mg c/12h x 3 días, luego 40mg/d. 2. Nebulización domiciliaria Ipratropio/Salbutamol c/8h. 3. Restricción hídrica 1.5L/d. 4. Control diario de peso. 5. Acudir a emergencias si aumento >1kg/día o disnea en reposo.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr3a.id, height: 155, weight: 68, bmi: 28.3, temperature: 36.4, bloodPressureSys: 148, bloodPressureDia: 92, heartRate: 86, oxygenSat: 88, respiratoryRate: 22 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr3a.id, code: 'J44.1', description: 'EPOC con exacerbación aguda', type: 'PRIMARY', status: 'CHRONIC' },
    { consultationId: cr3a.id, code: 'I50.0', description: 'Insuficiencia cardíaca congestiva', type: 'SECONDARY', status: 'CHRONIC' },
    { consultationId: cr3a.id, code: 'I10', description: 'Hipertensión esencial', type: 'SECONDARY', status: 'CHRONIC' },
  ]})

  // ── p4 Luis Torres: DM2 + dislipidemia ──
  const cr4a = await prisma.clinicalRecord.create({ data: {
    patientId: p4.id, doctorId: doc1.id,
    date: d(-50), reason: 'Control DM2 + dislipidemia',
    subjective: 'Paciente refiere glicemias en ayunas 160-200 mg/dL. Come fuera de casa frecuentemente por trabajo. Sin ejercicio regular. Sin polidipsia ni poliuria actualmente. Trae HbA1c: 8.9%.',
    objective: 'Peso: 89 kg. Talla: 170 cm. IMC: 30.8. PA: 132/84. FC: 80 lpm. Glucosa capilar: 192 mg/dL. Examen físico: adiposidad abdominal prominente, circunferencia abdominal 102 cm.',
    assessment: 'DM2 con mal control glucémico (HbA1c 8.9%). Obesidad grado I. Dislipidemia aterogénica.',
    plan: '1. Agregar Sitagliptina 100mg/d. 2. Atorvastatina 40mg/noche. 3. Derivar a nutrición urgente. 4. Programa de actividad física estructurada. 5. HbA1c en 3 meses. 6. Control en 1 mes.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr4a.id, height: 170, weight: 89, bmi: 30.8, temperature: 36.6, bloodPressureSys: 132, bloodPressureDia: 84, heartRate: 80, oxygenSat: 97, respiratoryRate: 16, glucoseLevel: 192 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr4a.id, code: 'E11', description: 'Diabetes mellitus tipo 2, mal controlada', type: 'PRIMARY', status: 'CHRONIC' },
    { consultationId: cr4a.id, code: 'E66.0', description: 'Obesidad por exceso de calorías', type: 'SECONDARY', status: 'ACTIVE' },
    { consultationId: cr4a.id, code: 'E78.2', description: 'Hiperlipidemia mixta', type: 'SECONDARY', status: 'ACTIVE' },
  ]})
  const rx4a = await prisma.prescription.create({ data: { consultationId: cr4a.id, patientId: p4.id, doctorId: doc1.id }})
  await prisma.prescriptionItem.createMany({ data: [
    { prescriptionId: rx4a.id, medication: 'Sitagliptina', dosage: '100 mg', frequency: 'Una vez al día', duration: '30 días', quantity: '30 tabletas', instructions: 'Tomar con o sin alimentos. Si nauseas, tomar con comida.' },
    { prescriptionId: rx4a.id, medication: 'Atorvastatina', dosage: '40 mg', frequency: 'Una vez al día (noche)', duration: '30 días', quantity: '30 tabletas' },
  ]})

  // ── p5 Ana Vargas: ansiedad ──
  const cr5a = await prisma.clinicalRecord.create({ data: {
    patientId: p5.id, doctorId: doc1.id,
    date: d(-35), reason: 'Control trastorno de ansiedad + insomnio',
    subjective: 'Paciente refiere mejoría parcial con sertralina. Sigue teniendo episodios de preocupación excesiva relacionados con trabajo. Insomnio de conciliación 3-4 veces/semana. No pensamientos suicidas. Está en psicoterapia TCC.',
    objective: 'Paciente ansiosa pero colaboradora. Habla fluida. Afecto ansioso. FC: 92 lpm. PA: 108/70. No temblor. No exoftalmos.',
    assessment: 'Trastorno de ansiedad generalizada, parcialmente controlado. Insomnio crónico asociado.',
    plan: '1. Mantener Sertralina 50mg. 2. Técnicas de higiene del sueño reforzadas. 3. Melatonina 5mg al dormir x 30 días. 4. Continuar psicoterapia TCC. 5. Control en 6 semanas o antes si empeora.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr5a.id, height: 165, weight: 57, bmi: 20.9, temperature: 36.5, bloodPressureSys: 108, bloodPressureDia: 70, heartRate: 92, oxygenSat: 99, respiratoryRate: 16 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr5a.id, code: 'F41.1', description: 'Trastorno de ansiedad generalizada', type: 'PRIMARY', status: 'ACTIVE' },
    { consultationId: cr5a.id, code: 'G47.0', description: 'Insomnio orgánico', type: 'SECONDARY', status: 'ACTIVE' },
  ]})

  // ── p6 Roberto Mamani: gota aguda ──
  const cr6a = await prisma.clinicalRecord.create({ data: {
    patientId: p6.id, doctorId: doc1.id,
    date: d(-15), reason: 'Artritis gotosa aguda - hallux izquierdo',
    subjective: 'Paciente refiere dolor intenso 8/10 en articulación metatarsofalángica del 1° dedo izquierdo, con inicio hace 2 días. Eritema, calor local y edema marcado. Refiere haber consumido cerveza y mariscos 3 días antes. Ácido úrico previo: 9.2 mg/dL.',
    objective: 'Marcha claudicante. Articulación 1 MTF izquierda eritematosa, caliente, edematizada y muy dolorosa a la palpación y movimiento. FC: 78 lpm. PA: 152/94 (elevada por dolor).',
    assessment: 'Artritis gotosa aguda (podagra) 1ª MTF izquierda. HTA con elevación situacional por dolor.',
    plan: '1. Colchicina 1mg VO stat, luego 0.5mg a la hora (solo primera vez). 2. Indometacina 50mg c/8h x 5 días (con omeprazol 20mg). 3. Reposo y elevación del miembro. 4. Restricción de purinas, alcohol y mariscos. 5. Continuar Febuxostat 80mg/d. 6. Control en 1 semana.',
    notes: 'Paciente con alergia conocida a Alopurinol (Stevens-Johnson). Febuxostat como alternativa.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr6a.id, height: 168, weight: 82, bmi: 29.1, temperature: 37.1, bloodPressureSys: 152, bloodPressureDia: 94, heartRate: 78, oxygenSat: 97, respiratoryRate: 17 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr6a.id, code: 'M10.07', description: 'Gota idiopática, tobillo y pie', type: 'PRIMARY', status: 'ACTIVE' },
    { consultationId: cr6a.id, code: 'I10', description: 'Hipertensión esencial', type: 'SECONDARY', status: 'CHRONIC' },
  ]})
  const rx6a = await prisma.prescription.create({ data: { consultationId: cr6a.id, patientId: p6.id, doctorId: doc1.id }})
  await prisma.prescriptionItem.createMany({ data: [
    { prescriptionId: rx6a.id, medication: 'Colchicina', dosage: '0.5 mg', frequency: '2 tabletas (1mg) stat, luego 1 tableta a la hora', duration: '1 día (esquema inicial)', quantity: '3 tabletas', instructions: 'Solo el primer día. No exceder dosis indicada.' },
    { prescriptionId: rx6a.id, medication: 'Indometacina', dosage: '50 mg', frequency: 'Cada 8 horas con alimentos', duration: '5 días', quantity: '15 cápsulas', instructions: 'Tomar obligatoriamente con alimentos o leche.' },
    { prescriptionId: rx6a.id, medication: 'Omeprazol', dosage: '20 mg', frequency: 'Una vez al día (30 min antes del desayuno)', duration: '5 días', quantity: '5 cápsulas', instructions: 'Protector gástrico. Tomar 30 minutos antes del desayuno.' },
  ]})

  // ── p9 Elena Huanca: hipotiroidismo ──
  const cr9a = await prisma.clinicalRecord.create({ data: {
    patientId: p9.id, doctorId: doc1.id,
    date: d(-40), reason: 'Control hipotiroidismo + osteopenia',
    subjective: 'Paciente refiere fatiga moderada y constipación en los últimas semanas. Toma levotiroxina con el desayuno (incorrecto). Sofocos controlados. Trae TSH: 6.8 (elevada).',
    objective: 'Peso: 68 kg. Talla: 160 cm. IMC: 26.6. PA: 122/78. FC: 64 lpm. Piel seca. Reflejos osteotendinosos normales. Tiroides no palpable post-quirúrgico.',
    assessment: 'Hipotiroidismo primario, mal controlado (TSH 6.8). Menopausia quirúrgica. Osteopenia lumbar.',
    plan: '1. Aumentar Levotiroxina a 125mcg/d. 2. Indicar tomar en AYUNAS, 30-60min antes del desayuno. 3. TSH en 6-8 semanas. 4. Continuar calcio + Vit D. 5. Control en 2 meses.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr9a.id, height: 160, weight: 68, bmi: 26.6, temperature: 36.3, bloodPressureSys: 122, bloodPressureDia: 78, heartRate: 64, oxygenSat: 98, respiratoryRate: 15 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr9a.id, code: 'E03.9', description: 'Hipotiroidismo, no especificado', type: 'PRIMARY', status: 'CHRONIC', notes: 'TSH 6.8 - mal controlado' },
    { consultationId: cr9a.id, code: 'M85.0', description: 'Osteoporosis/osteopenia', type: 'SECONDARY', status: 'CHRONIC' },
  ]})
  const rx9a = await prisma.prescription.create({ data: { consultationId: cr9a.id, patientId: p9.id, doctorId: doc1.id }})
  await prisma.prescriptionItem.createMany({ data: [
    { prescriptionId: rx9a.id, medication: 'Levotiroxina sódica', dosage: '125 mcg', frequency: 'Una vez al día EN AYUNAS', duration: '60 días', quantity: '60 tabletas', instructions: '⚠️ TOMAR EN AYUNAS, 30-60 minutos antes del desayuno. No tomar con café, leche ni antiácidos.' },
    { prescriptionId: rx9a.id, medication: 'Calcio + Vitamina D3', dosage: '600mg/400UI', frequency: 'Una tableta cada 12 horas con las comidas', duration: '60 días', quantity: '120 tabletas' },
  ]})

  // ── p12 Alejandro Condori: post-IAM ──
  const cr12a = await prisma.clinicalRecord.create({ data: {
    patientId: p12.id, doctorId: doc1.id,
    date: d(-60), reason: 'Control post-IAM STEMI (3 meses post-ACTP)',
    subjective: 'Paciente en buena condición general. Sin angina en reposo ni de esfuerzo. Completó programa de rehabilitación cardíaca. Cumple medicación al 100%. Refiere fatiga leve con esfuerzo moderado (subir 3 pisos).',
    objective: 'Peso: 75 kg. Talla: 167 cm. IMC: 26.9. PA: 118/76. FC: 58 lpm. FR: 16 rpm. Sat O2: 98%. Ritmo sinusal. No R3 ni soplos. Sin edemas.',
    assessment: 'Post-IAM STEMI anterior con stent DES en DA. Evolución favorable. FE última ecocardiografía: 45% (mejoría desde 35%). Buena adherencia terapéutica.',
    plan: '1. Continuar doble antiagregación (AAS + Ticagrelor) hasta completar 12 meses (hasta enero 2025). 2. Ecocardiografía de control en 3 meses. 3. LDL objetivo <70 mg/dL, solicitar perfil lipídico. 4. Continuar programa ejercicio supervisado. 5. Control en 3 meses.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr12a.id, height: 167, weight: 75, bmi: 26.9, temperature: 36.5, bloodPressureSys: 118, bloodPressureDia: 76, heartRate: 58, oxygenSat: 98, respiratoryRate: 16 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr12a.id, code: 'I21.0', description: 'IAM transmural de la pared anterior', type: 'PRIMARY', status: 'RESOLVED', notes: 'Stent DES en DA. FE 45%.' },
    { consultationId: cr12a.id, code: 'I10', description: 'Hipertensión esencial', type: 'SECONDARY', status: 'CHRONIC' },
    { consultationId: cr12a.id, code: 'E78.0', description: 'Hipercolesterolemia pura', type: 'SECONDARY', status: 'ACTIVE' },
  ]})

  // ── p11 Rosa Puma: control prenatal ──
  const cr11a = await prisma.clinicalRecord.create({ data: {
    patientId: p11.id, doctorId: doc2.id,
    date: d(-21), reason: 'Control prenatal - 28 semanas de gestación',
    subjective: 'Gestante G2P1 de 28 semanas. Movimientos fetales presentes. Niega contracciones ni sangrado. Refiere pirosis frecuente y edema leve de pies al final del día. Cursa con ITS negativas en primer trimestre.',
    objective: 'Peso: 72 kg (ganancia 9kg). Talla uterina: 27 cm. LCF: 152 lpm. Presentación cefálica. PA: 118/74. Glucosa: 88 mg/dL. Hb: 11.2 g/dL (anemia leve). Edema 1+ maleolar bilateral.',
    assessment: 'Embarazo de 28 semanas, adecuado para edad gestacional. Anemia ferropénica leve gestacional. Pirosis gestacional.',
    plan: '1. Hierro elemental 60mg/d + ácido fólico 400mcg/d continuar. 2. Agregar hidróxido de aluminio/magnesio para pirosis SOS. 3. Glucosa de ayuno en 1 semana (descartar DMG). 4. Ecografía obstétrica 32 semanas. 5. Próximo control en 2 semanas.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr11a.id, height: 162, weight: 72, bmi: 27.4, temperature: 36.6, bloodPressureSys: 118, bloodPressureDia: 74, heartRate: 88, oxygenSat: 99, respiratoryRate: 16, glucoseLevel: 88 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr11a.id, code: 'Z34.2', description: 'Supervisión de embarazo normal, segundo trimestre', type: 'PRIMARY', status: 'ACTIVE' },
    { consultationId: cr11a.id, code: 'O99.0', description: 'Anemia que complica el embarazo', type: 'SECONDARY', status: 'ACTIVE' },
  ]})
  const rx11a = await prisma.prescription.create({ data: { consultationId: cr11a.id, patientId: p11.id, doctorId: doc2.id }})
  await prisma.prescriptionItem.createMany({ data: [
    { prescriptionId: rx11a.id, medication: 'Sulfato ferroso', dosage: '300 mg (60mg Fe elemental)', frequency: 'Una tableta al día en ayunas', duration: '60 días', quantity: '60 tabletas', instructions: 'Tomar 1 hora antes de las comidas con jugo de naranja para mejor absorción. Puede oscurecer las deposiciones (normal).' },
    { prescriptionId: rx11a.id, medication: 'Ácido fólico', dosage: '400 mcg', frequency: 'Una tableta al día', duration: '60 días', quantity: '60 tabletas' },
  ]})

  // ── p7 Sofía (pediátrica): amigdalitis ──
  const cr7a = await prisma.clinicalRecord.create({ data: {
    patientId: p7.id, doctorId: doc2.id,
    date: d(-10), reason: 'Amigdalitis bacteriana aguda',
    subjective: 'Madre refiere que la niña lleva 2 días con fiebre hasta 39°C, odinofagia intensa, dificultad para tragar, sin tos ni rinorrea. Cuadro similar hace 3 meses. Cumple con inhaladores de asma.',
    objective: 'T°: 38.8°C. FC: 102 lpm. FR: 22 rpm. Sat O2: 98%. Faringe: amígdalas ++, eritematosas con exudado blanquecino bilateral. Score Centor: 4 (exudado, adenopatías, fiebre, sin tos). Adenopatías cervicales dolorosas. Sin sibilancias.',
    assessment: 'Amigdalitis bacteriana aguda (probable estreptocócica, Centor 4). Asma bronquial estable.',
    plan: '1. Amoxicilina 500mg c/8h x 10 días. 2. Ibuprofeno 200mg c/8h si T>38.5°C. 3. Reposo, hidratación abundante. 4. Cultivo faríngeo (SOS). 5. Evaluar amigdalectomía si episodios recurrentes (ya 4to en un año). Control en 10 días.',
  }})
  await prisma.vitalSigns.create({ data: { consultationId: cr7a.id, height: 132, weight: 28, bmi: 16.1, temperature: 38.8, bloodPressureSys: 100, bloodPressureDia: 65, heartRate: 102, oxygenSat: 98, respiratoryRate: 22 }})
  await prisma.diagnosis.createMany({ data: [
    { consultationId: cr7a.id, code: 'J03.9', description: 'Amigdalitis aguda no especificada', type: 'PRIMARY', status: 'ACTIVE' },
    { consultationId: cr7a.id, code: 'J45.0', description: 'Asma predominantemente alérgica', type: 'SECONDARY', status: 'CHRONIC', notes: 'Estable, continuar manejo habitual' },
  ]})
  const rx7a = await prisma.prescription.create({ data: { consultationId: cr7a.id, patientId: p7.id, doctorId: doc2.id }})
  await prisma.prescriptionItem.createMany({ data: [
    { prescriptionId: rx7a.id, medication: 'Amoxicilina', dosage: '500 mg', frequency: 'Cada 8 horas con alimentos', duration: '10 días', quantity: '30 tabletas', instructions: 'Completar el tratamiento completo aunque mejore antes. No suspender.' },
    { prescriptionId: rx7a.id, medication: 'Ibuprofeno', dosage: '200 mg', frequency: 'Cada 8 horas si temperatura >38.5°C', duration: '5 días (SOS)', quantity: '15 tabletas', instructions: 'Solo si fiebre >38.5°C. Tomar con comida.' },
  ]})

  console.log('✅ Consultas históricas creadas.')

  // ── CITAS: HOY ──────────────────────────────────────────────────────────────

  console.log('\n📅 Creando agenda de hoy...')

  const todayApts = [
    { patientId: p1.id,  h: 8,  m: 0,  reason: 'Control mensual HTA + DM2',               status: 'COMPLETED', arrived: d(0, 7, 50) },
    { patientId: p3.id,  h: 8,  m: 30, reason: 'Control EPOC + disnea de esfuerzo',        status: 'CONFIRMED', arrived: d(0, 8, 20) },
    { patientId: p4.id,  h: 9,  m: 0,  reason: 'Control DM2 + resultados laboratorio',     status: 'CONFIRMED', arrived: null },
    { patientId: p6.id,  h: 9,  m: 30, reason: 'Seguimiento artritis gotosa',              status: 'CONFIRMED', arrived: null },
    { patientId: p9.id,  h: 10, m: 0,  reason: 'Control hipotiroidismo - TSH de control',  status: 'SCHEDULED', arrived: null },
    { patientId: p5.id,  h: 10, m: 30, reason: 'Control ansiedad + insomnio',              status: 'SCHEDULED', arrived: null },
    { patientId: p12.id, h: 11, m: 0,  reason: 'Control post-IAM + perfil lipídico',       status: 'SCHEDULED', arrived: null },
    { patientId: p7.id,  h: 11, m: 30, reason: 'Control post-amigdalitis + asma',          status: 'SCHEDULED', arrived: null },
  ]

  for (const apt of todayApts) {
    await prisma.appointment.create({ data: {
      patientId: apt.patientId,
      doctorId: doc1.id,
      dateTime: d(0, apt.h, apt.m),
      duration: 30,
      status: apt.status as 'COMPLETED' | 'CONFIRMED' | 'SCHEDULED',
      reason: apt.reason,
      arrivedAt: apt.arrived,
    }})
  }

  // ── CITAS: PASADAS (últimas 4 semanas) ─────────────────────────────────────

  const pastApts = [
    { patientId: p2.id,  days: -3,  h: 8,  reason: 'Control post-exacerbación asmática',    status: 'COMPLETED' },
    { patientId: p8.id,  days: -3,  h: 9,  reason: 'Lumbalgia aguda - primera consulta',     status: 'COMPLETED' },
    { patientId: p10.id, days: -5,  h: 10, reason: 'Dolor rodilla - lesión deportiva',        status: 'COMPLETED' },
    { patientId: p11.id, days: -7,  h: 8,  reason: 'Control prenatal 26 semanas',             status: 'COMPLETED' },
    { patientId: p1.id,  days: -8,  h: 9,  reason: 'Control urgente - TA elevada',            status: 'COMPLETED' },
    { patientId: p6.id,  days: -12, h: 10, reason: 'Crisis gotosa aguda',                     status: 'COMPLETED' },
    { patientId: p3.id,  days: -14, h: 8,  reason: 'Control quincenal EPOC',                  status: 'COMPLETED' },
    { patientId: p5.id,  days: -14, h: 11, reason: 'Primera consulta ansiedad',               status: 'COMPLETED' },
    { patientId: p12.id, days: -21, h: 9,  reason: 'Control mensual post-IAM',                status: 'COMPLETED' },
    { patientId: p9.id,  days: -21, h: 10, reason: 'Control tiroides + laboratorio',          status: 'NO_SHOW' },
    { patientId: p4.id,  days: -28, h: 8,  reason: 'Control DM2',                            status: 'COMPLETED' },
    { patientId: p2.id,  days: -20, h: 9,  reason: 'Exacerbación asmática',                   status: 'COMPLETED' },
    { patientId: p7.id,  days: -10, h: 11, reason: 'Amigdalitis + control asma',              status: 'COMPLETED' },
    { patientId: p8.id,  days: -7,  h: 9,  reason: 'Control lumbalgia',                       status: 'CANCELLED' },
  ]

  for (const apt of pastApts) {
    await prisma.appointment.create({ data: {
      patientId: apt.patientId,
      doctorId: doc1.id,
      dateTime: d(apt.days, apt.h),
      duration: 30,
      status: apt.status as 'COMPLETED' | 'NO_SHOW' | 'CANCELLED',
      reason: apt.reason,
    }})
  }

  // ── CITAS: PRÓXIMA SEMANA ──────────────────────────────────────────────────

  const futureApts = [
    { patientId: p2.id,  days: 2,  h: 9,  reason: 'Control asma - espirómetría', status: 'CONFIRMED' },
    { patientId: p1.id,  days: 3,  h: 8,  reason: 'Control mensual HTA+DM2',     status: 'SCHEDULED' },
    { patientId: p11.id, days: 4,  h: 10, reason: 'Control prenatal 30 semanas', status: 'CONFIRMED' },
    { patientId: p8.id,  days: 5,  h: 9,  reason: 'Reevaluación lumbalgia',      status: 'SCHEDULED' },
    { patientId: p3.id,  days: 7,  h: 8,  reason: 'Control quincenal EPOC+IC',   status: 'SCHEDULED' },
    { patientId: p4.id,  days: 7,  h: 11, reason: 'Control DM2 + nutrición',     status: 'SCHEDULED' },
    { patientId: p10.id, days: 8,  h: 10, reason: 'Fisioterapia rodilla - Rx',   status: 'SCHEDULED' },
    { patientId: p12.id, days: 10, h: 9,  reason: 'Control post-IAM + eco',      status: 'SCHEDULED' },
  ]

  for (const apt of futureApts) {
    await prisma.appointment.create({ data: {
      patientId: apt.patientId,
      doctorId: doc1.id,
      dateTime: d(apt.days, apt.h),
      duration: 30,
      status: apt.status as 'CONFIRMED' | 'SCHEDULED',
      reason: apt.reason,
    }})
  }

  console.log('✅ Agenda creada: 8 citas hoy, 14 pasadas, 8 futuras.')

  // ── RESUMEN ─────────────────────────────────────────────────────────────────

  const totals = {
    patients:     await prisma.patient.count(),
    appointments: await prisma.appointment.count(),
    records:      await prisma.clinicalRecord.count(),
    diagnoses:    await prisma.diagnosis.count(),
    rx:           await prisma.prescription.count(),
    allergies:    await prisma.allergy.count(),
  }

  console.log('\n🎉 Seed completado:')
  console.log(`   👥 Pacientes:    ${totals.patients}`)
  console.log(`   📅 Citas:        ${totals.appointments} (${todayApts.length} hoy)`)
  console.log(`   📋 Consultas:    ${totals.records}`)
  console.log(`   🔬 Diagnósticos: ${totals.diagnoses}`)
  console.log(`   💊 Recetas:      ${totals.rx}`)
  console.log(`   ⚠️  Alergias:     ${totals.allergies}`)
  console.log('\n🔑 Credenciales:')
  console.log('   Doctor: doctor@clinica.com / demo1234')
  console.log('   Admin:  admin@clinica.com / admin1234')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
