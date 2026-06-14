import { Router } from 'express'
import { Op } from 'sequelize'
import { authenticate } from '../middleware/auth.middleware.js'
import User from '../models/User.js'
import FamilyMember from '../models/FamilyMember.js'
import HealthRecord from '../models/HealthRecord.js'
import Medication from '../models/Medication.js'
import Supplement from '../models/Supplement.js'
import MedicalAlert from '../models/MedicalAlert.js'

const router = Router()

// Middleware to enforce doctor role
async function requireDoctor(req, res, next) {
  try {
    if (!req.user) {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de médico.' })
    }
    const dbUser = await User.findByPk(req.user.id)
    if (!dbUser || dbUser.role !== 'doctor') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de médico.' })
    }
    next()
  } catch (error) {
    next(error)
  }
}

router.use(authenticate, requireDoctor)

// 1. GET /api/doctor/stats — dashboard cards
router.get('/stats', async (req, res, next) => {
  try {
    const doctorId = req.user.id

    // Patients assigned
    const totalPatients = await User.count({ where: { doctorId } })

    // Patient IDs to filter health records
    const patients = await User.findAll({ where: { doctorId }, attributes: ['id'] })
    const patientIds = patients.map(p => p.id)

    // Total records
    const totalRecords = await HealthRecord.count({
      where: { userId: { [Op.in]: patientIds } }
    })

    // Records last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recordsLast7Days = await HealthRecord.count({
      where: {
        userId: { [Op.in]: patientIds },
        recordedAt: { [Op.gte]: sevenDaysAgo }
      }
    })

    res.json({
      patients: totalPatients,
      records: totalRecords,
      recordsLast7Days
    })
  } catch (err) {
    next(err)
  }
})

// 2. GET /api/doctor/patients — table list of assigned patients
router.get('/patients', async (req, res, next) => {
  try {
    const doctorId = req.user.id

    const patients = await User.findAll({
      where: { doctorId },
      attributes: ['id', 'name', 'email', 'birthDate', 'avatar'],
      include: [
        { model: FamilyMember, as: 'familyMembers', attributes: ['id'] },
        { model: HealthRecord, as: 'healthRecords', attributes: ['id', 'recordedAt'] }
      ]
    })

    const list = patients.map(p => {
      // Find the last record date
      const sortedRecords = p.healthRecords.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
      const lastRecordDate = sortedRecords.length > 0 ? sortedRecords[0].recordedAt : null

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        birthDate: p.birthDate,
        avatar: p.avatar,
        familyCount: p.familyMembers.length,
        recordsCount: p.healthRecords.length,
        lastRecordDate
      }
    })

    res.json({ patients: list })
  } catch (err) {
    next(err)
  }
})

// 3. GET /api/doctor/patients/:id/records — detailed view of patient records
router.get('/patients/:id/records', async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const patientId = req.params.id

    // Check if patient is assigned to this doctor
    const patient = await User.findOne({
      where: { id: patientId, doctorId }
    })
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado o no asignado a usted.' })
    }

    // Fetch all health records (including family members)
    const records = await HealthRecord.findAll({
      where: { userId: patientId },
      order: [['recordedAt', 'DESC']]
    })

    // Fetch family members
    const familyMembers = await FamilyMember.findAll({
      where: { userId: patientId },
      order: [['name', 'ASC']]
    })

    // Fetch medications
    const medications = await Medication.findAll({
      where: { userId: patientId },
      order: [['createdAt', 'DESC']]
    })

    // Fetch supplements
    const supplements = await Supplement.findAll({
      where: { userId: patientId },
      order: [['createdAt', 'DESC']]
    })

    res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        birthDate: patient.birthDate,
        avatar: patient.avatar
      },
      records,
      familyMembers,
      medications,
      supplements
    })
  } catch (err) {
    next(err)
  }
})

// 4. GET /api/doctor/alerts — alert notifications
router.get('/alerts', async (req, res, next) => {
  try {
    const doctorId = req.user.id

    const alerts = await MedicalAlert.findAll({
      where: { doctorId },
      include: [
        { model: User, as: 'patient', attributes: ['id', 'name', 'email', 'avatar'] }
      ],
      order: [['recordedAt', 'DESC']]
    })

    res.json({ alerts })
  } catch (err) {
    next(err)
  }
})

// 5. PUT /api/doctor/alerts/:id/dismiss — dismiss alert
router.put('/alerts/:id/dismiss', async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const alertId = req.params.id

    const alert = await MedicalAlert.findOne({
      where: { id: alertId, doctorId }
    })
    if (!alert) {
      return res.status(404).json({ error: 'Alerta no encontrada.' })
    }

    alert.status = 'dismissed'
    await alert.save()

    res.json({ message: 'Alerta descartada exitosamente', alert })
  } catch (err) {
    next(err)
  }
})

export default router
