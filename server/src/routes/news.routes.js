import { Router } from 'express'
import NewsPost from '../models/NewsPost.js'

const router = Router()

// Get all news (paginated)
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10)
    const limit = parseInt(req.query.limit || '9', 10)
    const offset = (page - 1) * limit

    const where = { isPublished: true }

    const { count, rows } = await NewsPost.findAndCountAll({
      where,
      order: [
        ['isPinned', 'DESC'],
        ['publishedAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset,
    })

    res.json({
      posts: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    })
  } catch (err) {
    next(err)
  }
})

// Get featured news
router.get('/featured', async (req, res, next) => {
  try {
    const posts = await NewsPost.findAll({
      where: { isPublished: true },
      order: [
        ['isPinned', 'DESC'],
        ['publishedAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: 4,
    })
    res.json({ posts })
  } catch (err) {
    next(err)
  }
})

// Get news by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    const post = await NewsPost.findOne({
      where: { slug, isPublished: true },
    })

    if (!post) {
      return res.status(404).json({ error: 'Noticia no encontrada' })
    }

    res.json({ post })
  } catch (err) {
    next(err)
  }
})

export default router
