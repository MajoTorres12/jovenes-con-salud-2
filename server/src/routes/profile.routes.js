import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// PUT /api/profile — update name and birth date
router.put('/', async (req, res) => {
  try {
    const { name, birthDate } = req.body
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (name) user.name = name
    if (birthDate) user.birthDate = birthDate

    await user.save()

    res.json({
      message: 'Perfil actualizado',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        birthDate: user.birthDate,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    res.status(500).json({ error: 'Error al actualizar perfil' })
  }
})

// PUT /api/profile/password — change password
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Se requiere contraseña actual y nueva' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' })
    }

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
    }

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()

    res.json({ message: 'Contraseña actualizada exitosamente' })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    res.status(500).json({ error: 'Error al cambiar contraseña' })
  }
})

// PUT /api/profile/theme — update profile theme customization color
router.put('/theme', async (req, res) => {
  try {
    const { themeColor } = req.body
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    user.themeColor = themeColor || null
    await user.save()

    res.json({
      message: 'Tema actualizado exitosamente',
      themeColor: user.themeColor,
    })
  } catch (error) {
    console.error('Error al actualizar tema:', error)
    res.status(500).json({ error: 'Error al actualizar el color de personalización' })
  }
})

// PUT /api/profile/onboarding-complete — mark onboarding as completed
router.put('/onboarding-complete', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    user.hasCompletedOnboarding = true
    await user.save()

    res.json({
      message: 'Onboarding completado exitosamente',
      hasCompletedOnboarding: true,
    })
  } catch (error) {
    console.error('Error al marcar onboarding como completado:', error)
    res.status(500).json({ error: 'Error al actualizar el estado de onboarding' })
  }
})

// Configuración de Multer para archivos PDF de laboratorio
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import MedicalHistory from '../models/MedicalHistory.js'

const labUploadDir = 'public/uploads/lab-reports'
if (!fs.existsSync(labUploadDir)) {
  fs.mkdirSync(labUploadDir, { recursive: true })
}

const labStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, labUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `lab_${req.user.id}_${Date.now()}${ext}`)
  }
})

const uploadLabPdf = multer({
  storage: labStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos en formato PDF'))
    }
  }
})

// GET /api/profile/medical-history — obtener expediente clínico
router.get('/medical-history', async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.id
    let history = await MedicalHistory.findOne({ where: { userId: targetUserId } })

    if (!history) {
      history = await MedicalHistory.create({ userId: targetUserId })
    }

    res.json({ medicalHistory: history })
  } catch (error) {
    console.error('Error obteniendo historial médico:', error)
    res.status(500).json({ error: 'Error al obtener el historial médico' })
  }
})

// PUT /api/profile/medical-history — actualizar expediente clínico
router.put('/medical-history', async (req, res) => {
  try {
    const targetUserId = req.body.patientId || req.user.id
    let history = await MedicalHistory.findOne({ where: { userId: targetUserId } })

    if (!history) {
      history = await MedicalHistory.create({ userId: targetUserId })
    }

    const {
      curp, nss, bloodType, organDonor, allergies,
      hereditaryDiseases, personalPathologies,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      diagnoses,
    } = req.body

    if (curp !== undefined) history.curp = curp
    if (nss !== undefined) history.nss = nss
    if (bloodType !== undefined) history.bloodType = bloodType
    if (organDonor !== undefined) history.organDonor = organDonor
    if (allergies !== undefined) history.allergies = allergies
    if (hereditaryDiseases !== undefined) history.hereditaryDiseases = hereditaryDiseases
    if (personalPathologies !== undefined) history.personalPathologies = personalPathologies
    if (emergencyContactName !== undefined) history.emergencyContactName = emergencyContactName
    if (emergencyContactPhone !== undefined) history.emergencyContactPhone = emergencyContactPhone
    if (emergencyContactRelation !== undefined) history.emergencyContactRelation = emergencyContactRelation
    if (diagnoses !== undefined) history.diagnoses = diagnoses

    await history.save()

    res.json({
      message: 'Historial médico actualizado exitosamente',
      medicalHistory: history,
    })
  } catch (error) {
    console.error('Error actualizando historial médico:', error)
    res.status(500).json({ error: 'Error al actualizar el historial médico' })
  }
})

// POST /api/profile/medical-history/upload-pdf — subir PDF de análisis clínico
router.post('/medical-history/upload-pdf', uploadLabPdf.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere un archivo PDF' })
    }

    const targetUserId = req.body.patientId || req.user.id
    let history = await MedicalHistory.findOne({ where: { userId: targetUserId } })
    if (!history) {
      history = await MedicalHistory.create({ userId: targetUserId })
    }

    const fileUrl = `uploads/lab-reports/${req.file.filename}`
    const newReport = {
      id: `pdf_${Date.now()}`,
      title: req.body.title || 'Análisis Clínico',
      labName: req.body.labName || 'Laboratorio Externo',
      date: req.body.date || new Date().toISOString().slice(0, 10),
      fileUrl,
      originalName: req.file.originalname,
      createdAt: new Date().toISOString(),
    }

    const existingReports = history.labReports || []
    history.labReports = [newReport, ...existingReports]
    await history.save()

    res.json({
      message: 'Estudio clínico PDF subido exitosamente',
      report: newReport,
      medicalHistory: history,
    })
  } catch (error) {
    console.error('Error subiendo PDF de análisis:', error)
    res.status(500).json({ error: error.message || 'Error al subir el estudio médico en PDF' })
  }
})

// DELETE /api/profile/medical-history/pdf/:pdfId — eliminar PDF de laboratorio
router.delete('/medical-history/pdf/:pdfId', async (req, res) => {
  try {
    const { pdfId } = req.params
    let history = await MedicalHistory.findOne({ where: { userId: req.user.id } })

    if (!history) {
      return res.status(404).json({ error: 'Historial médico no encontrado' })
    }

    const reports = history.labReports || []
    history.labReports = reports.filter(r => r.id !== pdfId)
    await history.save()

    res.json({
      message: 'Estudio clínico eliminado exitosamente',
      medicalHistory: history,
    })
  } catch (error) {
    console.error('Error eliminando PDF:', error)
    res.status(500).json({ error: 'Error al eliminar el estudio clínico' })
  }
})

export default router

