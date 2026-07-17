import { Router } from 'express'
import { Op } from 'sequelize'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireAdmin } from '../middleware/admin.middleware.js'
import User from '../models/User.js'
import Disease from '../models/Disease.js'
import NutraceuticalProduct from '../models/NutraceuticalProduct.js'
import NewsPost from '../models/NewsPost.js'
import ContactMessage from '../models/ContactMessage.js'
import ContactSettings from '../models/ContactSettings.js'
import HealthRecord from '../models/HealthRecord.js'
import Location from '../models/Location.js'
import Article from '../models/Article.js'
import DiseaseVariant from '../models/DiseaseVariant.js'
import { sendMulticastNotification } from '../services/pushNotification.service.js'

import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// All routes require admin
router.use(authenticate, requireAdmin)

// Multer storage configuration for uploads
const uploadDir = 'public/images/uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp, gif)'))
  }
})

// Upload image endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo' })
  }
  const filePath = `images/uploads/${req.file.filename}`
  res.json({ imageUrl: filePath })
})

// ── Helper: slugify ─────────────────────────────────
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ══════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════

router.get('/stats', async (_req, res, next) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalDiseases,
      totalNutraceuticals,
      totalNews,
      totalMessages,
      pendingMessages,
      totalHealthRecords,
      totalArticles,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
      Disease.count(),
      NutraceuticalProduct.count(),
      NewsPost.count(),
      ContactMessage.count(),
      ContactMessage.count({ where: { status: 'pending' } }),
      HealthRecord.count(),
      Article.count(),
    ])

    res.json({
      users: { total: totalUsers, active: activeUsers, newLast30: newUsers },
      diseases: totalDiseases,
      nutraceuticals: totalNutraceuticals,
      news: totalNews,
      messages: { total: totalMessages, pending: pendingMessages },
      healthRecords: totalHealthRecords,
      articles: totalArticles,
    })
  } catch (err) {
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// USERS (list + role change + toggle active)
// ══════════════════════════════════════════════════════

router.get('/users', async (req, res, next) => {
  try {
    const { search } = req.query
    const where = {}
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ]
    }
    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    })
    res.json({ users })
  } catch (err) {
    next(err)
  }
})

router.get('/doctors', async (req, res, next) => {
  try {
    const doctors = await User.findAll({
      where: { role: 'doctor', isActive: true },
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']]
    })
    res.json({ doctors })
  } catch (err) {
    next(err)
  }
})

router.put('/users/:id/assign-doctor', async (req, res, next) => {
  try {
    const { doctorId } = req.body
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    if (doctorId) {
      const doctor = await User.findOne({ where: { id: doctorId, role: 'doctor' } })
      if (!doctor) return res.status(400).json({ error: 'El ID proporcionado no pertenece a un médico registrado.' })
      user.doctorId = doctorId
    } else {
      user.doctorId = null
    }

    await user.save()
    res.json({ message: 'Médico asignado correctamente', user: { id: user.id, doctorId: user.doctorId } })
  } catch (err) {
    next(err)
  }
})

router.put('/users/:id/role', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    user.role = req.body.role || user.role
    await user.save()
    res.json({ message: 'Rol actualizado', user: { id: user.id, role: user.role } })
  } catch (err) {
    next(err)
  }
})

router.put('/users/:id/toggle-active', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    user.isActive = !user.isActive
    await user.save()
    res.json({ message: user.isActive ? 'Usuario activado' : 'Usuario desactivado', isActive: user.isActive })
  } catch (err) {
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// DISEASES CRUD
// ══════════════════════════════════════════════════════

router.get('/diseases', async (req, res, next) => {
  try {
    const { search } = req.query
    const where = {}
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
      ]
    }
    const diseases = await Disease.findAll({ where, order: [['name', 'ASC']] })
    res.json({ diseases })
  } catch (err) {
    next(err)
  }
})

router.post('/diseases', async (req, res, next) => {
  try {
    const data = req.body
    if (!data.name || !data.category || !data.description) {
      return res.status(400).json({ error: 'Nombre, categoría y descripción son requeridos' })
    }
    data.slug = data.slug || slugify(data.name)

    // Ensure unique slug
    let slug = data.slug
    let counter = 1
    while (await Disease.findOne({ where: { slug } })) {
      slug = `${data.slug}-${counter++}`
    }
    data.slug = slug

    const disease = await Disease.create(data)
    res.status(201).json({ message: 'Enfermedad creada', disease })
  } catch (err) {
    next(err)
  }
})

router.put('/diseases/:id', async (req, res, next) => {
  try {
    const disease = await Disease.findByPk(req.params.id)
    if (!disease) return res.status(404).json({ error: 'Enfermedad no encontrada' })

    const data = req.body
    // If name changed and slug not manually set, regenerate slug
    if (data.name && data.name !== disease.name && !data.slug) {
      let slug = slugify(data.name)
      let counter = 1
      while (true) {
        const existing = await Disease.findOne({ where: { slug, id: { [Op.ne]: disease.id } } })
        if (!existing) break
        slug = `${slugify(data.name)}-${counter++}`
      }
      data.slug = slug
    }

    await disease.update(data)
    res.json({ message: 'Enfermedad actualizada', disease })
  } catch (err) {
    next(err)
  }
})

router.delete('/diseases/:id', async (req, res, next) => {
  try {
    const disease = await Disease.findByPk(req.params.id)
    if (!disease) return res.status(404).json({ error: 'Enfermedad no encontrada' })
    await disease.destroy()
    res.json({ message: 'Enfermedad eliminada' })
  } catch (err) {
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// DISEASE VARIANTS CRUD
// ══════════════════════════════════════════════════════

// Get all variants for a disease
router.get('/diseases/:diseaseId/variants', async (req, res, next) => {
  try {
    const { diseaseId } = req.params
    const variants = await DiseaseVariant.findAll({
      where: { diseaseId },
      order: [['name', 'ASC']]
    })
    res.json({ variants })
  } catch (err) {
    next(err)
  }
})

// Create a variant for a disease
router.post('/diseases/:diseaseId/variants', async (req, res, next) => {
  try {
    const { diseaseId } = req.params
    const data = req.body
    if (!data.name || !data.description) {
      return res.status(400).json({ error: 'Nombre y descripción son requeridos' })
    }

    const resources = data.externalResources || data.external_resources
    const videos = data.youtubeVideos || data.youtube_videos
    
    const payload = {
      diseaseId,
      name: data.name,
      description: data.description,
      treatment: data.treatment || '',
      validatedBy: data.validatedBy || 'Secretaría de Salud de Tamaulipas',
      symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
      riskFactors: Array.isArray(data.riskFactors) ? data.riskFactors : [],
      externalResources: Array.isArray(resources) ? resources : [],
      youtubeVideos: Array.isArray(videos) ? videos : [],
    }

    const variant = await DiseaseVariant.create(payload)
    res.status(201).json({ message: 'Variante creada', variant })
  } catch (err) {
    next(err)
  }
})

// Update a variant
router.put('/diseases/variants/:id', async (req, res, next) => {
  try {
    const variant = await DiseaseVariant.findByPk(req.params.id)
    if (!variant) return res.status(404).json({ error: 'Variante no encontrada' })

    const data = req.body
    const resources = data.externalResources || data.external_resources
    const videos = data.youtubeVideos || data.youtube_videos

    const payload = {
      name: data.name ?? variant.name,
      description: data.description ?? variant.description,
      treatment: data.treatment ?? variant.treatment,
      validatedBy: data.validatedBy ?? variant.validatedBy,
      symptoms: Array.isArray(data.symptoms) ? data.symptoms : variant.symptoms,
      riskFactors: Array.isArray(data.riskFactors) ? data.riskFactors : variant.riskFactors,
      externalResources: Array.isArray(resources) ? resources : variant.externalResources,
      youtubeVideos: Array.isArray(videos) ? videos : variant.youtubeVideos,
    }

    await variant.update(payload)
    res.json({ message: 'Variante actualizada', variant })
  } catch (err) {
    next(err)
  }
})

// Delete a variant
router.delete('/diseases/variants/:id', async (req, res, next) => {
  try {
    const variant = await DiseaseVariant.findByPk(req.params.id)
    if (!variant) return res.status(404).json({ error: 'Variante no encontrada' })
    await variant.destroy()
    res.json({ message: 'Variante eliminada' })
  } catch (err) {
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// NUTRACEUTICALS CRUD
// ══════════════════════════════════════════════════════

router.get('/nutraceuticals', async (req, res, next) => {
  try {
    const { search } = req.query
    const where = {}
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` }
    }
    const products = await NutraceuticalProduct.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      include: [{ model: Disease, as: 'disease', attributes: ['id', 'name', 'slug'], required: false }],
    })
    res.json({ products })
  } catch (err) {
    next(err)
  }
})

router.post('/nutraceuticals', async (req, res, next) => {
  try {
    const data = req.body
    if (!data.name) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }
    data.slug = data.slug || slugify(data.name)

    let slug = data.slug
    let counter = 1
    while (await NutraceuticalProduct.findOne({ where: { slug } })) {
      slug = `${data.slug}-${counter++}`
    }
    data.slug = slug

    const product = await NutraceuticalProduct.create(data)
    res.status(201).json({ message: 'Producto creado', product })
  } catch (err) {
    next(err)
  }
})

router.put('/nutraceuticals/:id', async (req, res, next) => {
  try {
    const product = await NutraceuticalProduct.findByPk(req.params.id)
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })

    const data = req.body
    if (data.name && data.name !== product.name && !data.slug) {
      let slug = slugify(data.name)
      let counter = 1
      while (true) {
        const existing = await NutraceuticalProduct.findOne({ where: { slug, id: { [Op.ne]: product.id } } })
        if (!existing) break
        slug = `${slugify(data.name)}-${counter++}`
      }
      data.slug = slug
    }

    await product.update(data)
    res.json({ message: 'Producto actualizado', product })
  } catch (err) {
    next(err)
  }
})

router.delete('/nutraceuticals/:id', async (req, res, next) => {
  try {
    const product = await NutraceuticalProduct.findByPk(req.params.id)
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
    await product.destroy()
    res.json({ message: 'Producto eliminado' })
  } catch (err) {
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// NEWS CRUD
// ══════════════════════════════════════════════════════

router.get('/news', async (req, res, next) => {
  try {
    const { search } = req.query
    const where = {}
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` }
    }
    const posts = await NewsPost.findAll({
      where,
      order: [['isPinned', 'DESC'], ['publishedAt', 'DESC'], ['createdAt', 'DESC']],
    })
    res.json({ posts })
  } catch (err) {
    next(err)
  }
})

router.post('/news', async (req, res, next) => {
  try {
    const data = req.body
    if (!data.title || !data.content) {
      return res.status(400).json({ error: 'Título y contenido son requeridos' })
    }
    data.slug = data.slug || slugify(data.title)

    let slug = data.slug
    let counter = 1
    while (await NewsPost.findOne({ where: { slug } })) {
      slug = `${data.slug}-${counter++}`
    }
    data.slug = slug

    if (!data.publishedAt) {
      data.publishedAt = new Date()
    }

    const post = await NewsPost.create(data)

    if (post.isPublished) {
      try {
        const patients = await User.findAll({
          where: {
            role: 'user',
            deviceToken: { [Op.ne]: null }
          }
        })
        const tokens = patients.map(p => p.deviceToken).filter(Boolean)
        if (tokens.length > 0) {
          sendMulticastNotification(tokens, {
            title: '📰 Nueva Noticia de Salud',
            body: post.title,
            data: { type: 'new_news', id: post.id, slug: post.slug, url: `/news/${post.slug}` }
          })
        }
      } catch (fcmErr) {
        console.error('Error sending multicast notification for news:', fcmErr)
      }
    }

    res.status(201).json({ message: 'Noticia creada', post })
  } catch (err) {
    next(err)
  }
})

router.put('/news/:id', async (req, res, next) => {
  try {
    const post = await NewsPost.findByPk(req.params.id)
    if (!post) return res.status(404).json({ error: 'Noticia no encontrada' })

    const data = req.body
    if (data.title && data.title !== post.title && !data.slug) {
      let slug = slugify(data.title)
      let counter = 1
      while (true) {
        const existing = await NewsPost.findOne({ where: { slug, id: { [Op.ne]: post.id } } })
        if (!existing) break
        slug = `${slugify(data.title)}-${counter++}`
      }
      data.slug = slug
    }

    await post.update(data)
    res.json({ message: 'Noticia actualizada', post })
  } catch (err) {
    next(err)
  }
})

router.delete('/news/:id', async (req, res, next) => {
  try {
    const post = await NewsPost.findByPk(req.params.id)
    if (!post) return res.status(404).json({ error: 'Noticia no encontrada' })
    await post.destroy()
    res.json({ message: 'Noticia eliminada' })
  } catch (err) {
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// ARTICLES CRUD
// ══════════════════════════════════════════════════════

router.get('/articles', async (req, res, next) => {
  try {
    const { search } = req.query
    const where = {}
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
      ]
    }
    const articles = await Article.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: Disease, as: 'disease', attributes: ['id', 'name', 'slug'], required: false }]
    })
    res.json({ articles })
  } catch (err) {
    next(err)
  }
})

router.post('/articles', async (req, res, next) => {
  try {
    const data = req.body
    if (!data.title || !data.content) {
      return res.status(400).json({ error: 'Título y contenido son requeridos' })
    }
    data.slug = data.slug || slugify(data.title)

    let slug = data.slug
    let counter = 1
    while (await Article.findOne({ where: { slug } })) {
      slug = `${data.slug}-${counter++}`
    }
    data.slug = slug

    if (!data.publishedAt) {
      data.publishedAt = new Date()
    }

    const article = await Article.create(data)

    if (article.isPublished) {
      try {
        const patients = await User.findAll({
          where: {
            role: 'user',
            deviceToken: { [Op.ne]: null }
          }
        })
        const tokens = patients.map(p => p.deviceToken).filter(Boolean)
        if (tokens.length > 0) {
          sendMulticastNotification(tokens, {
            title: '💡 Nuevo Artículo de Salud',
            body: article.title,
            data: { type: 'new_article', id: article.id, slug: article.slug, url: `/articles/${article.slug}` }
          })
        }
      } catch (fcmErr) {
        console.error('Error sending multicast notification for article:', fcmErr)
      }
    }

    res.status(201).json({ message: 'Artículo creado', article })
  } catch (err) {
    next(err)
  }
})

router.put('/articles/:id', async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id)
    if (!article) return res.status(404).json({ error: 'Artículo no encontrado' })

    const data = req.body
    if (data.title && data.title !== article.title && !data.slug) {
      let slug = slugify(data.title)
      let counter = 1
      while (true) {
        const existing = await Article.findOne({ where: { slug, id: { [Op.ne]: article.id } } })
        if (!existing) break
        slug = `${slugify(data.title)}-${counter++}`
      }
      data.slug = slug
    }

    await article.update(data)
    res.json({ message: 'Artículo actualizado', article })
  } catch (err) {
    next(err)
  }
})

router.delete('/articles/:id', async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id)
    if (!article) return res.status(404).json({ error: 'Artículo no encontrado' })
    await article.destroy()
    res.json({ message: 'Artículo eliminado' })
  } catch (err) {
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// CONTACT MESSAGES
// ══════════════════════════════════════════════════════

router.get('/contact/messages', async (req, res, next) => {
  try {
    const messages = await ContactMessage.findAll({
      order: [['createdAt', 'DESC']],
    })
    res.json({ messages })
  } catch (err) {
    next(err)
  }
})

router.put('/contact/messages/:id/status', async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByPk(req.params.id)
    if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' })
    msg.status = req.body.status || msg.status
    await msg.save()
    res.json({ message: 'Estado actualizado', status: msg.status })
  } catch (err) {
    next(err)
  }
})

router.delete('/contact/messages/:id', async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByPk(req.params.id)
    if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' })
    await msg.destroy()
    res.json({ message: 'Mensaje eliminado' })
  } catch (err) {
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// CONTACT SETTINGS
// ══════════════════════════════════════════════════════

router.get('/contact/settings', async (_req, res, next) => {
  try {
    const rows = await ContactSettings.findAll()
    const settings = {}
    rows.forEach(r => { settings[r.key] = r.value })
    res.json({ settings })
  } catch (err) {
    next(err)
  }
})

router.put('/contact/settings', async (req, res, next) => {
  try {
    const entries = req.body // { address: '...', phone: '...', ... }
    for (const [key, value] of Object.entries(entries)) {
      await ContactSettings.upsert({ key, value: String(value) })
    }
    const rows = await ContactSettings.findAll()
    const settings = {}
    rows.forEach(r => { settings[r.key] = r.value })
    res.json({ message: 'Configuración actualizada', settings })
  } catch (err) {
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// LOCATIONS CRUD
// ══════════════════════════════════════════════════════

router.get('/locations', async (req, res, next) => {
  try {
    const locations = await Location.findAll({
      order: [['isOfficial', 'DESC'], ['label', 'ASC']]
    })
    res.json({ locations })
  } catch (err) {
    next(err)
  }
})

router.post('/locations', async (req, res, next) => {
  try {
    const data = req.body
    if (!data.label || !data.address || data.latitude == null || data.longitude == null) {
      return res.status(400).json({ error: 'Nombre, dirección y coordenadas son requeridos' })
    }
    
    if (data.isOfficial) {
      await Location.update({ isOfficial: false }, { where: { isOfficial: true } })
    }

    const location = await Location.create(data)
    res.status(201).json({ message: 'Sede creada', location })
  } catch (err) {
    next(err)
  }
})

router.put('/locations/:id', async (req, res, next) => {
  try {
    const location = await Location.findByPk(req.params.id)
    if (!location) return res.status(404).json({ error: 'Sede no encontrada' })

    const data = req.body
    if (data.isOfficial) {
      await Location.update({ isOfficial: false }, { where: { isOfficial: true } })
    }

    await location.update(data)
    res.json({ message: 'Sede actualizada', location })
  } catch (err) {
    next(err)
  }
})

router.delete('/locations/:id', async (req, res, next) => {
  try {
    const location = await Location.findByPk(req.params.id)
    if (!location) return res.status(404).json({ error: 'Sede no encontrada' })
    await location.destroy()
    res.json({ message: 'Sede eliminada' })
  } catch (err) {
    next(err)
  }
})

export default router
