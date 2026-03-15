import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  orgBlock: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },
  orgSub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  doctorBlock: {
    alignItems: 'flex-end',
  },
  doctorName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  doctorDetail: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  rxTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
    marginBottom: 6,
  },
  patientRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  patientField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 7,
    color: '#94a3b8',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2,
  },
  medicationsSection: {
    marginBottom: 20,
  },
  medicationItem: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  medicationName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  medicationDetail: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 1,
  },
  medicationInstructions: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  notesSection: {
    marginTop: 10,
    padding: '6 8',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  notesText: {
    fontSize: 9,
    color: '#475569',
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBlock: {
    alignItems: 'center',
    width: 200,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    width: '100%',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#475569',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#94a3b8',
    fontSize: 7,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
  },
})

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export type RecetaItem = {
  medication: string
  dosage: string
  frequency: string
  duration: string
  quantity?: string | null
  instructions?: string | null
}

export type RecetaPDFProps = {
  prescription: {
    id: string
    createdAt: Date | string
    notes?: string | null
    items: RecetaItem[]
    doctor: {
      name: string
      speciality?: string | null
      licenseNumber?: string | null
    }
    patient: {
      firstName: string
      lastName: string
      documentType: string
      documentNumber: string
    }
  }
  orgName?: string
}

const docTypeMap: Record<string, string> = {
  DNI: 'DNI',
  CE: 'C.E.',
  PASSPORT: 'Pasaporte',
  RUC: 'RUC',
}

export function RecetaPDF({ prescription, orgName = 'Consultorio Médico' }: RecetaPDFProps) {
  const { doctor, patient, items } = prescription

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.orgBlock}>
            <Text style={styles.orgName}>{orgName}</Text>
            <Text style={styles.orgSub}>Receta Médica</Text>
          </View>
          <View style={styles.doctorBlock}>
            <Text style={styles.doctorName}>Dr./Dra. {doctor.name}</Text>
            {doctor.speciality && (
              <Text style={styles.doctorDetail}>{doctor.speciality}</Text>
            )}
            {doctor.licenseNumber && (
              <Text style={styles.doctorDetail}>CMP: {doctor.licenseNumber}</Text>
            )}
          </View>
        </View>

        {/* Rx symbol + Date */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <Text style={styles.rxTitle}>℞</Text>
          <Text style={{ fontSize: 9, color: '#64748b' }}>
            Fecha: {formatDate(prescription.createdAt)}
          </Text>
        </View>

        {/* Patient */}
        <View style={styles.patientRow}>
          <View style={styles.patientField}>
            <Text style={styles.fieldLabel}>Paciente</Text>
            <Text style={styles.fieldValue}>{patient.firstName} {patient.lastName}</Text>
          </View>
          <View style={{ width: 130 }}>
            <Text style={styles.fieldLabel}>{docTypeMap[patient.documentType] || patient.documentType}</Text>
            <Text style={styles.fieldValue}>{patient.documentNumber}</Text>
          </View>
        </View>

        {/* Medications */}
        <View style={styles.medicationsSection}>
          {items.map((item, i) => (
            <View key={i} style={styles.medicationItem}>
              <Text style={styles.medicationName}>
                {i + 1}. {item.medication} {item.dosage}
              </Text>
              <Text style={styles.medicationDetail}>
                Frecuencia: {item.frequency} &bull; Duración: {item.duration}
                {item.quantity ? ` &bull; Cantidad: ${item.quantity}` : ''}
              </Text>
              {item.instructions && (
                <Text style={styles.medicationInstructions}>
                  * {item.instructions}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Notes */}
        {prescription.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Indicaciones</Text>
            <Text style={styles.notesText}>{prescription.notes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Dr./Dra. {doctor.name}</Text>
            {doctor.licenseNumber && (
              <Text style={styles.signatureLabel}>CMP {doctor.licenseNumber}</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{orgName}</Text>
          <Text>Receta N° {prescription.id.slice(-8).toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  )
}
