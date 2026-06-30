import { Router } from 'express'
import Medication from '../models/Medication.js'
import FamilyMember from '../models/FamilyMember.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

// Require authentication for all routes
router.use(authenticate)

// GET /api/medications — list medications
router.get('/', async (req, res, next) => {
  try {
    const { familyMemberId } = req.query
    const where = { userId: req.user.id }

    if (familyMemberId) {
      // Verify family member belongs to user
      const member = await FamilyMember.findOne({
        where: { id: familyMemberId, userId: req.user.id }
      })
      if (!member) {
        return res.status(404).json({ error: 'Familiar no encontrado' })
      }
      where.familyMemberId = familyMemberId
    } else {
      where.familyMemberId = null
    }

    const medications = await Medication.findAll({
      where,
      order: [['createdAt', 'DESC']],
    })

    res.json({ medications })
  } catch (err) {
    next(err)
  }
})

// POST /api/medications — create medication
router.post('/', async (req, res, next) => {
  try {
    const { name, dose, frequency, schedules, instructions, familyMemberId } = req.body

    if (!name || !dose || !frequency) {
      return res.status(400).json({ error: 'Nombre, dosis y frecuencia son requeridos' })
    }

    const payload = {
      userId: req.user.id,
      name,
      dose,
      frequency,
      schedules: schedules || [],
      instructions: instructions || null,
    }

    if (familyMemberId) {
      // Verify family member belongs to user
      const member = await FamilyMember.findOne({
        where: { id: familyMemberId, userId: req.user.id }
      })
      if (!member) {
        return res.status(404).json({ error: 'Familiar no encontrado' })
      }
      payload.familyMemberId = familyMemberId
    }

    const medication = await Medication.create(payload)
    res.status(201).json({ message: 'Medicamento registrado', medication })
  } catch (err) {
    next(err)
  }
})

// PUT /api/medications/:id — update medication
router.put('/:id', async (req, res, next) => {
  try {
    const { name, dose, frequency, schedules, instructions } = req.body

    const medication = await Medication.findOne({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!medication) {
      return res.status(404).json({ error: 'Medicamento no encontrado' })
    }

    if (name) medication.name = name
    if (dose) medication.dose = dose
    if (frequency) medication.frequency = frequency
    if (schedules !== undefined) medication.schedules = schedules || []
    if (instructions !== undefined) medication.instructions = instructions || null

    await medication.save()
    res.json({ message: 'Medicamento actualizado', medication })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/medications/:id — delete medication
router.delete('/:id', async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!medication) {
      return res.status(404).json({ error: 'Medicamento no encontrado' })
    }

    await medication.destroy()
    res.json({ message: 'Medicamento eliminado exitosamente' })
  } catch (err) {
    next(err)
  }
})

export default router
