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
  patient,
  stats,
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

  // Colors
  const primaryColor = [135, 18, 51]    // Guinda #871233
  const darkSurface = [30, 41, 59]      // Slate #1e293b
  const mutedText = [100, 116, 139]     // Slate #64748b
  const lightBg = [248, 250, 252]       // Slate #f8fafc

  // Filtrar registros según el rango de fechas seleccionado
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
  pdf.setFontSize(13)
  pdf.text('JÓVENES CON SALUD — INFORME CLÍNICO DE SEGUIMIENTO', margin, 11)

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(
    `Folio: JCS-INF-${Date.now().toString().slice(-6)} | Emisión: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} | Período: ${dateRangeLabel}`,
    margin,
    18
  )

  y = 30

  // ── 2. DATOS DEL MÉDICO Y PACIENTE ──────────────────────────────────────────
  pdf.setFillColor(...lightBg)
  pdf.roundedRect(margin, y, pageWidth - (margin * 2), 32, 3, 3, 'F')
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(margin, y, pageWidth - (margin * 2), 32, 3, 3, 'S')

  // Columna Izquierda: Médico
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('MÉDICO TRATANTE', margin + 6, y + 7)

  pdf.setTextColor(...darkSurface)
  pdf.setFontSize(9.5)
  pdf.text(`Dr(a). ${doctor.name || 'Médico Asignado'}`, margin + 6, y + 14)

  pdf.setFontSize(7.8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...mutedText)
  pdf.text(`Cédula Prof: ${doctor.professionalLicense || 'N/A'}`, margin + 6, y + 20)
  pdf.text(`Especialidad: ${doctor.specialty || 'Medicina General'}`, margin + 6, y + 26)

  // Columna Derecha: Paciente
  const colRightX = margin + 95
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('DATOS DEL PACIENTE', colRightX, y + 7)

  pdf.setTextColor(...darkSurface)
  pdf.setFontSize(9.5)
  pdf.text(patient.name || 'Paciente', colRightX, y + 14)

  pdf.setFontSize(7.8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...mutedText)
  pdf.text(`Correo: ${patient.email || 'N/A'}`, colRightX, y + 20)
  pdf.text(`Fecha Nac: ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('es-MX') : 'No especificada'}`, colRightX, y + 26)

  y += 38

  // ── 3. RESUMEN DE ÚLTIMOS INDICADORES CLÍNICOS ────────────────────────────
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('1. RESUMEN DE INDICADORES DE SALUD PRINCIPALES', margin, y)

  y += 5

  // Cabecera de Tabla
  pdf.setFillColor(...primaryColor)
  pdf.rect(margin, y, pageWidth - (margin * 2), 6.5, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Indicador Clínico', margin + 4, y + 4.5)
  pdf.text('Último Valor', margin + 55, y + 4.5)
  pdf.text('Unidad', margin + 90, y + 4.5)
  pdf.text('Estado', margin + 120, y + 4.5)
  pdf.text('Fecha', margin + 165, y + 4.5)

  y += 6.5

  const metricsList = [
    { key: 'weight', label: 'Peso Corporal' },
    { key: 'glucose', label: 'Glucosa en Sangre' },
    { key: 'bloodPressure', label: 'Presión Arterial' },
    { key: 'heartRate', label: 'Frecuencia Cardíaca' },
    { key: 'cholesterol', label: 'Colesterol Total' },
    { key: 'triglycerides', label: 'Triglicéridos' },
  ]

  let isEven = false
  metricsList.forEach((m) => {
    const latestRec = stats?.latest?.[m.key] || filteredRecords.find(r => r.type === m.key)
    const valDisplay = latestRec
      ? (m.key === 'bloodPressure' ? `${latestRec.value}/${latestRec.value2}` : `${latestRec.value}`)
      : 'Sin datos'
    const unitDisplay = UNITS[m.key] || ''
    const dateDisplay = latestRec?.recordedAt
      ? new Date(latestRec.recordedAt).toLocaleDateString('es-MX')
      : '—'

    pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
    pdf.rect(margin, y, pageWidth - (margin * 2), 6, 'F')
    pdf.setDrawColor(241, 245, 249)
    pdf.line(margin, y + 6, pageWidth - margin, y + 6)

    pdf.setTextColor(...darkSurface)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7.5)
    pdf.text(m.label, margin + 4, y + 4.2)

    pdf.setFont('helvetica', 'normal')
    pdf.text(valDisplay, margin + 55, y + 4.2)
    pdf.text(unitDisplay, margin + 90, y + 4.2)
    pdf.text(latestRec ? 'Registrado' : 'Pendiente', margin + 120, y + 4.2)
    pdf.text(dateDisplay, margin + 165, y + 4.2)

    y += 6
    isEven = !isEven
  })

  y += 7

  // ── 4. DETALLE DE REGISTROS POR FECHA EN EL PERÍODO ──────────────────────
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(`2. REGISTROS DETALLADOS DE MEDIDA EN EL PERÍODO (${dateRangeLabel}: ${filteredRecords.length} registros)`, margin, y)

  y += 5

  pdf.setFillColor(3, 105, 161) // Ocean Blue
  pdf.rect(margin, y, pageWidth - (margin * 2), 6.5, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Fecha / Hora', margin + 4, y + 4.5)
  pdf.text('Tipo de Medición', margin + 45, y + 4.5)
  pdf.text('Valor Registrado', margin + 95, y + 4.5)
  pdf.text('Notas / Observaciones', margin + 135, y + 4.5)

  y += 6.5

  if (filteredRecords.length === 0) {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(margin, y, pageWidth - (margin * 2), 7, 'F')
    pdf.setTextColor(...mutedText)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(7.5)
    pdf.text('No se encontraron registros de mediciones en el rango de fechas seleccionado.', margin + 4, y + 4.5)
    y += 7
  } else {
    isEven = false
    filteredRecords.forEach((rec) => {
      // Control de página dinámica
      if (y > pageHeight - 35) {
        pdf.addPage()
        y = margin + 5
        // Re-imprimir cabecera de tabla
        pdf.setFillColor(3, 105, 161)
        pdf.rect(margin, y, pageWidth - (margin * 2), 6.5, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Fecha / Hora', margin + 4, y + 4.5)
        pdf.text('Tipo de Medición', margin + 45, y + 4.5)
        pdf.text('Valor Registrado', margin + 95, y + 4.5)
        pdf.text('Notas / Observaciones', margin + 135, y + 4.5)
        y += 6.5
      }

      pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
      pdf.rect(margin, y, pageWidth - (margin * 2), 6, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 6, pageWidth - margin, y + 6)

      const recDate = rec.recordedAt
        ? new Date(rec.recordedAt).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—'
      const valStr = rec.type === 'bloodPressure' ? `${rec.value}/${rec.value2} ${UNITS[rec.type] || ''}` : `${rec.value} ${UNITS[rec.type] || ''}`

      pdf.setTextColor(...darkSurface)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7.2)
      pdf.text(recDate, margin + 4, y + 4.2)
      pdf.setFont('helvetica', 'bold')
      pdf.text(TYPE_LABELS[rec.type] || rec.type, margin + 45, y + 4.2)
      pdf.setFont('helvetica', 'normal')
      pdf.text(valStr, margin + 95, y + 4.2)
      const notesTrunc = (rec.notes || '—').length > 30 ? (rec.notes || '').substring(0, 30) + '...' : (rec.notes || '—')
      pdf.text(notesTrunc, margin + 135, y + 4.2)

      y += 6
      isEven = !isEven
    })
  }

  y += 7

  // ── 5. TRATAMIENTOS Y MEDICAMENTOS ACTIVOS ───────────────────────────────
  if (y > pageHeight - 50) {
    pdf.addPage()
    y = margin + 5
  }

  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('3. ESQUEMA DE MEDICAMENTOS Y SUPLEMENTOS ACTIVOS', margin, y)

  y += 5

  pdf.setFillColor(16, 185, 129) // Emerald
  pdf.rect(margin, y, pageWidth - (margin * 2), 6.5, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Nombre del Tratamiento', margin + 4, y + 4.5)
  pdf.text('Dosis', margin + 65, y + 4.5)
  pdf.text('Frecuencia / Horarios', margin + 105, y + 4.5)
  pdf.text('Tipo', margin + 165, y + 4.5)

  y += 6.5

  const allTreatments = [
    ...medications.map(m => ({ ...m, category: 'Medicamento' })),
    ...supplements.map(s => ({ ...s, category: 'Suplemento' })),
  ]

  if (allTreatments.length === 0) {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(margin, y, pageWidth - (margin * 2), 7, 'F')
    pdf.setTextColor(...mutedText)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(7.5)
    pdf.text('El paciente no cuenta con medicamentos ni suplementos registrados actualmente.', margin + 4, y + 4.5)
    y += 7
  } else {
    isEven = false
    allTreatments.forEach((t) => {
      if (y > pageHeight - 35) {
        pdf.addPage()
        y = margin + 5
      }

      pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
      pdf.rect(margin, y, pageWidth - (margin * 2), 6, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 6, pageWidth - margin, y + 6)

      pdf.setTextColor(...darkSurface)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7.5)
      pdf.text(t.name || 'Sin nombre', margin + 4, y + 4.2)

      pdf.setFont('helvetica', 'normal')
      pdf.text(t.dose || '—', margin + 65, y + 4.2)
      const schedStr = t.schedules?.length > 0 ? t.schedules.join(', ') : (t.frequency || '—')
      pdf.text(schedStr.length > 35 ? schedStr.substring(0, 35) + '...' : schedStr, margin + 105, y + 4.2)
      pdf.text(t.category, margin + 165, y + 4.2)

      y += 6
      isEven = !isEven
    })
  }

  y += 10

  // ── 6. SECCIÓN DE FIRMA Y CONFIDENCIALIDAD ──────────────────────────────────
  if (y > pageHeight - 40) {
    pdf.addPage()
    y = margin + 5
  }

  pdf.setDrawColor(203, 213, 225)
  pdf.line(margin + 55, y + 12, margin + 130, y + 12)

  pdf.setTextColor(...darkSurface)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.text(`Dr(a). ${doctor.name || 'Médico Tratante'}`, pageWidth / 2, y + 17, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...mutedText)
  pdf.text(`Cédula Profesional: ${doctor.professionalLicense || 'N/A'}`, pageWidth / 2, y + 21, { align: 'center' })
  pdf.text('Firma y Sello del Médico Responsable', pageWidth / 2, y + 25, { align: 'center' })

  pdf.setFontSize(7)
  pdf.setTextColor(148, 163, 184)
  pdf.text('Documento generado confidencialmente por la plataforma Jóvenes con Salud. Reservado para uso médico exclusivo.', pageWidth / 2, pageHeight - 8, { align: 'center' })

  const cleanName = (patient.name || 'paciente').replace(/[^a-zA-Z0-9]/g, '_')
  pdf.save(`Informe_Clinico_${cleanName}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
