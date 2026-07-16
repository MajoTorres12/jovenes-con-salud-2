import { Router } from 'express'
import { Op } from 'sequelize'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { sendMulticastNotification } from '../services/pushNotification.service.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// PUT /api/notifications/token — Register or update FCM device token
router.put('/token', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Se requiere el token del dispositivo' })
    }

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    user.deviceToken = token
    await user.save()

    res.json({ message: 'Token de dispositivo registrado exitosamente' })
  } catch (error) {
    console.error('Error registrando token de dispositivo:', error)
    res.status(500).json({ error: 'Error al registrar token de dispositivo' })
  }
})

// DELETE /api/notifications/token — Unregister device token (e.g. on logout)
router.delete('/token', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    user.deviceToken = null
    await user.save()

    res.json({ message: 'Token de dispositivo eliminado exitosamente' })
  } catch (error) {
    console.error('Error eliminando token de dispositivo:', error)
    res.status(500).json({ error: 'Error al registrar/eliminar token' })
  }
})

// POST /api/notifications/send — Send push to all users (Admin only)
router.post('/send', async (req, res, next) => {
  try {
    const sender = await User.findByPk(req.user.id)
    if (!sender || sender.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden enviar notificaciones masivas.' })
    }

    const { title, body, data } = req.body
    if (!title || !body) {
      return res.status(400).json({ error: 'Título y cuerpo son requeridos.' })
    }

    const usersWithTokens = await User.findAll({
      where: { deviceToken: { [Op.ne]: null } },
      attributes: ['deviceToken']
    })
    
    const tokens = usersWithTokens.map(u => u.deviceToken).filter(Boolean)
    
    if (tokens.length === 0) {
      return res.json({ message: 'No hay dispositivos registrados.', sent: 0 })
    }

    const result = await sendMulticastNotification(tokens, { title, body, data })
    res.json({ message: 'Notificaciones enviadas.', sent: tokens.length, result })
  } catch (error) {
    next(error)
  }
})

export default router
