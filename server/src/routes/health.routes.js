import { Router } from 'express'
import { Op } from 'sequelize'
import HealthRecord from '../models/HealthRecord.js'
import { authenticate } from '../middleware/auth.middleware.js'
import User from '../models/User.js'
import MedicalAlert from '../models/MedicalAlert.js'
import { checkHealthLimits } from '../utils/healthLimits.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Unit defaults per type
const UNITS = {
  weight: 'kg',
  glucose: 'mg/dL',
  bloodPressure: 'mmHg',
  heartRate: 'bpm',
  cholesterol: 'mg/dL',
  triglycerides: 'mg/dL',
}

// POST /api/health-tracking/records — create a health record
router.post('/records', async (req, res) => {
  try {
    const { type, value, value2, notes, recordedAt } = req.body

    if (!type || value == null) {
      return res.status(400).json({ error: 'Tipo y valor son requeridos' })
    }

    if (!['weight', 'glucose', 'bloodPressure', 'heartRate', 'cholesterol', 'triglycerides'].includes(type)) {
      return res.status(400).json({ error: 'Tipo inválido' })
    }

    if (type === 'bloodPressure' && value2 == null) {
      return res.status(400).json({ error: 'La presión arterial requiere valor sistólico y diastólico' })
    }

    const record = await HealthRecord.create({
      userId: req.user.id,
      type,
      value: parseFloat(value),
      value2: value2 != null ? parseFloat(value2) : null,
      unit: UNITS[type],
      notes: notes || null,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    })

    // Check health limits and trigger alert if necessary
    try {
      const user = await User.findByPk(req.user.id)
      if (user && user.doctorId) {
        const checkResult = checkHealthLimits(type, value, value2)
        if (checkResult && checkResult.isAbnormal) {
          let displayValue = `${value} ${UNITS[type] || ''}`
          if (type === 'bloodPressure' && value2 != null) {
            displayValue = `${value}/${value2} ${UNITS[type] || ''}`
          } else if (type === 'weight' && value2 != null) {
            const heightM = value2 / 100
            const bmi = value / (heightM * heightM)
            displayValue = `${value} kg (IMC: ${bmi.toFixed(1)})`
          }

          await MedicalAlert.create({
            userId: user.id,
            doctorId: user.doctorId,
            healthRecordId: record.id,
            severity: checkResult.severity,
            type,
            message: checkResult.message,
            value: displayValue,
            description: checkResult.description,
            status: 'pending',
            recordedAt: record.recordedAt,
          })
        }
      }
    } catch (alertErr) {
      console.error('Error generating medical alert:', alertErr)
      // Do not block record response if alert creation fails
    }

    res.status(201).json({ message: 'Registro creado', record })
  } catch (error) {
    console.error('Error creando registro de salud:', error)
    res.status(500).json({ error: 'Error al guardar el registro' })
  }
})

// GET /api/health-tracking/records — list user's records
router.get('/records', async (req, res) => {
  try {
    const { type, from, to, limit = 50 } = req.query

    const where = { userId: req.user.id }

    if (type) where.type = type

    if (from || to) {
      where.recordedAt = {}
      if (from) where.recordedAt[Op.gte] = new Date(from)
      if (to) where.recordedAt[Op.lte] = new Date(to)
    }

    const records = await HealthRecord.findAll({
      where,
      order: [['recordedAt', 'DESC']],
      limit: Math.min(parseInt(limit), 200),
    })

    res.json({ records })
  } catch (error) {
    console.error('Error obteniendo registros:', error)
    res.status(500).json({ error: 'Error al obtener registros' })
  }
})

// GET /api/health-tracking/stats — summary statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id

    // Get latest record for each type
    const types = ['weight', 'glucose', 'bloodPressure', 'heartRate', 'cholesterol', 'triglycerides']
    const latest = {}

    for (const type of types) {
      const record = await HealthRecord.findOne({
        where: { userId, type },
        order: [['recordedAt', 'DESC']],
      })
      latest[type] = record || null
    }

    // Count total records
    const totalRecords = await HealthRecord.count({ where: { userId } })

    res.json({ latest, totalRecords })
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

// GET /api/health-tracking/alerts — list patient's alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await MedicalAlert.findAll({
      where: { userId: req.user.id },
      order: [['recordedAt', 'DESC']]
    })
    res.json({ alerts })
  } catch (error) {
    console.error('Error obteniendo alertas:', error)
    res.status(500).json({ error: 'Error al obtener alertas' })
  }
})

export default router
