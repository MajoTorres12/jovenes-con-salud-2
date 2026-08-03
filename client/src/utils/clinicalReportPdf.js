import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

export async function generateClinicalReportPDF({ patient, stats, records = [], medications = [], supplements = [], alerts = [], doctor = {}, chartElement = null }) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 14
  let y = margin

  // Color Palette
  const primaryColor = [135, 18, 51]    // Guinda corporativo #871233
  const darkSurface = [30, 41, 59]      // Slate #1e293b
  const mutedText = [100, 116, 139]     // Slate #64748b
  const lightBg = [248, 250, 252]       // Slate #f8fafc

  // ── 1. ENCABEZADO MEMBRETADO ────────────────────────────────────────────────
  pdf.setFillColor(...primaryColor)
  pdf.rect(0, 0, pageWidth, 24, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text('JÓVENES CON SALUD — INFORME CLÍNICO DE SEGUIMIENTO', margin, 12)

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Folio: JCS-INF-${Date.now().toString().slice(-6)} | Emisión: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 18)

  y = 32

  // ── 2. DATOS DEL MÉDICO Y PACIENTE ──────────────────────────────────────────
  pdf.setFillColor(...lightBg)
  pdf.roundedRect(margin, y, pageWidth - (margin * 2), 34, 3, 3, 'F')
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(margin, y, pageWidth - (margin * 2), 34, 3, 3, 'S')

  // Columna Izquierda: Médico
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('MÉDICO TRATANTE', margin + 6, y + 8)

  pdf.setTextColor(...darkSurface)
  pdf.setFontSize(10)
  pdf.text(`Dr(a). ${doctor.name || 'Médico Asignado'}`, margin + 6, y + 15)

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...mutedText)
  pdf.text(`Cédula Profesional: ${doctor.professionalLicense || 'N/A'}`, margin + 6, y + 21)
  pdf.text(`Especialidad: ${doctor.specialty || 'Medicina General'}`, margin + 6, y + 27)

  // Columna Derecha: Paciente
  const colRightX = margin + 95
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('DATOS DEL PACIENTE', colRightX, y + 8)

  pdf.setTextColor(...darkSurface)
  pdf.setFontSize(10)
  pdf.text(patient.name || 'Paciente', colRightX, y + 15)

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...mutedText)
  pdf.text(`Correo: ${patient.email || 'N/A'}`, colRightX, y + 21)
  pdf.text(`Fecha Nacimiento: ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('es-MX') : 'No especificada'}`, colRightX, y + 27)

  y += 42

  // ── 3. RESUMEN DE INDICADORES CLÍNICOS RECIENTES ───────────────────────────
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('1. RESUMEN DE INDICADORES DE SALUD', margin, y)

  y += 6

  // Cabecera de Tabla
  pdf.setFillColor(...primaryColor)
  pdf.rect(margin, y, pageWidth - (margin * 2), 7, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Indicador Clínico', margin + 4, y + 5)
  pdf.text('Último Valor', margin + 55, y + 5)
  pdf.text('Unidad', margin + 90, y + 5)
  pdf.text('Evaluación / Criterio', margin + 120, y + 5)
  pdf.text('Fecha', margin + 165, y + 5)

  y += 7

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
    const latestRec = stats?.latest?.[m.key] || records.find(r => r.type === m.key)
    const valDisplay = latestRec
      ? (m.key === 'bloodPressure' ? `${latestRec.value}/${latestRec.value2}` : `${latestRec.value}`)
      : 'Sin datos'
    const unitDisplay = UNITS[m.key] || ''
    const dateDisplay = latestRec?.recordedAt
      ? new Date(latestRec.recordedAt).toLocaleDateString('es-MX')
      : '—'

    // Fila fondo
    pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
    pdf.rect(margin, y, pageWidth - (margin * 2), 7, 'F')
    pdf.setDrawColor(241, 245, 249)
    pdf.line(margin, y + 7, pageWidth - margin, y + 7)

    pdf.setTextColor(...darkSurface)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text(m.label, margin + 4, y + 5)

    pdf.setFont('helvetica', 'normal')
    pdf.text(valDisplay, margin + 55, y + 5)
    pdf.text(unitDisplay, margin + 90, y + 5)
    pdf.text(latestRec ? 'Registrado' : 'Pendiente', margin + 120, y + 5)
    pdf.text(dateDisplay, margin + 165, y + 5)

    y += 7
    isEven = !isEven
  })

  y += 8

  // ── 4. TRATAMIENTOS Y MEDICAMENTOS ACTIVOS ───────────────────────────────
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('2. ESQUEMA DE MEDICAMENTOS Y SUPLEMENTOS ACTIVOS', margin, y)

  y += 6

  // Cabecera Tabla Medicamentos
  pdf.setFillColor(16, 185, 129) // Emerald
  pdf.rect(margin, y, pageWidth - (margin * 2), 7, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Nombre del Tratamiento', margin + 4, y + 5)
  pdf.text('Dosis', margin + 65, y + 5)
  pdf.text('Frecuencia / Horarios', margin + 105, y + 5)
  pdf.text('Tipo', margin + 165, y + 5)

  y += 7

  const allTreatments = [
    ...medications.map(m => ({ ...m, category: 'Medicamento' })),
    ...supplements.map(s => ({ ...s, category: 'Suplemento' })),
  ]

  if (allTreatments.length === 0) {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(margin, y, pageWidth - (margin * 2), 8, 'F')
    pdf.setTextColor(...mutedText)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(8)
    pdf.text('El paciente no cuenta con medicamentos ni suplementos registrados actualmente.', margin + 4, y + 5)
    y += 8
  } else {
    isEven = false
    allTreatments.forEach((t) => {
      pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
      pdf.rect(margin, y, pageWidth - (margin * 2), 7, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 7, pageWidth - margin, y + 7)

      pdf.setTextColor(...darkSurface)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.text(t.name || 'Sin nombre', margin + 4, y + 5)

      pdf.setFont('helvetica', 'normal')
      pdf.text(t.dose || '—', margin + 65, y + 5)
      const schedStr = t.schedules?.length > 0 ? t.schedules.join(', ') : (t.frequency || '—')
      pdf.text(schedStr.length > 35 ? schedStr.substring(0, 35) + '...' : schedStr, margin + 105, y + 5)
      pdf.text(t.category, margin + 165, y + 5)

      y += 7
      isEven = !isEven
    })
  }

  y += 8

  // ── 5. REGISTRO DE ALERTAS MÉDICAS RECIENTES ─────────────────────────────
  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.text('3. HISTORIAL DE ALERTAS CLÍNICAS RECIENTES', margin, y)

  y += 6

  pdf.setFillColor(239, 68, 68) // Red
  pdf.rect(margin, y, pageWidth - (margin * 2), 7, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Fecha', margin + 4, y + 5)
  pdf.text('Métrica Afectada', margin + 40, y + 5)
  pdf.text('Valor Detectado', margin + 85, y + 5)
  pdf.text('Nivel / Observación', margin + 130, y + 5)

  y += 7

  if (!alerts || alerts.length === 0) {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(margin, y, pageWidth - (margin * 2), 8, 'F')
    pdf.setTextColor(...mutedText)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(8)
    pdf.text('Sin alertas médicas registradas. Todos los valores se mantienen en rangos normales.', margin + 4, y + 5)
    y += 8
  } else {
    isEven = false
    alerts.slice(0, 4).forEach((al) => {
      pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
      pdf.rect(margin, y, pageWidth - (margin * 2), 7, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 7, pageWidth - margin, y + 7)

      pdf.setTextColor(...darkSurface)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text(new Date(al.createdAt || Date.now()).toLocaleDateString('es-MX'), margin + 4, y + 5)
      pdf.text(TYPE_LABELS[al.type] || al.type, margin + 40, y + 5)
      pdf.text(`${al.value || '—'}`, margin + 85, y + 5)
      pdf.text(al.message || al.level || 'Fuera de rango', margin + 130, y + 5)

      y += 7
      isEven = !isEven
    })
  }

  y += 12

  // ── 6. SECCIÓN DE FIRMA Y CONFIDENCIALIDAD ──────────────────────────────────
  if (y > pageHeight - 45) {
    pdf.addPage()
    y = margin
  }

  pdf.setDrawColor(203, 213, 225)
  pdf.line(margin + 55, y + 15, margin + 130, y + 15)

  pdf.setTextColor(...darkSurface)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text(`Dr(a). ${doctor.name || 'Médico Tratante'}`, pageWidth / 2, y + 20, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...mutedText)
  pdf.text(`Cédula Profesional: ${doctor.professionalLicense || 'N/A'}`, pageWidth / 2, y + 25, { align: 'center' })
  pdf.text('Firma y Sello del Médico Responsable', pageWidth / 2, y + 29, { align: 'center' })

  // Pie de Página
  pdf.setFontSize(7)
  pdf.setTextColor(148, 163, 184)
  pdf.text('Documento generado confidencialmente por la plataforma Jóvenes con Salud. Reservado para uso médico exclusivo.', pageWidth / 2, pageHeight - 8, { align: 'center' })

  // Guardar PDF
  const cleanName = (patient.name || 'paciente').replace(/[^a-zA-Z0-9]/g, '_')
  pdf.save(`Informe_Clinico_${cleanName}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
