import { Router } from 'express'
import { Op } from 'sequelize'
import { authenticate } from '../middleware/auth.middleware.js'
import User from '../models/User.js'
import Appointment from '../models/Appointment.js'
import Prescription from '../models/Prescription.js'
import DoctorSchedule from '../models/DoctorSchedule.js'
import { sendPushNotification } from '../services/pushNotification.service.js'

const router = Router()

// Helper middleware to enforce doctor role
async function requireDoctor(req, res, next) {
  try {
    if (!req.user) {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de médico.' })
    }
    const dbUser = await User.findByPk(req.user.id)
    if (!dbUser || dbUser.role !== 'doctor') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de médico.' })
    }
    next()
  } catch (error) {
    next(error)
  }
}

// ── PATIENT ENDPOINTS ────────────────────────────────────────────────────────

// 1. GET /api/appointments — List patient appointments
router.get('/', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.id
    const appointments = await Appointment.findAll({
      where: { patientId },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name', 'email', 'avatar', 'specialty', 'professionalLicense'],
        },
      ],
      order: [
        ['appointmentDate', 'DESC'],
        ['appointmentTime', 'DESC'],
      ],
    })
    res.json({ appointments })
  } catch (err) {
    next(err)
  }
})

// 2. GET /api/appointments/available-slots — Get available time slots for a doctor
router.get('/available-slots', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.id
    let { startDate, endDate, doctorId } = req.query

    // If doctorId is not specified, get patient's doctor
    if (!doctorId) {
      const patient = await User.findByPk(patientId)
      doctorId = patient.doctorId
    }

    if (!doctorId) {
      return res.status(400).json({ error: 'No tienes un médico asignado. Asigna uno primero.' })
    }

    const doctor = await User.findOne({
      where: { id: doctorId, role: 'doctor' },
      include: [{ model: DoctorSchedule, as: 'schedules', where: { isActive: true }, required: false }],
    })

    if (!doctor) {
      return res.status(404).json({ error: 'Médico no encontrado.' })
    }

    // Default range: next 14 days
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    const start = startDate ? new Date(startDate) : tomorrow
    const end = endDate ? new Date(endDate) : new Date(tomorrow.getTime() + 14 * 24 * 60 * 60 * 1000)

    // Limit range to max 30 days to avoid abuse
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 30) {
      return res.status(400).json({ error: 'El rango de consulta no puede exceder los 30 días.' })
    }

    // Fetch existing appointments in this range
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const appointments = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: {
          [Op.between]: [startStr, endStr],
        },
        status: {
          [Op.notIn]: ['cancelled', 'rejected'],
        },
      },
    })

    const duration = doctor.appointmentDuration || 30
    const maxDaily = doctor.maxDailyAppointments
    const result = {}

    // Loop through each day in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayOfWeek = d.getDay() // 0 = Sunday, 1 = Monday, etc.

      // Filter schedules for this specific day of the week
      const dailySchedules = (doctor.schedules || []).filter(s => s.dayOfWeek === dayOfWeek)

      if (dailySchedules.length === 0) {
        result[dateStr] = { available: false, reason: 'Sin horario de atención este día', slots: [] }
        continue
      }

      // Count appointments for this date
      const dateAppointments = appointments.filter(a => a.appointmentDate === dateStr)
      if (maxDaily !== null && dateAppointments.length >= maxDaily) {
        result[dateStr] = { available: false, reason: 'Límite diario de citas alcanzado', slots: [] }
        continue
      }

      const slots = []
      // Generate slots for each schedule block
      for (const sched of dailySchedules) {
        const [startH, startM] = sched.startTime.split(':').map(Number)
        const [endH, endM] = sched.endTime.split(':').map(Number)

        const blockStart = new Date(d)
        blockStart.setHours(startH, startM, 0, 0)

        const blockEnd = new Date(d)
        blockEnd.setHours(endH, endM, 0, 0)

        let currentSlot = new Date(blockStart)

        while (currentSlot.getTime() + duration * 60 * 1000 <= blockEnd.getTime()) {
          const slotH = String(currentSlot.getHours()).padStart(2, '0')
          const slotM = String(currentSlot.getMinutes()).padStart(2, '0')
          const slotTimeStr = `${slotH}:${slotM}`

          // 1. Must be >= 24 hours in the future
          const minAdvanceTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          if (currentSlot >= minAdvanceTime) {
            // 2. Must not be already booked
            const isBooked = dateAppointments.some(a => a.appointmentTime === slotTimeStr)
            if (!isBooked) {
              slots.push(slotTimeStr)
            }
          }

          currentSlot.setTime(currentSlot.getTime() + duration * 60 * 1000)
        }
      }

      result[dateStr] = {
        available: slots.length > 0,
        reason: slots.length > 0 ? null : 'No hay horarios disponibles',
        slots: slots.sort(),
      }
    }

    res.json({ availableSlots: result })
  } catch (err) {
    next(err)
  }
})

// 3. POST /api/appointments — Request virtual appointment
router.post('/', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.id
    const { appointmentDate, appointmentTime, reason, symptoms } = req.body

    if (!appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({ error: 'Fecha, hora y motivo son requeridos.' })
    }

    // Check if patient has doctor assigned
    const patient = await User.findByPk(patientId)
    const doctorId = patient.doctorId
    if (!doctorId) {
      return res.status(400).json({ error: 'No tienes un médico asignado para programar citas.' })
    }

    // Check if patient already has a pending appointment
    const pendingAppt = await Appointment.findOne({
      where: { patientId, status: 'pending' },
    })
    if (pendingAppt) {
      return res.status(400).json({ error: 'Ya tienes una solicitud de cita pendiente de confirmación.' })
    }

    const doctor = await User.findOne({
      where: { id: doctorId, role: 'doctor' },
      include: [{ model: DoctorSchedule, as: 'schedules', where: { isActive: true }, required: false }],
    })

    if (!doctor) {
      return res.status(404).json({ error: 'Médico asignado no encontrado.' })
    }

    // Validate 24 hours advance
    const now = new Date()
    const selectedDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`)
    const minAdvanceTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    if (selectedDateTime < minAdvanceTime) {
      return res.status(400).json({ error: 'Las citas deben agendarse con al menos 24 horas de anticipación.' })
    }

    // Check if date has schedule blocks
    const dayOfWeek = selectedDateTime.getDay()
    const dailySchedules = (doctor.schedules || []).filter(s => s.dayOfWeek === dayOfWeek)
    if (dailySchedules.length === 0) {
      return res.status(400).json({ error: 'El médico no atiende el día seleccionado.' })
    }

    // Check if slot falls in schedule blocks
    const [selH, selM] = appointmentTime.split(':').map(Number)
    const isValidBlock = dailySchedules.some(sched => {
      const [startH, startM] = sched.startTime.split(':').map(Number)
      const [endH, endM] = sched.endTime.split(':').map(Number)
      const startMin = startH * 60 + startM
      const endMin = endH * 60 + endM
      const selMin = selH * 60 + selM
      const duration = doctor.appointmentDuration || 30
      return selMin >= startMin && (selMin + duration) <= endMin
    })

    if (!isValidBlock) {
      return res.status(400).json({ error: 'La hora seleccionada está fuera del horario de atención del médico.' })
    }

    // Check if doctor reached daily limit
    const existingCount = await Appointment.count({
      where: {
        doctorId,
        appointmentDate,
        status: { [Op.notIn]: ['cancelled', 'rejected'] },
      },
    })

    if (doctor.maxDailyAppointments !== null && existingCount >= doctor.maxDailyAppointments) {
      return res.status(400).json({ error: 'El médico ha alcanzado el límite de citas para la fecha seleccionada.' })
    }

    // Check if slot is already booked
    const isBooked = await Appointment.findOne({
      where: {
        doctorId,
        appointmentDate,
        appointmentTime,
        status: { [Op.notIn]: ['cancelled', 'rejected'] },
      },
    })

    if (isBooked) {
      return res.status(400).json({ error: 'El horario seleccionado ya se encuentra reservado.' })
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      status: 'pending',
      reason,
      symptoms,
      duration: doctor.appointmentDuration || 30,
    })

    if (doctor?.deviceToken) {
      sendPushNotification(doctor.deviceToken, {
        title: '📅 Nueva Solicitud de Cita',
        body: `${patient.name} solicita una cita para el ${appointmentDate} a las ${appointmentTime}`,
        data: { type: 'appointment_request', appointmentId: appointment.id, url: '/doctor' }
      })
    }

    res.status(201).json({ message: 'Solicitud de cita enviada exitosamente.', appointment })
  } catch (err) {
    next(err)
  }
})

// 4. PUT /api/appointments/:id/cancel — Cancel appointment (Patient)
router.put('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const patientId = req.user.id
    const appointmentId = req.params.id

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, patientId },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' })
    }

    if (['completed', 'rejected', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ error: 'No se puede cancelar una cita que ya ha finalizado o ha sido cancelada.' })
    }

    appointment.status = 'cancelled'
    await appointment.save()

    res.json({ message: 'Cita cancelada exitosamente.', appointment })
  } catch (err) {
    next(err)
  }
})

// 5. GET /api/appointments/:id/prescription — Get prescription associated with appointment
router.get('/:id/prescription', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id
    const appointmentId = req.params.id

    const appointment = await Appointment.findByPk(appointmentId)
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' })
    }

    // Check permissions
    if (appointment.patientId !== userId && appointment.doctorId !== userId) {
      return res.status(403).json({ error: 'Acceso no autorizado a los datos de esta cita.' })
    }

    const prescription = await Prescription.findOne({
      where: { appointmentId },
    })

    if (!prescription) {
      return res.status(404).json({ error: 'No se ha emitido una receta para esta cita aún.' })
    }

    res.json({ prescription })
  } catch (err) {
    next(err)
  }
})

// ── DOCTOR ENDPOINTS ─────────────────────────────────────────────────────────

// 6. GET /api/appointments/doctor — List appointments for doctor
router.get('/doctor', authenticate, requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const appointments = await Appointment.findAll({
      where: { doctorId },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'name', 'email', 'avatar', 'birthDate'],
        },
      ],
      order: [
        ['appointmentDate', 'DESC'],
        ['appointmentTime', 'DESC'],
      ],
    })
    res.json({ appointments })
  } catch (err) {
    next(err)
  }
})

// 7. GET /api/appointments/doctor/stats — Summary stats for doctor
router.get('/doctor/stats', authenticate, requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const todayStr = new Date().toISOString().split('T')[0]

    const pending = await Appointment.count({ where: { doctorId, status: 'pending' } })
    const acceptedToday = await Appointment.count({
      where: { doctorId, status: 'accepted', appointmentDate: todayStr },
    })
    const completed = await Appointment.count({ where: { doctorId, status: 'completed' } })

    res.json({ pending, acceptedToday, completed })
  } catch (err) {
    next(err)
  }
})

// 8. PUT /api/appointments/:id/accept — Accept appointment request
router.put('/:id/accept', authenticate, requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const appointmentId = req.params.id
    const { meetLink, meetCode, notes } = req.body

    if (!meetLink || !meetCode) {
      return res.status(400).json({ error: 'El enlace y código de Google Meet son requeridos para confirmar.' })
    }

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, doctorId },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada o no asignada a usted.' })
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden confirmar citas en estado pendiente.' })
    }

    appointment.status = 'accepted'
    appointment.meetLink = meetLink
    appointment.meetCode = meetCode
    if (notes !== undefined) appointment.notes = notes
    await appointment.save()

    const patientUser = await User.findByPk(appointment.patientId)
    if (patientUser?.deviceToken) {
      sendPushNotification(patientUser.deviceToken, {
        title: '✅ Cita Confirmada',
        body: `Tu cita del ${appointment.appointmentDate} a las ${appointment.appointmentTime} ha sido confirmada`,
        data: { type: 'appointment_accepted', appointmentId: appointment.id, meetLink, url: '/dashboard' }
      })
    }

    res.json({ message: 'Cita confirmada y agendada correctamente.', appointment })
  } catch (err) {
    next(err)
  }
})

// 9. PUT /api/appointments/:id/reject — Reject appointment request
router.put('/:id/reject', authenticate, requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const appointmentId = req.params.id
    const { rejectionReason } = req.body

    if (!rejectionReason) {
      return res.status(400).json({ error: 'El motivo de rechazo es requerido.' })
    }

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, doctorId },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada o no asignada a usted.' })
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden rechazar citas en estado pendiente.' })
    }

    appointment.status = 'rejected'
    appointment.rejectionReason = rejectionReason
    await appointment.save()

    const patientUser = await User.findByPk(appointment.patientId)
    if (patientUser?.deviceToken) {
      sendPushNotification(patientUser.deviceToken, {
        title: '❌ Solicitud de Cita no Aceptada',
        body: `Tu solicitud de cita para el ${appointment.appointmentDate} no pudo ser aceptada. Motivo: ${rejectionReason}`,
        data: { type: 'appointment_rejected', appointmentId: appointment.id, url: '/dashboard' }
      })
    }

    res.json({ message: 'Solicitud de cita rechazada.', appointment })
  } catch (err) {
    next(err)
  }
})

// 10. PUT /api/appointments/:id/complete — Complete virtual appointment
router.put('/:id/complete', authenticate, requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const appointmentId = req.params.id

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, doctorId },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada o no asignada a usted.' })
    }

    if (appointment.status !== 'accepted') {
      return res.status(400).json({ error: 'Solo se pueden completar citas confirmadas (aceptadas).' })
    }

    appointment.status = 'completed'
    await appointment.save()

    res.json({ message: 'Cita marcada como completada.', appointment })
  } catch (err) {
    next(err)
  }
})

// 11. POST /api/appointments/:id/prescription — Emit medical prescription for completed/accepted appointment
router.post('/:id/prescription', authenticate, requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const appointmentId = req.params.id
    const { diagnosis, medications, generalInstructions, validUntil, doctorSignature } = req.body

    if (!diagnosis || !medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ error: 'Diagnóstico y al menos un medicamento son requeridos.' })
    }

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, doctorId },
    })

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada o no asignada a usted.' })
    }

    if (!['accepted', 'completed'].includes(appointment.status)) {
      return res.status(400).json({ error: 'Solo se pueden emitir recetas para citas confirmadas o completadas.' })
    }

    // Check if prescription already exists
    const existingPrescription = await Prescription.findOne({ where: { appointmentId } })
    if (existingPrescription) {
      return res.status(409).json({ error: 'Ya existe una receta médica emitida para esta cita.' })
    }

    // Fetch doctor information to populate prescription headers
    const doctor = await User.findByPk(doctorId)

    // Generate prescription folio: RX-YYYYMMDD-[Count Today + 1]
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0].replace(/-/g, '')
    
    // Count prescriptions today to increment suffix
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    
    const countToday = await Prescription.count({
      where: {
        doctorId,
        createdAt: {
          [Op.gte]: startOfToday,
        },
      },
    })
    const folio = `RX-${todayStr}-${String(countToday + 1).padStart(3, '0')}`

    // Calculate validUntil: default to 30 days from now
    const defaultValidUntil = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Determine signature to use: custom uploaded in this prescription or persistent profile signature
    const finalSignature = doctorSignature || doctor.signature || null

    // Create prescription
    const prescription = await Prescription.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId,
      folio,
      diagnosis,
      medications,
      generalInstructions,
      doctorName: doctor.name,
      doctorLicense: doctor.professionalLicense || 'C.P. PENDIENTE',
      doctorSpecialty: doctor.specialty || 'Médico General',
      doctorSignature: finalSignature,
      validUntil: validUntil || defaultValidUntil,
    })

    // Notify patient about the new prescription
    try {
      const patientUser = await User.findByPk(appointment.patientId)
      if (patientUser?.deviceToken) {
        sendPushNotification(patientUser.deviceToken, {
          title: '📋 Nueva Receta Médica Emitida',
          body: `El Dr. ${doctor.name} ha emitido la receta médica con folio ${folio}`,
          data: { type: 'new_prescription', prescriptionId: prescription.id, url: '/dashboard' }
        })
      }
    } catch (fcmErr) {
      console.error('Error sending prescription push notification:', fcmErr)
    }

    // If appointment is accepted, auto-complete it
    if (appointment.status === 'accepted') {
      appointment.status = 'completed'
      await appointment.save()
    }

    res.status(201).json({ message: 'Receta médica emitida exitosamente.', prescription })
  } catch (err) {
    next(err)
  }
})

// 12. GET /api/appointments/doctor/schedule — Get doctor's schedules
router.get('/doctor/schedule', authenticate, requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const schedules = await DoctorSchedule.findAll({
      where: { doctorId },
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC'],
      ],
    })
    res.json({ schedules })
  } catch (err) {
    next(err)
  }
})

// 13. PUT /api/appointments/doctor/schedule — Set doctor's schedules
router.put('/doctor/schedule', authenticate, requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const { schedules } = req.body // Array of { dayOfWeek, startTime, endTime, isActive }

    if (!Array.isArray(schedules)) {
      return res.status(400).json({ error: 'Un arreglo de horarios es requerido.' })
    }

    // Validate formatting
    for (const s of schedules) {
      if (s.dayOfWeek < 0 || s.dayOfWeek > 6) {
        return res.status(400).json({ error: 'El día de la semana debe estar entre 0 (Domingo) y 6 (Sábado).' })
      }
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
      if (!timeRegex.test(s.startTime) || !timeRegex.test(s.endTime)) {
        return res.status(400).json({ error: 'La hora de inicio y fin deben tener formato HH:mm.' })
      }
      if (s.startTime >= s.endTime) {
        return res.status(400).json({ error: 'La hora de inicio debe ser menor que la hora de fin.' })
      }
    }

    // Delete existing schedules for this doctor
    await DoctorSchedule.destroy({ where: { doctorId } })

    // Create new schedules
    const newSchedules = schedules.map(s => ({
      doctorId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isActive: s.isActive !== undefined ? s.isActive : true,
    }))

    const created = await DoctorSchedule.bulkCreate(newSchedules)

    res.json({ message: 'Horario de atención actualizado correctamente.', schedules: created })
  } catch (err) {
    next(err)
  }
})

// 14. PUT /api/appointments/doctor/config — Set doctor's agenda configuration
router.put('/doctor/config', authenticate, requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const { appointmentDuration, maxDailyAppointments, professionalLicense, specialty, signature } = req.body

    const doctor = await User.findByPk(doctorId)

    if (appointmentDuration !== undefined) {
      if (![15, 20, 30, 45, 60].includes(Number(appointmentDuration))) {
        return res.status(400).json({ error: 'La duración de cita debe ser uno de: 15, 20, 30, 45 o 60 minutos.' })
      }
      doctor.appointmentDuration = Number(appointmentDuration)
    }

    if (maxDailyAppointments !== undefined) {
      doctor.maxDailyAppointments = maxDailyAppointments === null ? null : Number(maxDailyAppointments)
    }

    if (professionalLicense !== undefined) {
      doctor.professionalLicense = professionalLicense
    }

    if (specialty !== undefined) {
      doctor.specialty = specialty
    }

    if (signature !== undefined) {
      doctor.signature = signature
    }

    await doctor.save()

    res.json({
      message: 'Configuración de agenda actualizada correctamente.',
      config: {
        appointmentDuration: doctor.appointmentDuration,
        maxDailyAppointments: doctor.maxDailyAppointments,
        professionalLicense: doctor.professionalLicense,
        specialty: doctor.specialty,
        signature: doctor.signature
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
