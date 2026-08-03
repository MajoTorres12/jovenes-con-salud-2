import jsPDF from 'jspdf'

export function generateDoctorPatientsSummaryPDF({ doctor = {}, patients = [] }) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 14
  let y = margin

  const primaryColor = [135, 18, 51]    // Guinda #871233
  const darkSurface = [30, 41, 59]      // Slate #1e293b
  const mutedText = [100, 116, 139]     // Slate #64748b
  const lightBg = [248, 250, 252]

  // ── 1. ENCABEZADO MEMBRETADO ────────────────────────────────────────────────
  pdf.setFillColor(...primaryColor)
  pdf.rect(0, 0, pageWidth, 24, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text('JÓVENES CON SALUD — RESUMEN CONSOLIDADO DE PACIENTES', margin, 12)

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} | Total de Pacientes: ${patients.length}`, margin, 18)

  y = 32

  // ── 2. DATOS DEL MÉDICO ──────────────────────────────────────────────────
  pdf.setFillColor(...lightBg)
  pdf.roundedRect(margin, y, pageWidth - (margin * 2), 22, 3, 3, 'F')
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(margin, y, pageWidth - (margin * 2), 22, 3, 3, 'S')

  pdf.setTextColor(...primaryColor)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text(`MÉDICO ASIGNADO: Dr(a). ${doctor.name || 'Doctor'}`, margin + 6, y + 8)

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...mutedText)
  pdf.text(`Cédula Profesional: ${doctor.professionalLicense || 'N/A'}  |  Especialidad: ${doctor.specialty || 'Medicina General'}`, margin + 6, y + 15)

  y += 28

  // ── 3. TABLA CONSOLIDADA DE PACIENTES ─────────────────────────────────────
  pdf.setFillColor(...primaryColor)
  pdf.rect(margin, y, pageWidth - (margin * 2), 7, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Nombre del Paciente', margin + 4, y + 5)
  pdf.text('Correo de Contacto', margin + 60, y + 5)
  pdf.text('Registros totales', margin + 115, y + 5)
  pdf.text('Última Consulta/Registro', margin + 150, y + 5)

  y += 7

  if (patients.length === 0) {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(margin, y, pageWidth - (margin * 2), 10, 'F')
    pdf.setTextColor(...mutedText)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(8)
    pdf.text('No hay pacientes asignados en la plataforma actualmente.', margin + 4, y + 6)
    y += 10
  } else {
    let isEven = false
    patients.forEach((p, idx) => {
      // Control de salto de página
      if (y > pageHeight - 30) {
        pdf.addPage()
        y = margin + 10
      }

      pdf.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255)
      pdf.rect(margin, y, pageWidth - (margin * 2), 8, 'F')
      pdf.setDrawColor(241, 245, 249)
      pdf.line(margin, y + 8, pageWidth - margin, y + 8)

      pdf.setTextColor(...darkSurface)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.text(`${idx + 1}. ${p.name || 'Paciente'}`, margin + 4, y + 5.5)

      pdf.setFont('helvetica', 'normal')
      pdf.text(p.email || '—', margin + 60, y + 5.5)
      pdf.text(`${p.totalRecords || p.recordsCount || '—'} mediciones`, margin + 115, y + 5.5)
      const lastDate = p.lastActivityAt || p.updatedAt || p.createdAt
      pdf.text(lastDate ? new Date(lastDate).toLocaleDateString('es-MX') : '—', margin + 150, y + 5.5)

      y += 8
      isEven = !isEven
    })
  }

  y += 15

  // ── 4. PIE DE PÁGINA Y FIRMA ──────────────────────────────────────────────
  if (y > pageHeight - 40) {
    pdf.addPage()
    y = margin
  }

  pdf.setDrawColor(203, 213, 225)
  pdf.line(margin + 55, y + 10, margin + 130, y + 10)

  pdf.setTextColor(...darkSurface)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text(`Dr(a). ${doctor.name || 'Médico Responsable'}`, pageWidth / 2, y + 15, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...mutedText)
  pdf.text(`Cédula Profesional: ${doctor.professionalLicense || 'N/A'}`, pageWidth / 2, y + 19, { align: 'center' })

  pdf.setFontSize(7)
  pdf.setTextColor(148, 163, 184)
  pdf.text('Reporte global confidencial generado automáticamente por la plataforma Jóvenes con Salud.', pageWidth / 2, pageHeight - 8, { align: 'center' })

  pdf.save(`Resumen_Pacientes_Dr_${(doctor.name || 'medico').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
