import { Router } from 'express'
import { Op } from 'sequelize'
import User from '../models/User.js'
import HealthRecord from '../models/HealthRecord.js'
import MedicalAlert from '../models/MedicalAlert.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { checkHealthLimits } from '../utils/healthLimits.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

const AVAILABLE_DEVICES = [
  { id: 'fitbit', name: 'Fitbit Charge 6', brand: 'Fitbit', metrics: ['heartRate', 'weight', 'bloodPressure'] },
  { id: 'samsung', name: 'Samsung Galaxy Watch 6', brand: 'Samsung', metrics: ['heartRate', 'bloodPressure'] },
  { id: 'xiaomi', name: 'Xiaomi Smart Band 8', brand: 'Xiaomi', metrics: ['heartRate', 'weight'] },
  { id: 'garmin', name: 'Garmin Venu 3', brand: 'Garmin', metrics: ['heartRate', 'bloodPressure'] },
  { id: 'apple', name: 'Apple Watch Series 9', brand: 'Apple', metrics: ['heartRate', 'bloodPressure'] },
]

const UNITS = {
  weight: 'kg',
  glucose: 'mg/dL',
  bloodPressure: 'mmHg',
  heartRate: 'bpm',
  cholesterol: 'mg/dL',
  triglycerides: 'mg/dL',
}

// GET /api/wearable/status
router.get('/status', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const metrics = user.wearableMetrics || []
    const syncedToday = await HealthRecord.count({
      where: {
        userId: user.id,
        type: metrics,
        recordedAt: {
          [Op.gte]: todayStart
        }
      }
    })

    res.json({
      connected: user.wearableConnected,
      deviceId: user.wearableDeviceId,
      deviceName: user.wearableDeviceName,
      lastSync: user.wearableLastSync,
      syncedToday,
      deviceMetrics: metrics,
      availableDevices: AVAILABLE_DEVICES
    })
  } catch (error) {
    console.error('Error fetching wearable status:', error)
    res.status(500).json({ error: 'Error al obtener estado del wearable' })
  }
})

// POST /api/wearable/connect
router.post('/connect', async (req, res) => {
  try {
    const { deviceId } = req.body
    const device = AVAILABLE_DEVICES.find(d => d.id === deviceId)
    if (!device) {
      return res.status(400).json({ error: 'Dispositivo no soportado' })
    }

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    user.wearableConnected = true
    user.wearableDeviceId = device.id
    user.wearableDeviceName = device.name
    user.wearableMetrics = device.metrics
    await user.save()

    res.json({
      message: `Dispositivo ${device.name} conectado correctamente`,
      device
    })
  } catch (error) {
    console.error('Error connecting wearable:', error)
    res.status(500).json({ error: 'Error al conectar dispositivo' })
  }
})

// DELETE /api/wearable/disconnect
router.delete('/disconnect', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    user.wearableConnected = false
    user.wearableDeviceId = null
    user.wearableDeviceName = null
    user.wearableMetrics = null
    await user.save()

    res.json({ message: 'Dispositivo desconectado correctamente' })
  } catch (error) {
    console.error('Error disconnecting wearable:', error)
    res.status(500).json({ error: 'Error al desconectar dispositivo' })
  }
})

// POST /api/wearable/sync
router.post('/sync', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user || !user.wearableConnected) {
      return res.status(400).json({ error: 'No hay ningún dispositivo conectado' })
    }

    const metrics = user.wearableMetrics || []
    const saved = []
    const skipped = []

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    for (const type of metrics) {
      const existing = await HealthRecord.findOne({
        where: {
          userId: user.id,
          type,
          recordedAt: {
            [Op.between]: [todayStart, todayEnd]
          }
        }
      })

      if (existing) {
        skipped.push({ type, reason: 'Ya registrado hoy' })
        continue
      }

      let value = 0
      let value2 = null
      const rand = Math.random()

      if (type === 'heartRate') {
        value = rand > 0.85 
          ? (rand > 0.95 ? Math.floor(45 + Math.random() * 10) : Math.floor(105 + Math.random() * 25))
          : Math.floor(65 + Math.random() * 25)
      } else if (type === 'bloodPressure') {
        if (rand > 0.85) {
          value = Math.floor(142 + Math.random() * 15)
          value2 = Math.floor(92 + Math.random() * 8)
        } else {
          value = Math.floor(115 + Math.random() * 10)
          value2 = Math.floor(75 + Math.random() * 10)
        }
      } else if (type === 'weight') {
        value = Math.floor(62 + Math.random() * 25)
        value2 = 170
      } else {
        value = Math.floor(70 + Math.random() * 20)
      }

      const record = await HealthRecord.create({
        userId: user.id,
        type,
        value,
        value2,
        unit: UNITS[type] || '',
        notes: 'Sincronizado vía ' + user.wearableDeviceName,
        recordedAt: new Date()
      })

      let isOut = false
      try {
        const checkResult = checkHealthLimits(type, value, value2)
        if (checkResult && checkResult.isAbnormal) {
          isOut = true
          if (user.doctorId) {
            let displayValue = `${value} ${UNITS[type] || ''}`
            if (type === 'bloodPressure' && value2 != null) {
              displayValue = `${value}/${value2} ${UNITS[type] || ''}`
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
        console.error('Error generating alert for simulated wearable record:', alertErr)
      }

      saved.push({
        type,
        value,
        value2,
        unit: UNITS[type] || '',
        isOut
      })
    }

    user.wearableLastSync = new Date()
    await user.save()

    res.json({
      message: saved.length > 0
        ? `Sincronización de ${user.wearableDeviceName} completada con éxito.`
        : 'Sincronización completada. No había nuevos datos para registrar.',
      saved,
      skipped
    })
  } catch (error) {
    console.error('Error syncing wearable:', error)
    res.status(500).json({ error: 'Error al sincronizar dispositivo' })
  }
})

export default router
