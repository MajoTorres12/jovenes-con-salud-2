import User from '../models/User.js'

export async function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' })
    }
    const dbUser = await User.findByPk(req.user.id)
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' })
    }
    next()
  } catch (error) {
    next(error)
  }
}

