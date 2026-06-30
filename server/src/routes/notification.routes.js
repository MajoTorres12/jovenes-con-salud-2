import { Router } from 'express'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.middleware.js'

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
    res.status(500).json({ error: 'Error al eliminar token de dispositivo' })
  }
})

export default router
