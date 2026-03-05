import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create users
  const adminPassword = await bcrypt.hash('admin1234', 10)
  const doctorPassword = await bcrypt.hash('demo1234', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinica.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@clinica.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const doctor1 = await prisma.user.upsert({
    where: { email: 'doctor@clinica.com' },
    update: {},
    create: {
      name: 'Dr. Carlos Mendoza',
      email: 'doctor@clinica.com',
      password: doctorPassword,
      role: 'DOCTOR',
      speciality: 'Medicina General',
    },
  })

  const doctor2 = await prisma.user.upsert({
    where: { email: 'dra.garcia@clinica.com' },
    update: {},
    create: {
      name: 'Dra. Ana García',
      email: 'dra.garcia@clinica.com',
      password: await bcrypt.hash('demo1234', 10),
      role: 'DOCTOR',
      speciality: 'Pediatría',
    },
  })

  const nurse = await prisma.user.upsert({
    where: { email: 'enfermera@clinica.com' },
    update: {},
    create: {
      name: 'María Torres',
      email: 'enfermera@clinica.com',
      password: await bcrypt.hash('demo1234', 10),
      role: 'NURSE',
    },
  })

  console.log('Users created:', { admin: admin.email, doctor1: doctor1.email, doctor2: doctor2.email, nurse: nurse.email })

  // Create patients
  const patient1 = await prisma.patient.upsert({
    where: { documentNumber: '12345678' },
    update: {},
    create: {
      firstName: 'Juan Carlos',
      lastName: 'Pérez López',
      documentType: 'DNI',
      documentNumber: '12345678',
      birthDate: new Date('1985-06-15'),
      gender: 'MALE',
      phone: '999111222',
      email: 'juan.perez@email.com',
      address: 'Av. Arequipa 1234, Miraflores',
      city: 'Lima',
      bloodType: 'O_POS',
      maritalStatus: 'MARRIED',
      occupation: 'Ingeniero',
      emergencyContactName: 'María Pérez',
      emergencyContactPhone: '999333444',
      emergencyContactRel: 'Esposa',
    },
  })

  const patient2 = await prisma.patient.upsert({
    where: { documentNumber: '87654321' },
    update: {},
    create: {
      firstName: 'María Elena',
      lastName: 'González Ríos',
      documentType: 'DNI',
      documentNumber: '87654321',
      birthDate: new Date('1992-03-22'),
      gender: 'FEMALE',
      phone: '988222333',
      email: 'maria.gonzalez@email.com',
      address: 'Jr. Lampa 456, Centro de Lima',
      city: 'Lima',
      bloodType: 'A_POS',
      maritalStatus: 'SINGLE',
      occupation: 'Docente',
      emergencyContactName: 'Roberto González',
      emergencyContactPhone: '988555666',
      emergencyContactRel: 'Padre',
    },
  })

  const patient3 = await prisma.patient.upsert({
    where: { documentNumber: '45678912' },
    update: {},
    create: {
      firstName: 'Roberto',
      lastName: 'Flores Sánchez',
      documentType: 'DNI',
      documentNumber: '45678912',
      birthDate: new Date('1978-11-08'),
      gender: 'MALE',
      phone: '977444555',
      address: 'Calle Las Flores 789, San Borja',
      city: 'Lima',
      bloodType: 'B_POS',
      maritalStatus: 'DIVORCED',
      occupation: 'Comerciante',
    },
  })

  const patient4 = await prisma.patient.upsert({
    where: { documentNumber: '65432187' },
    update: {},
    create: {
      firstName: 'Carmen Rosa',
      lastName: 'Vargas Chávez',
      documentType: 'DNI',
      documentNumber: '65432187',
      birthDate: new Date('1955-08-30'),
      gender: 'FEMALE',
      phone: '966333444',
      email: 'carmen.vargas@email.com',
      address: 'Av. Brasil 2345, Jesús María',
      city: 'Lima',
      bloodType: 'AB_POS',
      maritalStatus: 'WIDOWED',
      occupation: 'Jubilada',
      emergencyContactName: 'Luis Vargas',
      emergencyContactPhone: '966777888',
      emergencyContactRel: 'Hijo',
    },
  })

  console.log('Patients created:', 4)

  // Create allergies
  await prisma.allergy.createMany({
    data: [
      { patientId: patient1.id, allergen: 'Penicilina', reaction: 'Rash cutáneo, urticaria', severity: 'MODERATE' },
      { patientId: patient1.id, allergen: 'Aspirina', reaction: 'Broncoespasmo', severity: 'SEVERE' },
      { patientId: patient2.id, allergen: 'Mariscos', reaction: 'Urticaria generalizada', severity: 'MODERATE' },
      { patientId: patient4.id, allergen: 'Sulfonamidas', reaction: 'Reacción cutánea', severity: 'MILD' },
    ],
    skipDuplicates: true,
  })

  // Create medical backgrounds
  await prisma.medicalBackground.createMany({
    data: [
      { patientId: patient1.id, type: 'PERSONAL', description: 'Hipertensión arterial desde 2018', date: new Date('2018-01-01') },
      { patientId: patient1.id, type: 'FAMILY', description: 'Padre con diabetes tipo 2, madre con HTA' },
      { patientId: patient1.id, type: 'SURGICAL', description: 'Apendicectomía (2010)', date: new Date('2010-05-15') },
      { patientId: patient2.id, type: 'PERSONAL', description: 'Asma bronquial desde infancia' },
      { patientId: patient2.id, type: 'PHARMACOLOGICAL', description: 'Salbutamol inhalador según necesidad' },
      { patientId: patient4.id, type: 'PERSONAL', description: 'Diabetes mellitus tipo 2 desde 2010', date: new Date('2010-03-01') },
      { patientId: patient4.id, type: 'PERSONAL', description: 'Hipertensión arterial desde 2012', date: new Date('2012-06-01') },
      { patientId: patient4.id, type: 'PHARMACOLOGICAL', description: 'Metformina 850mg, Enalapril 10mg, Losartán 50mg' },
    ],
    skipDuplicates: true,
  })

  // Create clinical records
  const record1 = await prisma.clinicalRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      date: new Date('2024-12-10'),
      reason: 'Control de hipertensión arterial',
      subjective: 'Paciente refiere cefalea occipital ocasional, sin otros síntomas. Cumple con medicación antihipertensiva.',
      objective: 'Paciente en buen estado general. PA: 145/90 mmHg, FC: 78 lpm, FR: 16 rpm, T°: 36.5°C.',
      assessment: 'Hipertensión arterial esencial, moderadamente controlada.',
      plan: 'Ajuste de medicación: aumentar Enalapril a 20mg. Dieta hiposódica. Control en 1 mes.',
    },
  })

  await prisma.vitalSigns.create({
    data: {
      consultationId: record1.id,
      height: 175,
      weight: 82,
      bmi: 26.8,
      temperature: 36.5,
      bloodPressureSys: 145,
      bloodPressureDia: 90,
      heartRate: 78,
      oxygenSat: 98,
      respiratoryRate: 16,
    },
  })

  await prisma.diagnosis.create({
    data: {
      consultationId: record1.id,
      code: 'I10',
      description: 'Hipertensión esencial (primaria)',
      type: 'PRIMARY',
      status: 'CHRONIC',
    },
  })

  const record2 = await prisma.clinicalRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      date: new Date('2025-01-15'),
      reason: 'Dolor de cabeza y malestar general',
      subjective: 'Paciente refiere cefalea holocraneana de 3/10 de intensidad, malestar general, sin fiebre. PA matutina en casa: 150/95 mmHg.',
      objective: 'Consciente, orientado. PA: 148/92 mmHg. FC: 82 lpm. Resto sin alteraciones.',
      assessment: 'Hipertensión arterial no controlada. Cefalea tensional.',
      plan: 'Agregar Losartán 50mg al esquema. Reposo. Control en 2 semanas.',
    },
  })

  await prisma.vitalSigns.create({
    data: {
      consultationId: record2.id,
      height: 175,
      weight: 83,
      bmi: 27.1,
      temperature: 36.7,
      bloodPressureSys: 148,
      bloodPressureDia: 92,
      heartRate: 82,
      oxygenSat: 97,
      respiratoryRate: 17,
    },
  })

  const record3 = await prisma.clinicalRecord.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor1.id,
      date: new Date('2025-01-20'),
      reason: 'Crisis asmática leve',
      subjective: 'Paciente refiere disnea leve con sibilancias desde ayer, desencadenado por exposición a polvo. Usó salbutamol 2 puffs con mejoría parcial.',
      objective: 'Sat O2: 95%, FR: 22 rpm, FC: 98 lpm. Sibilancias espiratorias bilaterales a la auscultación.',
      assessment: 'Crisis asmática leve.',
      plan: 'Salbutamol nebulizado. Budesonida inhalada 200mcg c/12h por 7 días. Control en 1 semana.',
    },
  })

  await prisma.vitalSigns.create({
    data: {
      consultationId: record3.id,
      height: 162,
      weight: 58,
      bmi: 22.1,
      temperature: 36.8,
      bloodPressureSys: 115,
      bloodPressureDia: 75,
      heartRate: 98,
      oxygenSat: 95,
      respiratoryRate: 22,
    },
  })

  await prisma.diagnosis.createMany({
    data: [
      { consultationId: record3.id, code: 'J45.1', description: 'Asma alérgica leve intermitente', type: 'PRIMARY', status: 'ACTIVE' },
    ],
  })

  const record4 = await prisma.clinicalRecord.create({
    data: {
      patientId: patient4.id,
      doctorId: doctor1.id,
      date: new Date('2025-02-05'),
      reason: 'Control de diabetes e hipertensión',
      subjective: 'Paciente refiere polidipsia y poliuria en los últimos días. No ha llevado dieta adecuada. Toma medicamentos regularmente.',
      objective: 'PA: 155/95 mmHg. Glucosa capilar: 245 mg/dL. FC: 76 lpm. IMC: 29.5.',
      assessment: 'Diabetes mellitus tipo 2 descompensada. Hipertensión arterial no controlada.',
      plan: 'Ajuste de dosis Metformina 1g c/12h. Agregar Glibenclamida 5mg con el desayuno. Dieta diabética estricta. HbA1c en 3 meses.',
    },
  })

  await prisma.vitalSigns.create({
    data: {
      consultationId: record4.id,
      height: 158,
      weight: 73.5,
      bmi: 29.5,
      temperature: 36.6,
      bloodPressureSys: 155,
      bloodPressureDia: 95,
      heartRate: 76,
      oxygenSat: 97,
      respiratoryRate: 16,
      glucoseLevel: 245,
    },
  })

  await prisma.diagnosis.createMany({
    data: [
      { consultationId: record4.id, code: 'E11', description: 'Diabetes mellitus tipo 2', type: 'PRIMARY', status: 'CHRONIC' },
      { consultationId: record4.id, code: 'I10', description: 'Hipertensión esencial', type: 'SECONDARY', status: 'CHRONIC' },
    ],
  })

  console.log('Clinical records created:', 4)

  // Create appointments
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  await prisma.appointment.createMany({
    data: [
      {
        patientId: patient1.id,
        doctorId: doctor1.id,
        dateTime: new Date(today.getTime() + 9 * 3600000),
        duration: 30,
        status: 'CONFIRMED',
        reason: 'Control mensual HTA',
      },
      {
        patientId: patient2.id,
        doctorId: doctor1.id,
        dateTime: new Date(today.getTime() + 10 * 3600000),
        duration: 30,
        status: 'SCHEDULED',
        reason: 'Control asma',
      },
      {
        patientId: patient3.id,
        doctorId: doctor1.id,
        dateTime: new Date(today.getTime() + 11 * 3600000),
        duration: 45,
        status: 'SCHEDULED',
        reason: 'Primera consulta',
      },
      {
        patientId: patient4.id,
        doctorId: doctor1.id,
        dateTime: new Date(today.getTime() + 15 * 3600000),
        duration: 30,
        status: 'CONFIRMED',
        reason: 'Control diabetes',
      },
      {
        patientId: patient1.id,
        doctorId: doctor2.id,
        dateTime: new Date(today.getTime() + 2 * 24 * 3600000 + 9 * 3600000),
        duration: 30,
        status: 'SCHEDULED',
        reason: 'Interconsulta cardiología',
      },
      {
        patientId: patient2.id,
        doctorId: doctor1.id,
        dateTime: new Date(today.getTime() - 7 * 24 * 3600000 + 10 * 3600000),
        duration: 30,
        status: 'COMPLETED',
        reason: 'Control post crisis asmática',
      },
      {
        patientId: patient3.id,
        doctorId: doctor1.id,
        dateTime: new Date(today.getTime() - 3 * 24 * 3600000 + 14 * 3600000),
        duration: 30,
        status: 'NO_SHOW',
        reason: 'Chequeo general',
      },
    ],
    skipDuplicates: true,
  })

  console.log('Appointments created')
  console.log('\n✅ Seed completed successfully!')
  console.log('\nDemo credentials:')
  console.log('  Doctor: doctor@clinica.com / demo1234')
  console.log('  Admin: admin@clinica.com / admin1234')
  console.log('  Nurse: enfermera@clinica.com / demo1234')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
