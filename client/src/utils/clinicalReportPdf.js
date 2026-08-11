import jsPDF from 'jspdf'

const UNITS = {
  weight: 'kg',
  glucose: 'mg/dL',
  bloodPressure: 'mmHg',
  heartRate: 'bpm',
  cholesterol: 'mg/dL',
  triglycerides: 'mg/dL',
}

const TYPE_LABELS = {
  weight: 'Peso / IMC',
  glucose: 'Glucosa en Sangre',
  bloodPressure: 'Presión Arterial',
  heartRate: 'Frecuencia Cardíaca',
  cholesterol: 'Colesterol Total',
  triglycerides: 'Triglicéridos',
}

export async function generateClinicalReportPDF({
  patient = {},
  medicalHistory = {},
  stats = {},
  records = [],
  medications = [],
  supplements = [],
  alerts = [],
  doctor = {},
  dateFrom = null,
  dateTo = null,
  dateRangeLabel = 'Historial Completo',
}) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 14
  let y = margin

  // Palette
  const primaryColor = [135, 18, 51]    // Guinda #871233
  const darkSurface = [30, 41, 59]      // Slate #1e293b
  const mutedText = [100, 116, 139]     // Slate #64748b
  const lightBg = [248, 250, 252]       // Slate #f8fafc

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 20) {
      pdf.addPage()
      y = margin + 8
      return true
    }
    return false
  }

  // Filter records
  const filteredRecords = records.filter(r => {
    if (!dateFrom && !dateTo) return true
    const d = new Date(r.recordedAt)
    if (dateFrom && d < new Date(dateFrom + 'T00:00:00')) return false
    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
    return true
  }).sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))

  // ── 1. ENCABEZADO MEMBRETADO ────────────────────────────────────────────────
  pdf.setFillColor(...primaryColor)
  pdf.rect(0, 0, pageWidth, 24, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11.5)
  pdf.text('JÓVENES CON SALUD — EXPEDIENTE CLÍNICO Y REPORTE DE SEGUIMIENTO', margin, 11)

  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'normal')
  pdf.text(
    `Folio: JCS-ECE-${Date.now().toString().slice(-6)} | Emisión: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} | Norma: NOM-024-SSA3-2012 / HL7 FHIR`,
    margin,
    18
  )

  y = 29

  // ── 2. DATOS DEL MÉDICO Y FICHA DE IDENTIFICACIÓN DEL PACIENTE ──────────────
  const mh = medicalHistory || {}

  pdf.setFillColor(...lightBg)
  pdf.roundedRect(margin, y, pageWidth - (margin * 2), 38, 3, 3, 'F')
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(margin, y, pageWidth - (margin * 2), 38, 3, 3, 'S')

  // Columna Izquierda: Médico Tratante
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.text('MÉDICO TRATANTE / RESPONSABLE', margin + 5, y + 6)

  pdf.setTextColor(...darkSurface)
  pdf.setFontSize(9)
  pdf.text(`Dr(a). ${doctor.name || 'Médico Asignado'}`, margin + 5, y + 12)

  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...mutedText)
  pdf.text(`Cédula Prof: ${doctor.professionalLicense || 'MÉDICO-REF'}`, margin + 5, y + 18)
  pdf.text(`Especialidad: ${doctor.specialty || 'Medicina General'}`, margin + 5, y + 24)
  pdf.text(`Institución: Jóvenes con Salud - ECE`, margin + 5, y + 30)

  // Columna Derecha: Ficha de Identificación del Paciente
  const colRightX = margin + 92
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.text('FICHA DE IDENTIFICACIÓN DEL PACIENTE', colRightX, y + 6)

  pdf.setTextColor(...darkSurface)
  pdf.setFontSize(9)
  pdf.text(patient.name || 'Paciente', colRightX, y + 12)

  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...mutedText)
  pdf.text(`CURP: ${mh.curp || 'No especificado'}`, colRightX, y + 18)
  pdf.text(`NSS / Afiliación: ${mh.nss || 'No especificado'}`, colRightX, y + 24)
  pdf.text(`Tipo de Sangre: ${mh.bloodType || 'No especificado'}  |  Donador: ${mh.organDonor ? 'Sí' : 'No'}`, colRightX, y + 30)

  if (mh.emergencyContactName) {
    pdf.text(`Contacto Emergencia: ${mh.emergencyContactName} (${mh.emergencyContactRelation || 'Familiar'}) - ${mh.emergencyContactPhone || 'S/T'}`, colRightX, y + 35)
  }

  y += 43

  // ── 3. ANTECEDENTES MÉDICO-CLÍNICOS Y ESTILO DE VIDA ──────────────────────
  checkPageBreak(35)

  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.text('1. ANTECEDENTES CLÍNICOS Y ESTILO DE VIDA', margin, y)
  y += 4

  const allergiesList = Array.isArray(mh.allergies) && mh.allergies.length > 0 ? mh.allergies.join(', ') : 'Sin alergias conocidas'
  const hereditaryList = Array.isArray(mh.hereditaryDiseases) && mh.hereditaryDiseases.length > 0 ? mh.hereditaryDiseases.join(', ') : 'Ninguno reportado'
  const pathologiesList = Array.isArray(mh.personalPathologies) && mh.personalPathologies.length > 0 ? mh.personalPathologies.join(', ') : 'Ninguna patología previa'
  const nph = mh.nonPathologicalHistory || {}

  pdf.setFillColor(255, 255, 255)
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(margin, y, pageWidth - (margin * 2), 26, 2, 2, 'S')

  pdf.setFontSize(7.5)
  pdf.setTextColor(...darkSurface)
  
  pdf.setFont('helvetica', 'bold')
  pdf.text('Alergias / Reacciones Adversas:', margin + 4, y + 5)
  pdf.setFont('helvetica', 'normal')
  pdf.text(allergiesList.length > 75 ? allergiesList.substring(0, 75) + '...' : allergiesList, margin + 48, y + 5)

  pdf.setFont('helvetica', 'bold')
  pdf.text('Antecedentes Heredofamiliares:', margin + 4, y + 10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(hereditaryList.length > 75 ? hereditaryList.substring(0, 75) + '...' : hereditaryList, margin + 48, y + 10)

  pdf.setFont('helvetica', 'bold')
  pdf.text('Antecedentes Patológicos:', margin + 4, y + 15)
  pdf.setFont('helvetica', 'normal')
  pdf.text(pathologiesList.length > 75 ? pathologiesList.substring(0, 75) + '...' : pathologiesList, margin + 48, y + 15)

  pdf.setFont('helvetica', 'bold')
  pdf.text('Hábitos de Estilo de Vida:', margin + 4, y + 20)
  pdf.setFont('helvetica', 'normal')
  const lifestyleStr = `Tabaquismo: ${nph.smoking || 'Nunca'} | Alcohol: ${nph.alcohol || 'Nunca'} | Ejercicio: ${nph.exercise || 'Ocasional'} | Dieta: ${nph.diet || 'Equilibrada'}`
  pdf.text(lifestyleStr, margin + 48, y + 20)

  y += 30

  // ── 4. DIAGNÓSTICOS CLÍNICOS CIE-10 (SI EXISTEN) ──────────────────────────
  if (Array.isArray(mh.diagnoses) && mh.diagnoses.length > 0) {
    checkPageBreak(25)
    pdf.setTextColor(...primaryColor)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9.5)
    pdf.text('2. DIAGNÓSTICOS CLÍNICOS Y CONDICIONES (CIE-10)', margin, y)
    y += 4

    pdf.setFillColor(135, 18, 51)
    pdf.rect(margin, y, pageWidth - (margin * 2), 5.5, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Código CIE', margin + 4, y + 3.8)
    pdf.text('Diagnóstico / Condición', margin + 35, y + 3.8)
    pdf.text('Estado Clínico', margin + 125, y + 3.8)
    pdf.text('Fecha Diagnóstico', margin + 160, y + 3.8)
    y += 5.5

    let isDiagEven = false
    mh.diagnoses.forEach(diag => {
      checkPageBreak(6)
      pdf.setFillColor(isDiagEven ? 248 : 255, isDiagEven ? 250 : 255, isDiagEven ? 252 : 255)
      pdf.rect(margin, y, pageWidth - (margin * 2), 5.5, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 5.5, pageWidth - margin, y + 5.5)

      pdf.setTextColor(...darkSurface)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.text(diag.code || 'CIE-10', margin + 4, y + 3.8)
      pdf.setFont('helvetica', 'normal')
      pdf.text((diag.name || '').substring(0, 50), margin + 35, y + 3.8)
      pdf.text(diag.status || 'En Tratamiento', margin + 125, y + 3.8)
      pdf.text(diag.date ? new Date(diag.date).toLocaleDateString('es-MX') : '—', margin + 160, y + 3.8)
      y += 5.5
      isDiagEven = !isDiagEven
    })
    y += 4
  }

  // ── 5. CARTILLA / ESQUEMA DE VACUNACIÓN (SI EXISTEN) ──────────────────────
  if (Array.isArray(mh.vaccines) && mh.vaccines.length > 0) {
    checkPageBreak(25)
    pdf.setTextColor(...primaryColor)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9.5)
    pdf.text('3. ESQUEMA DE VACUNACIÓN REGISTRADO', margin, y)
    y += 4

    pdf.setFillColor(3, 105, 161) // Blue
    pdf.rect(margin, y, pageWidth - (margin * 2), 5.5, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Biológico / Vacuna', margin + 4, y + 3.8)
    pdf.text('Fecha Aplicación', margin + 70, y + 3.8)
    pdf.text('Lote', margin + 110, y + 3.8)
    pdf.text('Institución', margin + 140, y + 3.8)
    pdf.text('Estado', margin + 175, y + 3.8)
    y += 5.5

    let isVacEven = false
    mh.vaccines.forEach(vac => {
      checkPageBreak(6)
      pdf.setFillColor(isVacEven ? 248 : 255, isVacEven ? 250 : 255, isVacEven ? 252 : 255)
      pdf.rect(margin, y, pageWidth - (margin * 2), 5.5, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 5.5, pageWidth - margin, y + 5.5)

      pdf.setTextColor(...darkSurface)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.text((vac.name || '').substring(0, 38), margin + 4, y + 3.8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(vac.date ? new Date(vac.date).toLocaleDateString('es-MX') : '—', margin + 70, y + 3.8)
      pdf.text(vac.lot || '—', margin + 110, y + 3.8)
      pdf.text((vac.institution || 'IMSS/SS').substring(0, 22), margin + 140, y + 3.8)
      pdf.text(vac.status || 'Aplicada', margin + 175, y + 3.8)
      y += 5.5
      isVacEven = !isVacEven
    })
    y += 4
  }

  // ── 6. RESUMEN DE ÚLTIMOS INDICADORES CLÍNICOS ────────────────────────────
  checkPageBreak(35)
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.text('4. RESUMEN DE INDICADORES FISIOLÓGICOS DE SALUD', margin, y)
  y += 4

  pdf.setFillColor(...primaryColor)
  pdf.rect(margin, y, pageWidth - (margin * 2), 5.5, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Indicador Clínico', margin + 4, y + 3.8)
  pdf.text('Último Valor', margin + 55, y + 3.8)
  pdf.text('Unidad', margin + 90, y + 3.8)
  pdf.text('Estado', margin + 120, y + 3.8)
  pdf.text('Fecha Último Registro', margin + 155, y + 3.8)
  y += 5.5

  const metricsList = [
    { key: 'weight', label: 'Peso Corporal / IMC' },
    { key: 'glucose', label: 'Glucosa en Sangre' },
    { key: 'bloodPressure', label: 'Presión Arterial' },
    { key: 'heartRate', label: 'Frecuencia Cardíaca' },
    { key: 'cholesterol', label: 'Colesterol Total' },
    { key: 'triglycerides', label: 'Triglicéridos' },
  ]

  let isEven = false
  metricsList.forEach((m) => {
    checkPageBreak(6)
    const latestRec = stats?.latest?.[m.key] || filteredRecords.find(r => r.type === m.key)
    const valDisplay = latestRec
      ? (m.key === 'bloodPressure' ? `${latestRec.value}/${latestRec.value2}` : `${latestRec.value}`)
      : 'Sin datos'
    const unitDisplay = UNITS[m.key] || ''
    const dateDisplay = latestRec?.recordedAt
      ? new Date(latestRec.recordedAt).toLocaleDateString('es-MX')
      : '—'

    pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
    pdf.rect(margin, y, pageWidth - (margin * 2), 5.5, 'F')
    pdf.setDrawColor(241, 245, 249)
    pdf.line(margin, y + 5.5, pageWidth - margin, y + 5.5)

    pdf.setTextColor(...darkSurface)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.text(m.label, margin + 4, y + 3.8)

    pdf.setFont('helvetica', 'normal')
    pdf.text(valDisplay, margin + 55, y + 3.8)
    pdf.text(unitDisplay, margin + 90, y + 3.8)
    pdf.text(latestRec ? 'Registrado' : 'Pendiente', margin + 120, y + 3.8)
    pdf.text(dateDisplay, margin + 155, y + 3.8)

    y += 5.5
    isEven = !isEven
  })

  y += 5

  // ── 7. TRATAMIENTOS Y MEDICAMENTOS ACTIVOS ───────────────────────────────
  checkPageBreak(30)
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.text('5. ESQUEMA DE MEDICAMENTOS Y SUPLEMENTOS ACTIVOS', margin, y)
  y += 4

  pdf.setFillColor(16, 185, 129) // Emerald
  pdf.rect(margin, y, pageWidth - (margin * 2), 5.5, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Nombre del Tratamiento', margin + 4, y + 3.8)
  pdf.text('Dosis', margin + 65, y + 3.8)
  pdf.text('Frecuencia / Horarios', margin + 105, y + 3.8)
  pdf.text('Tipo', margin + 165, y + 3.8)
  y += 5.5

  const allTreatments = [
    ...medications.map(m => ({ ...m, category: 'Medicamento' })),
    ...supplements.map(s => ({ ...s, category: 'Suplemento' })),
  ]

  if (allTreatments.length === 0) {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(margin, y, pageWidth - (margin * 2), 6, 'F')
    pdf.setTextColor(...mutedText)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(7)
    pdf.text('El paciente no cuenta con medicamentos ni suplementos registrados actualmente.', margin + 4, y + 3.8)
    y += 6
  } else {
    isEven = false
    allTreatments.forEach((t) => {
      checkPageBreak(6)
      pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
      pdf.rect(margin, y, pageWidth - (margin * 2), 5.5, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 5.5, pageWidth - margin, y + 5.5)

      pdf.setTextColor(...darkSurface)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.text(t.name || 'Sin nombre', margin + 4, y + 3.8)

      pdf.setFont('helvetica', 'normal')
      pdf.text(t.dose || '—', margin + 65, y + 3.8)
      const schedStr = t.schedules?.length > 0 ? t.schedules.join(', ') : (t.frequency || '—')
      pdf.text(schedStr.length > 35 ? schedStr.substring(0, 35) + '...' : schedStr, margin + 105, y + 3.8)
      pdf.text(t.category, margin + 165, y + 3.8)

      y += 5.5
      isEven = !isEven
    })
  }

  y += 5

  // ── 8. NOTAS CLÍNICAS DE EVOLUCIÓN (SOAP) (SI EXISTEN) ─────────────────────
  if (Array.isArray(mh.clinicalNotes) && mh.clinicalNotes.length > 0) {
    checkPageBreak(25)
    pdf.setTextColor(...primaryColor)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9.5)
    pdf.text('6. NOTAS CLÍNICAS DE EVOLUCIÓN (SOAP)', margin, y)
    y += 4

    mh.clinicalNotes.slice(0, 5).forEach(note => {
      checkPageBreak(22)
      pdf.setFillColor(248, 250, 252)
      pdf.setDrawColor(226, 232, 240)
      pdf.roundedRect(margin, y, pageWidth - (margin * 2), 20, 2, 2, 'FD')

      pdf.setFontSize(7)
      pdf.setTextColor(...primaryColor)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Fecha: ${note.date ? new Date(note.date).toLocaleDateString('es-MX') : '—'} | Médico: ${note.doctor || 'Dr. Tratante'}`, margin + 3, y + 4)

      pdf.setTextColor(...darkSurface)
      pdf.setFont('helvetica', 'normal')
      if (note.subjective) pdf.text(`Subjetivo (S): ${(note.subjective || '').substring(0, 110)}`, margin + 3, y + 8)
      if (note.objective) pdf.text(`Objetivo (O): ${(note.objective || '').substring(0, 110)}`, margin + 3, y + 12)
      if (note.plan) pdf.text(`Plan (P): ${(note.plan || '').substring(0, 110)}`, margin + 3, y + 16)

      y += 22
    })
    y += 4
  }

  // ── 9. SECCIÓN DE FIRMA Y CONFIDENCIALIDAD ──────────────────────────────────
  checkPageBreak(35)
  y += 5

  pdf.setDrawColor(203, 213, 225)
  pdf.line(margin + 55, y + 10, margin + 130, y + 10)

  pdf.setTextColor(...darkSurface)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.text(`Dr(a). ${doctor.name || 'Médico Tratante'}`, pageWidth / 2, y + 15, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...mutedText)
  pdf.text(`Cédula Profesional: ${doctor.professionalLicense || 'N/A'}`, pageWidth / 2, y + 19, { align: 'center' })
  pdf.text('Firma y Sello del Médico Responsable', pageWidth / 2, y + 23, { align: 'center' })

  pdf.setFontSize(6.5)
  pdf.setTextColor(148, 163, 184)
  pdf.text('Documento oficial generado por la plataforma Jóvenes con Salud conforme a la NOM-024-SSA3-2012. Reservado para uso médico exclusivo.', pageWidth / 2, pageHeight - 6, { align: 'center' })

  const cleanName = (patient.name || 'paciente').replace(/[^a-zA-Z0-9]/g, '_')
  pdf.save(`Expediente_Clinico_${cleanName}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
