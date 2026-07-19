import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { Op } from 'sequelize'
import User from '../models/User.js'
import { sendPasswordResetEmail } from '../utils/mailer.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Helper: generate token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, birthDate } = req.body

    // Validate required fields
    if (!name || !email || !password || !birthDate) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    // Validate password strength: minimum 8 characters, at least 1 uppercase letter, 1 number
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, incluir al menos una letra mayúscula y al menos un número.' })
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este correo electrónico' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      birthDate,
    })

    // Generate token
    const token = generateToken(user)

    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorId: user.doctorId,
        themeColor: user.themeColor,
      },
    })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ error: 'Error al crear la cuenta' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' })
    }

    // Find user
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Tu cuenta ha sido desactivada' })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Generate token
    const token = generateToken(user)

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorId: user.doctorId,
        themeColor: user.themeColor,
      },
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'birthDate', 'avatar', 'createdAt', 'doctorId', 'themeColor'],
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json({ user })
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' })
    }
    res.status(500).json({ error: 'Error al obtener perfil' })
  }
})

// POST /api/auth/forgot-password — Request password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es requerido.' })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      // Secure design: avoid indicating whether user exists to prevent email enumeration
      return res.json({ message: 'Si el correo electrónico está registrado, recibirás un enlace de recuperación.' })
    }

    // Generate token (expires in 1 hour)
    const token = crypto.randomBytes(20).toString('hex')
    user.resetPasswordToken = token
    user.resetPasswordExpires = new Date(Date.now() + 3600000)
    await user.save()

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetLink = `${frontendUrl}/reset-password?token=${token}`

    try {
      await sendPasswordResetEmail(user.email, user.name, resetLink)
    } catch (mailErr) {
      console.error('Error sending email:', mailErr)
    }

    res.json({ message: 'Si el correo electrónico está registrado, recibirás un enlace de recuperación.' })
  } catch (error) {
    console.error('Error in forgot-password:', error)
    res.status(500).json({ error: 'Error al procesar la solicitud.' })
  }
})

// POST /api/auth/reset-password — Reset password using token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' })
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres, incluir al menos una letra mayúscula y al menos un número.' })
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      }
    })

    if (!user) {
      return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado.' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    user.password = hashedPassword
    user.resetPasswordToken = null
    user.resetPasswordExpires = null
    await user.save()

    res.json({ message: 'Contraseña restablecida exitosamente.' })
  } catch (error) {
    console.error('Error in reset-password:', error)
    res.status(500).json({ error: 'Error al restablecer la contraseña.' })
  }
})

export default router
