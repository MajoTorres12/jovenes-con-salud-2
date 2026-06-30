import { Router } from 'express'
import { Op } from 'sequelize'
import { authenticate } from '../middleware/auth.middleware.js'
import ChatMessage from '../models/ChatMessage.js'
import User from '../models/User.js'

const router = Router()

// Require authentication for all chat routes
router.use(authenticate)

// 1. GET /api/chat/messages — fetch message history
router.get('/messages', async (req, res, next) => {
  try {
    const currentUserId = req.user.id
    const targetUserId = req.query.userId

    if (!targetUserId) {
      return res.status(400).json({ error: 'ID de destinatario es requerido' })
    }

    // Find messages
    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
        ]
      },
      order: [['createdAt', 'ASC']]
    })

    // Mark messages sent by target user as read
    await ChatMessage.update(
      { isRead: true },
      {
        where: {
          senderId: targetUserId,
          receiverId: currentUserId,
          isRead: false
        }
      }
    )

    res.json({ messages })
  } catch (err) {
    next(err)
  }
})

// 2. POST /api/chat/messages — send a message
router.post('/messages', async (req, res, next) => {
  try {
    const currentUserId = req.user.id
    const { receiverId, message } = req.body

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' })
    }

    let finalReceiverId = receiverId

    // Get sender data to check role and doctor assignment
    const sender = await User.findByPk(currentUserId)
    if (!sender) {
      return res.status(404).json({ error: 'Remitente no encontrado.' })
    }

    if (sender.role === 'user') {
      // Patients can only send to their assigned doctor
      if (!sender.doctorId) {
        return res.status(400).json({ error: 'No tienes un médico asignado todavía.' })
      }
      finalReceiverId = sender.doctorId
    } else if (sender.role === 'doctor') {
      // Doctors must specify the patient and they must be assigned to them
      if (!receiverId) {
        return res.status(400).json({ error: 'Paciente destinatario es requerido.' })
      }
      const patient = await User.findOne({
        where: { id: receiverId, doctorId: currentUserId }
      })
      if (!patient) {
        return res.status(400).json({ error: 'El paciente destinatario no está asignado a usted.' })
      }
    } else if (sender.role === 'admin') {
      // Admins sending messages
      if (!receiverId) {
        return res.status(400).json({ error: 'Destinatario es requerido.' })
      }
    }

    const chatMsg = await ChatMessage.create({
      senderId: currentUserId,
      receiverId: finalReceiverId,
      message: message.trim()
    })

    res.status(201).json({ message: 'Mensaje enviado', chatMessage: chatMsg })
  } catch (err) {
    next(err)
  }
})

// 3. GET /api/chat/contact — get contact details (doctor details for patient)
router.get('/contact', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: User, as: 'doctor', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    })
    
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' })

    res.json({ doctor: user.doctor })
  } catch (err) {
    next(err)
  }
})

export default router
