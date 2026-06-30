import { Router } from 'express'
import Article from '../models/Article.js'

const router = Router()

// Get all articles
router.get('/', async (req, res, next) => {
  try {
    const { diseaseId, limit } = req.query
    const where = { isPublished: true }

    if (diseaseId) {
      where.diseaseId = diseaseId
    }

    const queryOptions = {
      where,
      order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
    }

    if (limit) {
      queryOptions.limit = parseInt(limit, 10)
    }

    const articles = await Article.findAll(queryOptions)

    res.json({ articles })
  } catch (err) {
    next(err)
  }
})

export default router
