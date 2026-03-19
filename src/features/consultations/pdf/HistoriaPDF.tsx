import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'
import { calculateAge } from '@/lib/utils'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    marginBottom: 6,
    backgroundColor: '#eff6ff',
    padding: '4 6',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 130,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
  },
  value: {
    flex: 1,
    color: '#1e293b',
  },
  consultationCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 10,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  consultationDate: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#1e40af',
  },
  consultationDoctor: {
    fontSize: 9,
    color: '#64748b',
  },
  soapLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginTop: 4,
    marginBottom: 1,
  },
  soapValue: {
    color: '#334155',
    marginBottom: 3,
  },
  diagnosisTag: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '2 5',
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 2,
    fontSize: 9,
  },
  diagnosisRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  vitalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  vitalItem: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: '2 6',
    borderRadius: 3,
    fontSize: 9,
    marginRight: 4,
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#94a3b8',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  noData: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
})

function formatDate(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateLong(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

type VitalSigns = {
  height?: number | null
  weight?: number | null
  bmi?: number | null
  temperature?: number | null
  bloodPressureSys?: number | null
  bloodPressureDia?: number | null
  heartRate?: number | null
  oxygenSat?: number | null
  respiratoryRate?: number | null
  glucoseLevel?: number | null
}

type Diagnosis = {
  id: string
  code: string
  description: string
  type: string
  status: string
}

type ClinicalRecord = {
  id: string
  date: Date
  reason: string
  subjective?: string | null
  objective?: string | null
  assessment?: string | null
  plan?: string | null
  notes?: string | null
  doctor: { name: string; speciality?: string | null }
  vitalSigns?: VitalSigns | null
  diagnoses: Diagnosis[]
}

type Patient = {
  id: string
  firstName: string
  lastName: string
  documentType: string
  documentNumber: string
  birthDate: Date
  gender: string
  phone?: string | null
  email?: string | null
  clinicalRecords: ClinicalRecord[]
}

interface HistoriaPDFProps {
  patient: Patient
  printDate: string
  orgName?: string
}

export function HistoriaPDF({ patient, printDate, orgName = 'Feliz Horizonte' }: HistoriaPDFProps) {
  const age = calculateAge(patient.birthDate)

  const genderMap: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Femenino', OTHER: 'Otro' }
  const docTypeMap: Record<string, string> = { DNI: 'DNI', CE: 'C.E.', PASSPORT: 'Pasaporte', RUC: 'RUC' }
  const diagStatusMap: Record<string, string> = { ACTIVE: 'Activo', RESOLVED: 'Resuelto', CHRONIC: 'Crónico' }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{orgName}</Text>
          <Text style={styles.headerSubtitle}>Historia Clínica Electrónica &bull; Impreso el {printDate}</Text>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Paciente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre completo:</Text>
            <Text style={styles.value}>{patient.firstName} {patient.lastName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{docTypeMap[patient.documentType] || patient.documentType}:</Text>
            <Text style={styles.value}>{patient.documentNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de nacimiento:</Text>
            <Text style={styles.value}>{formatDateLong(patient.birthDate)} ({age} años)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Género:</Text>
            <Text style={styles.value}>{genderMap[patient.gender] || patient.gender}</Text>
          </View>
          {patient.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Teléfono:</Text>
              <Text style={styles.value}>{patient.phone}</Text>
            </View>
          )}
          {patient.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{patient.email}</Text>
            </View>
          )}
        </View>

        {/* Clinical Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Historia Clínica ({patient.clinicalRecords.length} consulta{patient.clinicalRecords.length !== 1 ? 's' : ''})
          </Text>

          {patient.clinicalRecords.length === 0 ? (
            <Text style={styles.noData}>No hay consultas registradas.</Text>
          ) : (
            patient.clinicalRecords.map((record) => (
              <View key={record.id} style={styles.consultationCard} wrap={false}>
                <View style={styles.consultationHeader}>
                  <View>
                    <Text style={styles.consultationDate}>{formatDate(record.date)}</Text>
                    <Text style={styles.consultationDoctor}>
                      Dr./Dra. {record.doctor.name}
                      {record.doctor.speciality ? ` — ${record.doctor.speciality}` : ''}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 9, color: '#475569', fontFamily: 'Helvetica-Bold' }}>
                    Motivo: {record.reason}
                  </Text>
                </View>

                {record.subjective && (
                  <View>
                    <Text style={styles.soapLabel}>Subjetivo:</Text>
                    <Text style={styles.soapValue}>{record.subjective}</Text>
                  </View>
                )}
                {record.objective && (
                  <View>
                    <Text style={styles.soapLabel}>Objetivo:</Text>
                    <Text style={styles.soapValue}>{record.objective}</Text>
                  </View>
                )}
                {record.assessment && (
                  <View>
                    <Text style={styles.soapLabel}>Evaluación:</Text>
                    <Text style={styles.soapValue}>{record.assessment}</Text>
                  </View>
                )}
                {record.plan && (
                  <View>
                    <Text style={styles.soapLabel}>Plan:</Text>
                    <Text style={styles.soapValue}>{record.plan}</Text>
                  </View>
                )}

                {/* Vital Signs */}
                {record.vitalSigns && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={styles.soapLabel}>Signos Vitales:</Text>
                    <View style={styles.vitalRow}>
                      {record.vitalSigns.height && (
                        <Text style={styles.vitalItem}>Talla: {record.vitalSigns.height} cm</Text>
                      )}
                      {record.vitalSigns.weight && (
                        <Text style={styles.vitalItem}>Peso: {record.vitalSigns.weight} kg</Text>
                      )}
                      {record.vitalSigns.bmi && (
                        <Text style={styles.vitalItem}>IMC: {record.vitalSigns.bmi.toFixed(1)}</Text>
                      )}
                      {record.vitalSigns.temperature && (
                        <Text style={styles.vitalItem}>Temp: {record.vitalSigns.temperature}°C</Text>
                      )}
                      {record.vitalSigns.bloodPressureSys && record.vitalSigns.bloodPressureDia && (
                        <Text style={styles.vitalItem}>
                          PA: {record.vitalSigns.bloodPressureSys}/{record.vitalSigns.bloodPressureDia} mmHg
                        </Text>
                      )}
                      {record.vitalSigns.heartRate && (
                        <Text style={styles.vitalItem}>FC: {record.vitalSigns.heartRate} lpm</Text>
                      )}
                      {record.vitalSigns.oxygenSat && (
                        <Text style={styles.vitalItem}>SpO2: {record.vitalSigns.oxygenSat}%</Text>
                      )}
                      {record.vitalSigns.respiratoryRate && (
                        <Text style={styles.vitalItem}>FR: {record.vitalSigns.respiratoryRate} rpm</Text>
                      )}
                      {record.vitalSigns.glucoseLevel && (
                        <Text style={styles.vitalItem}>Glucosa: {record.vitalSigns.glucoseLevel} mg/dL</Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Diagnoses */}
                {record.diagnoses.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={styles.soapLabel}>Diagnósticos CIE-10:</Text>
                    <View style={styles.diagnosisRow}>
                      {record.diagnoses.map((d) => (
                        <Text key={d.id} style={styles.diagnosisTag}>
                          [{d.code}] {d.description} — {diagStatusMap[d.status] || d.status}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{orgName} — Historia Clínica</Text>
          <Text>Generado el {printDate}</Text>
        </View>
      </Page>
    </Document>
  )
}
