import { Router } from 'express'
import { Op } from 'sequelize'
import { authenticate } from '../middleware/auth.middleware.js'
import User from '../models/User.js'
import FamilyMember from '../models/FamilyMember.js'
import HealthRecord from '../models/HealthRecord.js'
import MedicalAlert from '../models/MedicalAlert.js'
import { checkHealthLimits } from '../utils/healthLimits.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Helper to check user permission
async function verifyAccess(req, userId, familyMemberId) {
  const requesterId = req.user.id
  const requesterRole = req.user.role

  if (requesterRole === 'admin') return true

  if (requesterRole === 'doctor') {
    // Check if user is assigned to this doctor
    const isAssigned = await User.findOne({ where: { id: userId, doctorId: requesterId } })
    return !!isAssigned
  }

  // Regular user can only query their own ID
  if (userId !== requesterId) return false

  // If querying a family member, verify they belong to this user
  if (familyMemberId) {
    const belongs = await FamilyMember.findOne({ where: { id: familyMemberId, userId: requesterId } })
    return !!belongs
  }

  return true
}

// 1. GET /api/analytics/summary
router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.query.userId || req.user.id
    const familyMemberId = req.query.familyMemberId || null
    const compliance = parseFloat(req.query.compliance) || 100

    const hasAccess = await verifyAccess(req, userId, familyMemberId)
    if (!hasAccess) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para ver estos datos.' })
    }

    const where = { userId }
    if (familyMemberId) {
      where.familyMemberId = familyMemberId
    } else {
      where.familyMemberId = null
    }

    // A. Vital Signs Score
    const types = ['weight', 'glucose', 'bloodPressure', 'heartRate', 'cholesterol', 'triglycerides']
    const latest = {}
    let vitalSignsScore = 100

    for (const type of types) {
      const record = await HealthRecord.findOne({
        where: { ...where, type },
        order: [['recordedAt', 'DESC']],
      })
      
      if (record) {
        latest[type] = record
        // Classify health reading
        const limitCheck = checkHealthLimits(type, record.value, record.value2)
        if (limitCheck && limitCheck.isAbnormal) {
          record.setDataValue('classification', limitCheck)
          if (limitCheck.severity === 'critical') {
            vitalSignsScore -= 12
          } else if (limitCheck.severity === 'warning') {
            vitalSignsScore -= 6
          }
        } else {
          record.setDataValue('classification', { isAbnormal: false, message: 'Normal' })
        }
      } else {
        latest[type] = null
      }
    }
    vitalSignsScore = Math.max(0, vitalSignsScore)

    // B. Alerts Score (Ausencia de alertas en los últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const alertsWhere = { userId, recordedAt: { [Op.gte]: thirtyDaysAgo } }
    // If it's a family member, we must check alerts triggered by their health records
    if (familyMemberId) {
      const recordsOfMember = await HealthRecord.findAll({ where: { userId, familyMemberId }, attributes: ['id'] })
      const recordIds = recordsOfMember.map(r => r.id)
      alertsWhere.healthRecordId = { [Op.in]: recordIds }
    } else {
      // Titular alerts
      const recordsOfTitular = await HealthRecord.findAll({ where: { userId, familyMemberId: null }, attributes: ['id'] })
      const recordIds = recordsOfTitular.map(r => r.id)
      alertsWhere.healthRecordId = { [Op.in]: recordIds }
    }

    const recentAlerts = await MedicalAlert.findAll({ where: alertsWhere })
    let alertsScore = 100
    recentAlerts.forEach(alert => {
      if (alert.status === 'pending') {
        if (alert.severity === 'critical') {
          alertsScore -= 15
        } else {
          alertsScore -= 8
        }
      }
    })
    alertsScore = Math.max(0, alertsScore)

    // C. Integrated Health Score
    const finalScore = Math.round((vitalSignsScore * 0.5) + (compliance * 0.3) + (alertsScore * 0.2))

    res.json({
      score: finalScore,
      breakdown: {
        vitalSigns: vitalSignsScore,
        compliance,
        alerts: alertsScore,
      },
      latest,
    })
  } catch (err) {
    next(err)
  }
})

// 2. GET /api/analytics/predictions
router.get('/predictions', async (req, res, next) => {
  try {
    const userId = req.query.userId || req.user.id
    const familyMemberId = req.query.familyMemberId || null

    const hasAccess = await verifyAccess(req, userId, familyMemberId)
    if (!hasAccess) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para ver estos datos.' })
    }

    const where = { userId }
    if (familyMemberId) {
      where.familyMemberId = familyMemberId
    } else {
      where.familyMemberId = null
    }

    const predictions = {}
    const predictionTypes = ['weight', 'glucose', 'bloodPressure', 'heartRate', 'cholesterol', 'triglycerides']
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)

    for (const type of predictionTypes) {
      const records = await HealthRecord.findAll({
        where: {
          ...where,
          type,
          recordedAt: { [Op.gte]: sixMonthsAgo }
        },
        order: [['recordedAt', 'ASC']],
      })

      if (records.length >= 3) {
        // Calculate linear regression Y = mX + c
        const n = records.length
        let sumX = 0
        let sumY = 0
        let sumXY = 0
        let sumXX = 0

        const t0 = new Date(records[0].recordedAt).getTime()

        const points = records.map(r => {
          const x = (new Date(r.recordedAt).getTime() - t0) / (24 * 60 * 60 * 1000) // days from t0
          const y = r.value
          sumX += x
          sumY += y
          sumXY += x * y
          sumXX += x * x
          return { date: r.recordedAt, days: x, value: y }
        })

        const denominator = (n * sumXX) - (sumX * sumX)
        if (denominator !== 0) {
          const m = ((n * sumXY) - (sumX * sumY)) / denominator // slope (change per day)
          const c = (sumY - (m * sumX)) / n                     // intercept

          const lastPoint = points[points.length - 1]
          const xProjected = lastPoint.days + 30
          const yProjected = (m * xProjected) + c

          predictions[type] = {
            status: 'success',
            slope: m,
            slopePerMonth: m * 30,
            currentValue: lastPoint.value,
            projectedValue30Days: parseFloat(yProjected.toFixed(2)),
            points,
          }
        } else {
          predictions[type] = { status: 'error', error: 'Matemática degenerada (todos los puntos en el mismo instante)' }
        }
      } else {
        predictions[type] = { status: 'insufficient_data', message: 'Se requieren al menos 3 registros en los últimos 6 meses para proyectar tendencias.' }
      }
    }

    // B. Framingham 10-Year Cardiovascular Risk Score
    // Get user details
    let birthDate = null
    let gender = 'female' // default

    if (familyMemberId) {
      const member = await FamilyMember.findByPk(familyMemberId)
      if (member) {
        birthDate = member.birthDate
        gender = member.gender === 'masculino' ? 'male' : 'female'
      }
    } else {
      const user = await User.findByPk(userId)
      if (user) {
        birthDate = user.birthDate
        // Default check gender in notes or use standard default
        gender = 'female' // default user is female (maria)
      }
    }

    const age = birthDate ? Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000)) : 30

    // Fetch latest total cholesterol and blood pressure
    const latestSysBP = await HealthRecord.findOne({
      where: { ...where, type: 'bloodPressure' },
      order: [['recordedAt', 'DESC']]
    })
    const latestChol = await HealthRecord.findOne({
      where: { ...where, type: 'cholesterol' },
      order: [['recordedAt', 'DESC']]
    })

    const sysBP = latestSysBP ? latestSysBP.value : 120 // standard normal default
    const totalChol = latestChol ? latestChol.value : 190 // standard normal default

    // Calculate points
    let points = 0

    // 1. Age Points
    if (gender === 'male') {
      if (age >= 20 && age <= 34) points += -9
      else if (age >= 35 && age <= 39) points += -4
      else if (age >= 40 && age <= 44) points += 0
      else if (age >= 45 && age <= 49) points += 3
      else if (age >= 50 && age <= 54) points += 6
      else if (age >= 55 && age <= 59) points += 8
      else if (age >= 60 && age <= 64) points += 10
      else if (age >= 65 && age <= 69) points += 11
      else if (age >= 70 && age <= 74) points += 12
      else if (age >= 75 && age <= 79) points += 13
    } else {
      if (age >= 20 && age <= 34) points += -7
      else if (age >= 35 && age <= 39) points += -3
      else if (age >= 40 && age <= 44) points += 0
      else if (age >= 45 && age <= 49) points += 3
      else if (age >= 50 && age <= 54) points += 6
      else if (age >= 55 && age <= 59) points += 8
      else if (age >= 60 && age <= 64) points += 10
      else if (age >= 65 && age <= 69) points += 12
      else if (age >= 70 && age <= 74) points += 14
      else if (age >= 75 && age <= 79) points += 16
    }

    // 2. Total Cholesterol Points
    if (gender === 'male') {
      if (age >= 20 && age <= 39) {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 4
        else if (totalChol < 240) points += 7
        else if (totalChol < 280) points += 9
        else points += 11
      } else if (age >= 40 && age <= 49) {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 3
        else if (totalChol < 240) points += 5
        else if (totalChol < 280) points += 6
        else points += 8
      } else if (age >= 50 && age <= 59) {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 2
        else if (totalChol < 240) points += 3
        else if (totalChol < 280) points += 4
        else points += 5
      } else if (age >= 60 && age <= 69) {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 1
        else if (totalChol < 240) points += 1
        else if (totalChol < 280) points += 2
        else points += 3
      } else {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 0
        else if (totalChol < 240) points += 0
        else if (totalChol < 280) points += 1
        else points += 1
      }
    } else {
      if (age >= 20 && age <= 39) {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 4
        else if (totalChol < 240) points += 8
        else if (totalChol < 280) points += 11
        else points += 13
      } else if (age >= 40 && age <= 49) {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 3
        else if (totalChol < 240) points += 6
        else if (totalChol < 280) points += 8
        else points += 10
      } else if (age >= 50 && age <= 59) {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 2
        else if (totalChol < 240) points += 4
        else if (totalChol < 280) points += 5
        else points += 7
      } else if (age >= 60 && age <= 69) {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 1
        else if (totalChol < 240) points += 2
        else if (totalChol < 280) points += 3
        else points += 4
      } else {
        if (totalChol < 160) points += 0
        else if (totalChol < 200) points += 1
        else if (totalChol < 240) points += 1
        else if (totalChol < 280) points += 2
        else points += 2
      }
    }

    // 3. Systolic BP Points
    if (sysBP < 120) points += 0
    else if (sysBP < 130) points += 1
    else if (sysBP < 140) points += 2
    else if (sysBP < 160) points += 3
    else points += 4

    // 4. Calculate Risk Percentage
    let riskPercent = 1
    if (gender === 'male') {
      if (points < 0) riskPercent = 0.5
      else if (points === 0) riskPercent = 1
      else if (points === 1) riskPercent = 1
      else if (points === 2) riskPercent = 1
      else if (points === 3) riskPercent = 1
      else if (points === 4) riskPercent = 1
      else if (points === 5) riskPercent = 2
      else if (points === 6) riskPercent = 2
      else if (points === 7) riskPercent = 3
      else if (points === 8) riskPercent = 4
      else if (points === 9) riskPercent = 5
      else if (points === 10) riskPercent = 6
      else if (points === 11) riskPercent = 8
      else if (points === 12) riskPercent = 10
      else if (points === 13) riskPercent = 12
      else if (points === 14) riskPercent = 16
      else if (points === 15) riskPercent = 20
      else if (points === 16) riskPercent = 25
      else riskPercent = 30
    } else {
      if (points < 9) riskPercent = 0.5
      else if (points === 9) riskPercent = 1
      else if (points === 10) riskPercent = 1
      else if (points === 11) riskPercent = 1
      else if (points === 12) riskPercent = 1
      else if (points === 13) riskPercent = 2
      else if (points === 14) riskPercent = 2
      else if (points === 15) riskPercent = 3
      else if (points === 16) riskPercent = 4
      else if (points === 17) riskPercent = 5
      else if (points === 18) riskPercent = 6
      else if (points === 19) riskPercent = 8
      else if (points === 20) riskPercent = 11
      else if (points === 21) riskPercent = 14
      else if (points === 22) riskPercent = 17
      else if (points === 23) riskPercent = 22
      else if (points === 24) riskPercent = 27
      else riskPercent = 30
    }

    // Determine category and advice
    let riskCategory = 'Bajo'
    let riskAdvice = 'Mantén tu estilo de vida activo y alimentación balanceada. Sigue monitoreando tus signos vitales periódicamente.'
    if (riskPercent >= 20) {
      riskCategory = 'Alto'
      riskAdvice = 'Riesgo elevado. Se recomienda encarecidamente consultar a tu médico para discutir medidas preventivas y ajustes en tu tratamiento. Considera suplementación para el sistema cardiovascular.'
    } else if (riskPercent >= 10) {
      riskCategory = 'Moderado'
      riskAdvice = 'Riesgo moderado. Presta especial atención a tu presión arterial y colesterol. Incrementa la actividad física regular y reduce grasas saturadas.'
    }

    // C. Preventive Recommendations (based on alerts or predictions)
    const recommendations = []
    if (predictions.glucose && predictions.glucose.projectedValue30Days >= 100) {
      recommendations.push({
        title: 'Monitoreo preventivo de Glucosa',
        text: 'Tu tendencia de glucosa muestra un incremento proyectado. Se aconseja reducir el consumo de azúcares refinados y harinas blancas, y preferir nutracéuticos de fibra o picolinato de cromo.',
        type: 'warning'
      })
    }
    if (latestSysBP && latestSysBP.value >= 130) {
      recommendations.push({
        title: 'Reducción de Sodio en Dieta',
        text: 'Tu presión arterial se encuentra en rango elevado. Te sugerimos seguir una dieta baja en sal (estilo DASH) e incorporar ajo negro u omega-3 como soporte natural.',
        type: 'warning'
      })
    }
    if (latestChol && latestChol.value >= 200) {
      recommendations.push({
        title: 'Control de Lípidos y Colesterol',
        text: 'Los niveles de colesterol están al límite. Se sugiere evitar alimentos fritos e incorporar fitoesteroles o levadura de arroz rojo para balancear los lípidos.',
        type: 'warning'
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: '¡Estilo de Vida Saludable!',
        text: 'Tus métricas de salud actuales no proyectan riesgos inmediatos. Sigue consumiendo antioxidantes naturales y realizando ejercicio aeróbico mínimo 150 minutos a la semana.',
        type: 'success'
      })
    }

    res.json({
      predictions,
      cardiovascularRisk: {
        scorePoints: points,
        percent: riskPercent,
        category: riskCategory,
        advice: riskAdvice,
        inputs: { age, gender, sysBP, totalChol }
      },
      recommendations
    })
  } catch (err) {
    next(err)
  }
})

// 3. GET /api/analytics/trends
router.get('/trends', async (req, res, next) => {
  try {
    const userId = req.query.userId || req.user.id
    const familyMemberId = req.query.familyMemberId || null
    const type = req.query.type || 'weight' // default metric

    const hasAccess = await verifyAccess(req, userId, familyMemberId)
    if (!hasAccess) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para ver estos datos.' })
    }

    const where = { userId, type }
    if (familyMemberId) {
      where.familyMemberId = familyMemberId
    } else {
      where.familyMemberId = null
    }

    // Fetch records in the last 12 months
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    where.recordedAt = { [Op.gte]: twelveMonthsAgo }

    const records = await HealthRecord.findAll({
      where,
      order: [['recordedAt', 'ASC']]
    })

    // Aggregate by month
    const monthlyData = {}
    records.forEach(r => {
      const date = new Date(r.recordedAt)
      const monthKey = date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' }) // e.g. "2026 jun."
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { sum: 0, count: 0, sum2: 0 }
      }
      monthlyData[monthKey].sum += r.value
      if (r.value2 != null) monthlyData[monthKey].sum2 += r.value2
      monthlyData[monthKey].count += 1
    })

    const chartData = Object.keys(monthlyData).map(month => {
      const avg = monthlyData[month].sum / monthlyData[month].count
      const avg2 = monthlyData[month].sum2 ? (monthlyData[month].sum2 / monthlyData[month].count) : null
      return {
        label: month,
        value: parseFloat(avg.toFixed(1)),
        value2: avg2 ? parseFloat(avg2.toFixed(1)) : undefined
      }
    })

    res.json({ trends: chartData })
  } catch (err) {
    next(err)
  }
})

export default router
