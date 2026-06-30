import { Router } from 'express'
import { Op } from 'sequelize'
import FamilyMember from '../models/FamilyMember.js'
import HealthRecord from '../models/HealthRecord.js'
import { authenticate } from '../middleware/auth.middleware.js'
import User from '../models/User.js'
import MedicalAlert from '../models/MedicalAlert.js'
import { checkHealthLimits } from '../utils/healthLimits.js'
import { calculateStreaks } from '../utils/streakUtils.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

const UNITS = {
  weight: 'kg',
  glucose: 'mg/dL',
  bloodPressure: 'mmHg',
  heartRate: 'bpm',
  cholesterol: 'mg/dL',
  triglycerides: 'mg/dL',
}

const RELATIONSHIP_LABELS = {
  abuelo: 'Abuelo',
  abuela: 'Abuela',
  padre: 'Padre',
  madre: 'Madre',
  tio: 'Tío',
  tia: 'Tía',
  hermano: 'Hermano',
  hermana: 'Hermana',
  hijo: 'Hijo',
  hija: 'Hija',
  otro: 'Otro',
}

// Helper: Validate CURP format
function validateCurp(curp) {
  if (!curp || curp.length !== 18) return false
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/i
  return curpRegex.test(curp)
}

// GET /api/family — List all family members of the user
router.get('/', async (req, res, next) => {
  try {
    const members = await FamilyMember.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']],
    })
    res.json({ members })
  } catch (err) {
    next(err)
  }
})

// POST /api/family — Create a new family member
router.post('/', async (req, res, next) => {
  try {
    const { name, relationship, birthDate, gender, municipality, diagnosis, notes, curp } = req.body

    if (!name || !relationship || !birthDate || !gender || !curp) {
      return res.status(400).json({ error: 'Nombre, parentesco, fecha de nacimiento, género y CURP son requeridos' })
    }

    const cleanCurp = curp.trim().toUpperCase()
    if (!validateCurp(cleanCurp)) {
      return res.status(400).json({ error: 'El formato de la CURP es inválido' })
    }

    const member = await FamilyMember.create({
      userId: req.user.id,
      name,
      relationship,
      birthDate,
      gender,
      municipality: municipality || null,
      diagnosis: diagnosis || null,
      notes: notes || null,
      curp: cleanCurp,
    })

    res.status(201).json({ message: 'Familiar creado exitosamente', member })
  } catch (err) {
    next(err)
  }
})

// PUT /api/family/:id — Update a family member
router.put('/:id', async (req, res, next) => {
  try {
    const { name, relationship, birthDate, gender, municipality, diagnosis, notes, curp } = req.body
    const member = await FamilyMember.findOne({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!member) {
      return res.status(404).json({ error: 'Familiar no encontrado' })
    }

    if (curp) {
      const cleanCurp = curp.trim().toUpperCase()
      if (!validateCurp(cleanCurp)) {
        return res.status(400).json({ error: 'El formato de la CURP es inválido' })
      }
      member.curp = cleanCurp
    }

    if (name) member.name = name
    if (relationship) member.relationship = relationship
    if (birthDate) member.birthDate = birthDate
    if (gender) member.gender = gender
    if (municipality !== undefined) member.municipality = municipality || null
    if (diagnosis !== undefined) member.diagnosis = diagnosis || null
    if (notes !== undefined) member.notes = notes || null

    await member.save()
    res.json({ message: 'Familiar actualizado exitosamente', member })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/family/:id — Delete a family member
router.delete('/:id', async (req, res, next) => {
  try {
    const member = await FamilyMember.findOne({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!member) {
      return res.status(404).json({ error: 'Familiar no encontrado' })
    }

    await member.destroy()
    res.json({ message: 'Familiar eliminado exitosamente' })
  } catch (err) {
    next(err)
  }
})

// GET /api/family/:memberId/health — Get all health records of a family member
router.get('/:memberId/health', async (req, res, next) => {
  try {
    const { memberId } = req.params
    const { type, from, to, limit = 50 } = req.query

    // Verify ownership
    const member = await FamilyMember.findOne({
      where: { id: memberId, userId: req.user.id }
    })
    if (!member) {
      return res.status(404).json({ error: 'Familiar no encontrado' })
    }

    const where = { familyMemberId: memberId }
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
  } catch (err) {
    next(err)
  }
})

// POST /api/family/:memberId/health — Create health record for a family member
router.post('/:memberId/health', async (req, res, next) => {
  try {
    const { memberId } = req.params
    const { type, value, value2, notes, recordedAt } = req.body

    const member = await FamilyMember.findOne({
      where: { id: memberId, userId: req.user.id }
    })
    if (!member) {
      return res.status(404).json({ error: 'Familiar no encontrado' })
    }

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
      familyMemberId: memberId,
      type,
      value: parseFloat(value),
      value2: value2 != null ? parseFloat(value2) : null,
      unit: UNITS[type],
      notes: notes || null,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    })

    // Check health limits and trigger alert for family member if abnormal
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

          const relLabel = RELATIONSHIP_LABELS[member.relationship] || member.relationship
          const familyName = `${member.name} (${relLabel})`

          await MedicalAlert.create({
            userId: user.id,
            doctorId: user.doctorId,
            healthRecordId: record.id,
            severity: checkResult.severity,
            type,
            message: `${checkResult.message} - ${familyName}`,
            value: displayValue,
            description: `Familiar de ${user.name}: ${checkResult.description}`,
            status: 'pending',
            recordedAt: record.recordedAt,
          })
        }
      }
    } catch (alertErr) {
      console.error('Error generating medical alert for family member:', alertErr)
    }

    res.status(201).json({ message: 'Registro creado', record })
  } catch (err) {
    next(err)
  }
})

// GET /api/family/:memberId/health/stats — Get latest record stats for a family member
router.get('/:memberId/health/stats', async (req, res, next) => {
  try {
    const { memberId } = req.params

    const member = await FamilyMember.findOne({
      where: { id: memberId, userId: req.user.id }
    })
    if (!member) {
      return res.status(404).json({ error: 'Familiar no encontrado' })
    }

    const types = ['weight', 'glucose', 'bloodPressure', 'heartRate', 'cholesterol', 'triglycerides']
    const latest = {}

    for (const type of types) {
      const record = await HealthRecord.findOne({
        where: { familyMemberId: memberId, type },
        order: [['recordedAt', 'DESC']],
      })
      latest[type] = record || null
    }

    const totalRecords = await HealthRecord.count({ where: { familyMemberId: memberId } })

    res.json({ latest, totalRecords })
  } catch (err) {
    next(err)
  }
})

// GET /api/family/:memberId/health/streaks — Get active streaks for a family member
router.get('/:memberId/health/streaks', async (req, res, next) => {
  try {
    const { memberId } = req.params

    const member = await FamilyMember.findOne({
      where: { id: memberId, userId: req.user.id }
    })
    if (!member) {
      return res.status(404).json({ error: 'Familiar no encontrado' })
    }

    const records = await HealthRecord.findAll({
      attributes: ['recordedAt'],
      where: { familyMemberId: memberId },
      order: [['recordedAt', 'DESC']],
      raw: true
    })
    
    const streaks = calculateStreaks(records)
    res.json(streaks)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/family/:memberId/health/:recordId — Delete a health record
router.delete('/:memberId/health/:recordId', async (req, res, next) => {
  try {
    const { memberId, recordId } = req.params

    const member = await FamilyMember.findOne({
      where: { id: memberId, userId: req.user.id }
    })
    if (!member) {
      return res.status(404).json({ error: 'Familiar no encontrado' })
    }

    const record = await HealthRecord.findOne({
      where: { id: recordId, familyMemberId: memberId }
    })

    if (!record) {
      return res.status(404).json({ error: 'Registro no encontrado' })
    }

    await MedicalAlert.destroy({ where: { healthRecordId: record.id } })
    await record.destroy()
    res.json({ message: 'Registro eliminado exitosamente' })
  } catch (err) {
    next(err)
  }
})

// PUT /api/family/:memberId/health/:recordId — Update a health record
router.put('/:memberId/health/:recordId', async (req, res, next) => {
  try {
    const { memberId, recordId } = req.params
    const { type, value, value2, notes, recordedAt } = req.body

    const member = await FamilyMember.findOne({
      where: { id: memberId, userId: req.user.id }
    })
    if (!member) {
      return res.status(404).json({ error: 'Familiar no encontrado' })
    }

    const record = await HealthRecord.findOne({
      where: { id: recordId, familyMemberId: memberId }
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

          const relLabel = RELATIONSHIP_LABELS[member.relationship] || member.relationship
          const familyName = `${member.name} (${relLabel})`

          await MedicalAlert.create({
            userId: user.id,
            doctorId: user.doctorId,
            healthRecordId: record.id,
            severity: checkResult.severity,
            type: record.type,
            message: `${checkResult.message} - ${familyName}`,
            value: displayValue,
            description: `Familiar de ${user.name}: ${checkResult.description}`,
            status: 'pending',
            recordedAt: record.recordedAt,
          })
        }
      }
    } catch (alertErr) {
      console.error('Error updating medical alert for family member:', alertErr)
    }

    res.json({ message: 'Registro actualizado exitosamente', record })
  } catch (err) {
    next(err)
  }
})

export default router
