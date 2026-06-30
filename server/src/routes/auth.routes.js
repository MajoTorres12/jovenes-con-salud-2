import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

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
      attributes: ['id', 'name', 'email', 'role', 'birthDate', 'avatar', 'createdAt'],
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

export default router
