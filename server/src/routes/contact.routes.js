import { Router } from 'express'
import ContactMessage from '../models/ContactMessage.js'
import ContactSettings from '../models/ContactSettings.js'
import Location from '../models/Location.js'

const router = Router()

// GET /api/contact/locations — public endpoint for locations directory
router.get('/locations', async (_req, res) => {
  try {
    const locations = await Location.findAll({ order: [['isOfficial', 'DESC'], ['label', 'ASC']] })
    res.json({ locations })
  } catch (error) {
    console.error('Error fetching contact locations:', error)
    res.status(500).json({ error: 'Error al obtener las sedes' })
  }
})


// GET /api/contact/settings — public endpoint for contact page
router.get('/settings', async (_req, res) => {
  try {
    const rows = await ContactSettings.findAll()
    const settings = {}
    rows.forEach(r => { settings[r.key] = r.value })
    res.json({ settings })
  } catch (error) {
    console.error('Error fetching contact settings:', error)
    res.json({ settings: {} })
  }
})

// POST /api/contact — receive a contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    const contactMsg = await ContactMessage.create({ name, email, subject, message })

    res.status(201).json({
      message: 'Mensaje enviado exitosamente. Te contactaremos pronto.',
      id: contactMsg.id,
    })
  } catch (error) {
    console.error('Error guardando mensaje de contacto:', error)
    res.status(500).json({ error: 'Error al enviar el mensaje' })
  }
})

export default router
