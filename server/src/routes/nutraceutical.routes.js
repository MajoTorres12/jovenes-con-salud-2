import { Router } from 'express'
import { Op } from 'sequelize'
import NutraceuticalProduct from '../models/NutraceuticalProduct.js'
import Disease from '../models/Disease.js'

const router = Router()

// GET /api/nutraceuticals — list all published products
router.get('/', async (req, res, next) => {
  try {
    const products = await NutraceuticalProduct.findAll({
      where: { isPublished: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      include: [
        {
          model: Disease,
          as: 'disease',
          attributes: ['id', 'name', 'slug'],
          required: false,
        },
      ],
    })

    res.json({ products })
  } catch (err) {
    next(err)
  }
})

// GET /api/nutraceuticals/:slug — get single product by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await NutraceuticalProduct.findOne({
      where: { slug: req.params.slug, isPublished: true },
      include: [
        {
          model: Disease,
          as: 'disease',
          attributes: ['id', 'name', 'slug'],
          required: false,
        },
      ],
    })

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    res.json({ product })
  } catch (err) {
    next(err)
  }
})

// GET /api/nutraceuticals/by-id/:id — get by UUID (for admin)
router.get('/by-id/:id', async (req, res, next) => {
  try {
    const product = await NutraceuticalProduct.findByPk(req.params.id, {
      include: [{ model: Disease, as: 'disease', attributes: ['id', 'name', 'slug'], required: false }],
    })
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json({ product })
  } catch (err) {
    next(err)
  }
})

export default router
