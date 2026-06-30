import { Router } from 'express'
import Supplement from '../models/Supplement.js'
import FamilyMember from '../models/FamilyMember.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

// Require authentication for all routes
router.use(authenticate)

// GET /api/supplements — list supplements
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

    const supplements = await Supplement.findAll({
      where,
      order: [['createdAt', 'DESC']],
    })

    res.json({ supplements })
  } catch (err) {
    next(err)
  }
})

// POST /api/supplements — create supplement
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

    const supplement = await Supplement.create(payload)
    res.status(201).json({ message: 'Suplemento registrado', supplement })
  } catch (err) {
    next(err)
  }
})

// PUT /api/supplements/:id — update supplement
router.put('/:id', async (req, res, next) => {
  try {
    const { name, dose, frequency, schedules, instructions } = req.body

    const supplement = await Supplement.findOne({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!supplement) {
      return res.status(404).json({ error: 'Suplemento no encontrado' })
    }

    if (name) supplement.name = name
    if (dose) supplement.dose = dose
    if (frequency) supplement.frequency = frequency
    if (schedules !== undefined) supplement.schedules = schedules || []
    if (instructions !== undefined) supplement.instructions = instructions || null

    await supplement.save()
    res.json({ message: 'Suplemento actualizado', supplement })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/supplements/:id — delete supplement
router.delete('/:id', async (req, res, next) => {
  try {
    const supplement = await Supplement.findOne({
      where: { id: req.params.id, userId: req.user.id }
    })

    if (!supplement) {
      return res.status(404).json({ error: 'Suplemento no encontrado' })
    }

    await supplement.destroy()
    res.json({ message: 'Suplemento eliminado exitosamente' })
  } catch (err) {
    next(err)
  }
})

export default router
