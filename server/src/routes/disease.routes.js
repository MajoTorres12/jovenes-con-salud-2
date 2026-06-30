import { Router } from 'express'
import { Op } from 'sequelize'
import Disease from '../models/Disease.js'

const router = Router()

// Get all diseases
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query
    const where = { isPublished: true }

    if (category) {
      where.category = category
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ]
    }

    const diseases = await Disease.findAll({
      where,
      order: [['name', 'ASC']],
    })

    res.json({ diseases })
  } catch (err) {
    next(err)
  }
})

// Get disease by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    const disease = await Disease.findOne({
      where: { slug, isPublished: true },
    })

    if (!disease) {
      return res.status(404).json({ error: 'Enfermedad no encontrada' })
    }

    res.json({ disease })
  } catch (err) {
    next(err)
  }
})

export default router
