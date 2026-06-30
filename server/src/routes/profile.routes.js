import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// PUT /api/profile — update name and birth date
router.put('/', async (req, res) => {
  try {
    const { name, birthDate } = req.body
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (name) user.name = name
    if (birthDate) user.birthDate = birthDate

    await user.save()

    res.json({
      message: 'Perfil actualizado',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        birthDate: user.birthDate,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    res.status(500).json({ error: 'Error al actualizar perfil' })
  }
})

// PUT /api/profile/password — change password
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Se requiere contraseña actual y nueva' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' })
    }

    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
    }

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()

    res.json({ message: 'Contraseña actualizada exitosamente' })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    res.status(500).json({ error: 'Error al cambiar contraseña' })
  }
})

export default router
