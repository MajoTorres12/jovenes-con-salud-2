import { Router } from 'express'
import { Op } from 'sequelize'
import HealthRecord from '../models/HealthRecord.js'
import { authenticate } from '../middleware/auth.middleware.js'
import User from '../models/User.js'
import MedicalAlert from '../models/MedicalAlert.js'
import { checkHealthLimits } from '../utils/healthLimits.js'
import { calculateStreaks } from '../utils/streakUtils.js'
import FamilyMember from '../models/FamilyMember.js'
import { sendPushNotification } from '../services/pushNotification.service.js'

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

          const alert = await MedicalAlert.create({
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

          const doctor = await User.findByPk(user.doctorId)
          if (doctor?.deviceToken) {
            sendPushNotification(doctor.deviceToken, {
              title: checkResult.severity === 'critical' ? '🚨 Alerta Crítica' : '⚠️ Alerta Médica',
              body: `${user.name}: ${checkResult.message} (${displayValue})`,
              data: { type: 'medical_alert', alertId: alert.id, patientId: user.id, url: '/doctor' }
            })
          }
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

// PUT /api/health-tracking/records/:id — update a health record
router.put('/records/:id', async (req, res) => {
  try {
    const { type, value, value2, notes, recordedAt } = req.body
    const record = await HealthRecord.findOne({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!record) {
      return res.status(404).json({ error: 'Registro no encontrado' })
    }

    if (type) {
      if (!['weight', 'glucose', 'bloodPressure', 'heartRate', 'cholesterol', 'triglycerides'].includes(type)) {
        return res.status(400).json({ error: 'Tipo inválido' })
      }
      record.type = type
    }

    if (value != null) record.value = parseFloat(value)
    if (value2 !== undefined) record.value2 = value2 != null ? parseFloat(value2) : null
    if (type) record.unit = UNITS[type]
    if (notes !== undefined) record.notes = notes || null
    if (recordedAt) record.recordedAt = new Date(recordedAt)

    await record.save()

    // Update alert status
    try {
      await MedicalAlert.destroy({ where: { healthRecordId: record.id } })
      const user = await User.findByPk(req.user.id)
      if (user && user.doctorId) {
        const checkResult = checkHealthLimits(record.type, record.value, record.value2)
        if (checkResult && checkResult.isAbnormal) {
          let displayValue = `${record.value} ${UNITS[record.type] || ''}`
          if (record.type === 'bloodPressure' && record.value2 != null) {
            displayValue = `${record.value}/${record.value2} ${UNITS[record.type] || ''}`
          } else if (record.type === 'weight' && record.value2 != null) {
            const heightM = record.value2 / 100
            const bmi = record.value / (heightM * heightM)
            displayValue = `${record.value} kg (IMC: ${bmi.toFixed(1)})`
          }

          const alert = await MedicalAlert.create({
            userId: user.id,
            doctorId: user.doctorId,
            healthRecordId: record.id,
            severity: checkResult.severity,
            type: record.type,
            message: checkResult.message,
            value: displayValue,
            description: checkResult.description,
            status: 'pending',
            recordedAt: record.recordedAt,
          })

          const doctor = await User.findByPk(user.doctorId)
          if (doctor?.deviceToken) {
            sendPushNotification(doctor.deviceToken, {
              title: checkResult.severity === 'critical' ? '🚨 Alerta Crítica' : '⚠️ Alerta Médica',
              body: `${user.name}: ${checkResult.message} (${displayValue})`,
              data: { type: 'medical_alert', alertId: alert.id, patientId: user.id, url: '/doctor' }
            })
          }
        }
      }
    } catch (alertErr) {
      console.error('Error updating medical alert:', alertErr)
    }

    res.json({ message: 'Registro actualizado exitosamente', record })
  } catch (error) {
    console.error('Error actualizando registro de salud:', error)
    res.status(500).json({ error: 'Error al actualizar el registro' })
  }
})

// DELETE /api/health-tracking/records/:id — delete a health record
router.delete('/records/:id', async (req, res) => {
  try {
    const record = await HealthRecord.findOne({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!record) {
      return res.status(404).json({ error: 'Registro no encontrado' })
    }

    await MedicalAlert.destroy({ where: { healthRecordId: record.id } })
    await record.destroy()

    res.json({ message: 'Registro eliminado exitosamente' })
  } catch (error) {
    console.error('Error eliminando registro de salud:', error)
    res.status(500).json({ error: 'Error al eliminar el registro' })
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

// GET /api/health-tracking/streaks — get active streaks for the user
router.get('/streaks', async (req, res) => {
  try {
    const userId = req.user.id
    const records = await HealthRecord.findAll({
      attributes: ['recordedAt'],
      where: { userId, familyMemberId: null },
      order: [['recordedAt', 'DESC']],
      raw: true
    })
    const streaks = calculateStreaks(records)
    res.json(streaks)
  } catch (error) {
    console.error('Error obteniendo rachas de salud:', error)
    res.status(500).json({ error: 'Error al obtener las rachas de salud' })
  }
})

// GET /api/health-tracking/alerts — list patient's alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await MedicalAlert.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['name']
        },
        {
          model: HealthRecord,
          as: 'healthRecord',
          include: [
            {
              model: FamilyMember,
              as: 'familyMember',
              attributes: ['name', 'relationship']
            }
          ]
        }
      ],
      order: [['recordedAt', 'DESC']]
    })

    const METRIC_LABELS = {
      weight: 'Peso',
      glucose: 'Glucosa',
      bloodPressure: 'Presión Arterial',
      heartRate: 'Frec. Cardíaca',
      cholesterol: 'Colesterol',
      triglycerides: 'Triglicéridos',
    }

    const RELATIONSHIP_LABELS = {
      abuelo: 'Abuelo', abuela: 'Abuela', padre: 'Padre', madre: 'Madre',
      tio: 'Tío', tia: 'Tía', hermano: 'Hermano', hermana: 'Hermana',
      hijo: 'Hijo', hija: 'Hija', otro: 'Otro',
    }

    const formattedAlerts = alerts.map(alert => {
      const plainAlert = alert.get({ plain: true })
      
      let memberName = plainAlert.patient?.name || 'Usuario'
      let relationLabel = ''

      const fMember = plainAlert.healthRecord?.familyMember
      if (fMember) {
        memberName = fMember.name
        relationLabel = RELATIONSHIP_LABELS[fMember.relationship] || fMember.relationship
      }

      return {
        ...plainAlert,
        memberName,
        relationLabel,
        metricLabel: METRIC_LABELS[plainAlert.type] || plainAlert.type
      }
    })

    res.json({ alerts: formattedAlerts })
  } catch (error) {
    console.error('Error obteniendo alertas:', error)
    res.status(500).json({ error: 'Error al obtener alertas' })
  }
})

export default router
