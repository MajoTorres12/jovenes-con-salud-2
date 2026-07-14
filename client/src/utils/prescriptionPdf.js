import jsPDF from 'jspdf'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const loadLogo = (url) => new Promise((resolve) => {
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    try {
      const b64 = canvas.toDataURL('image/png')
      resolve({ b64, w: img.naturalWidth, h: img.naturalHeight })
    } catch (e) {
      resolve(null)
    }
  }
  img.onerror = () => resolve(null)
  img.crossOrigin = 'anonymous'
  img.src = url
})

const getImageDimensions = (base64Str) => new Promise((resolve) => {
  const img = new Image()
  img.onload = () => {
    resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height })
  }
  img.onerror = () => resolve(null)
  img.src = base64Str
})

export async function generatePrescriptionPdf(prescription, patientName, patientAge) {
  try {
    // Load institutional logos
    const logoSrcs = ['/logo-tamaulipas.png', '/logo-injuventud.png', '/logo-salud.jpg', '/logo-bienestar.png']
    const logoData = (await Promise.all(logoSrcs.map(loadLogo))).filter(Boolean)

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 20
    let y = 45

    // ── Header logos ──
    const headerH = 32
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageW, headerH, 'F')

    // Equal slot layout for logos
    const slotW = (pageW - margin * 2) / logoData.length
    const maxLogoH = 16
    const padding = 2

    logoData.forEach(({ b64, w, h }, i) => {
      const maxW = slotW - padding * 2
      let lw = (w / h) * maxLogoH
      let lh = maxLogoH
      if (lw > maxW) {
        lw = maxW
        lh = (h / w) * lw
      }
      const slotX = margin + i * slotW
      const lx = slotX + (slotW - lw) / 2
      const ly = 8 + (maxLogoH - lh) / 2
      pdf.addImage(b64, 'PNG', lx, ly, lw, lh)
    })

    // ── Top Border line ──
    pdf.setDrawColor(135, 18, 51) // #871233 Guinda
    pdf.setLineWidth(1)
    pdf.line(margin, 35, pageW - margin, 35)

    // ── Document Title & Folio ──
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.setTextColor(135, 18, 51)
    pdf.text('RECETA MÉDICA', margin, y)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(100, 116, 139)
    const formattedDate = new Date(prescription.issuedAt || prescription.createdAt || new Date()).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    pdf.text(`Folio: ${prescription.folio}`, pageW - margin, y, { align: 'right' })
    y += 6
    pdf.text(`Fecha de emisión: ${formattedDate}`, pageW - margin, y, { align: 'right' })

    // ── Doctor Info Block ──
    y += 10
    pdf.setFillColor(248, 245, 242) // surface cream shade
    pdf.rect(margin, y, pageW - margin * 2, 22, 'F')
    
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(64, 58, 52) // surface-700
    pdf.text(`Dr(a). ${prescription.doctorName}`, margin + 5, y + 6)
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    pdf.setTextColor(125, 110, 94) // surface-500
    pdf.text(`Especialidad: ${prescription.doctorSpecialty || 'Médico General'}`, margin + 5, y + 12)
    pdf.text(`Cédula Profesional: ${prescription.doctorLicense}`, margin + 5, y + 17)
    
    y += 27

    // ── Patient Info Block ──
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(135, 18, 51)
    pdf.text('DATOS DEL PACIENTE', margin, y)
    y += 5
    pdf.setDrawColor(232, 221, 208) // surface-200
    pdf.setLineWidth(0.5)
    pdf.line(margin, y, pageW - margin, y)
    
    y += 6
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(64, 58, 52)
    pdf.text(`Nombre: ${patientName}`, margin, y)
    pdf.text(`Edad: ${patientAge || 'N/A'} años`, pageW - margin, y, { align: 'right' })

    y += 12

    // ── Diagnosis Block ──
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(135, 18, 51)
    pdf.text('DIAGNÓSTICO', margin, y)
    y += 5
    pdf.line(margin, y, pageW - margin, y)
    
    y += 6
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(64, 58, 52)
    
    const diagText = pdf.splitTextToSize(prescription.diagnosis, pageW - margin * 2)
    pdf.text(diagText, margin, y)
    y += diagText.length * 5 + 8

    // ── Medications Table Block ──
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(135, 18, 51)
    pdf.text('TRATAMIENTO Y PRESCRIPCIÓN', margin, y)
    y += 5
    pdf.line(margin, y, pageW - margin, y)
    
    y += 6
    
    // Header for treatment table
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(135, 18, 51)
    pdf.text('Medicamento / Vía', margin + 2, y)
    pdf.text('Dosis / Frecuencia', margin + 70, y)
    pdf.text('Duración / Indicaciones', margin + 120, y)
    
    y += 4
    pdf.setDrawColor(135, 18, 51)
    pdf.setLineWidth(0.5)
    pdf.line(margin, y, pageW - margin, y)
    y += 6
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    pdf.setTextColor(64, 58, 52)
    
    const meds = prescription.medications || []
    meds.forEach((m, idx) => {
      // Check height bounds to prevent overflow
      if (y > pageH - 50) {
        pdf.addPage()
        // Draw logo headers on new page
        pdf.setDrawColor(135, 18, 51)
        pdf.setLineWidth(1)
        pdf.line(margin, 25, pageW - margin, 25)
        y = 35
      }

      pdf.setFont('helvetica', 'bold')
      pdf.text(`${idx + 1}. ${m.name}`, margin + 2, y)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(125, 110, 94)
      pdf.text(`Vía: ${m.route || 'Oral'}`, margin + 2, y + 4)
      
      pdf.setFontSize(9.5)
      pdf.setTextColor(64, 58, 52)
      pdf.text(`${m.dose} / ${m.frequency}`, margin + 70, y)
      
      const instructions = m.instructions ? `${m.duration} - ${m.instructions}` : m.duration
      const wrappedInst = pdf.splitTextToSize(instructions, pageW - margin - (margin + 120))
      pdf.text(wrappedInst, margin + 120, y)
      
      const rowH = Math.max(8, wrappedInst.length * 4.5 + 2)
      y += rowH
      
      // Divider line
      pdf.setDrawColor(240, 235, 230)
      pdf.line(margin, y - 2, pageW - margin, y - 2)
    })

    y += 5

    // ── General Instructions Block ──
    if (prescription.generalInstructions) {
      if (y > pageH - 45) {
        pdf.addPage()
        y = 35
      }
      
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(135, 18, 51)
      pdf.text('Indicaciones generales:', margin, y)
      y += 5
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9.5)
      pdf.setTextColor(64, 58, 52)
      const wrappedGeneral = pdf.splitTextToSize(prescription.generalInstructions, pageW - margin * 2)
      pdf.text(wrappedGeneral, margin, y)
      y += wrappedGeneral.length * 4.5 + 8
    }

    // ── Signature and Verification footer ──
    const footerStartY = pageH - 45
    
    // Draw signature image if present
    if (prescription.doctorSignature) {
      try {
        const dims = await getImageDimensions(prescription.doctorSignature)
        if (dims && dims.w && dims.h) {
          const maxW = 55 // max width in mm
          const maxH = 24 // max height in mm
          const imgRatio = dims.w / dims.h
          
          let drawW = maxW
          let drawH = maxW / imgRatio
          
          if (drawH > maxH) {
            drawH = maxH
            drawW = maxH * imgRatio
          }
          
          // Draw signature centered horizontally and vertically within the signature box
          pdf.addImage(prescription.doctorSignature, 'PNG', pageW / 2 - drawW / 2, footerStartY - drawH - 1, drawW, drawH)
        } else {
          // Fallback to safe defaults if dims failed
          pdf.addImage(prescription.doctorSignature, 'PNG', pageW / 2 - 25, footerStartY - 24, 50, 23)
        }
      } catch (err) {
        console.error('Error adding signature image to PDF:', err)
      }
    }

    // Draw signature line and text
    pdf.setDrawColor(180, 160, 140)
    pdf.setLineWidth(0.5)
    pdf.line(pageW / 2 - 35, footerStartY, pageW / 2 + 35, footerStartY)
    
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(64, 58, 52)
    pdf.text(`Dr(a). ${prescription.doctorName}`, pageW / 2, footerStartY + 5, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(125, 110, 94)
    pdf.text('Firma Digital Autorizada', pageW / 2, footerStartY + 9, { align: 'center' })

    // Validez footer
    const validUntilDate = new Date(prescription.validUntil).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    pdf.setFontSize(7.5)
    pdf.setTextColor(150, 140, 130)
    pdf.text(`Esta receta es válida hasta: ${validUntilDate}`, pageW / 2, footerStartY + 16, { align: 'center' })

    // Footer bottom banner
    pdf.setDrawColor(135, 18, 51)
    pdf.setLineWidth(0.5)
    pdf.line(margin, pageH - 12, pageW - margin, pageH - 12)
    pdf.setFontSize(7)
    pdf.setTextColor(148, 163, 184)
    pdf.text('Plataforma Jóvenes con Salud — Gobierno del Estado de Tamaulipas', margin, pageH - 7)
    pdf.text('Receta Electrónica Certificada', pageW - margin, pageH - 7, { align: 'right' })

    // Save or Share PDF
    const pdfName = `Receta_Medica_${prescription.folio}.pdf`

    if (Capacitor.isNativePlatform()) {
      const base64Data = pdf.output('datauristring').split(',')[1]
      const result = await Filesystem.writeFile({
        path: pdfName,
        data: base64Data,
        directory: Directory.Cache,
      })
      await Share.share({
        title: 'Receta Médica',
        text: `Tu receta médica folio ${prescription.folio} emitida por Jóvenes con Salud.`,
        url: result.uri,
        dialogTitle: 'Abrir/Compartir Receta',
      })
    } else {
      const blob = pdf.output('blob')
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = pdfName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    }
    
    return true
  } catch (error) {
    console.error('Error generating prescription PDF:', error)
    throw error
  }
}
