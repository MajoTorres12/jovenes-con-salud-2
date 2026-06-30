import assert from 'assert'

// 1. Re-implementation of linear regression calculation from analytics.routes.js
function calculateLinearRegression(records) {
  if (records.length < 3) {
    return { status: 'insufficient_data', message: 'Se requieren al menos 3 registros' }
  }

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
    return { days: x, value: y }
  })

  const denominator = (n * sumXX) - (sumX * sumX)
  if (denominator === 0) {
    return { status: 'error', error: 'Matemática degenerada' }
  }

  const m = ((n * sumXY) - (sumX * sumY)) / denominator // slope
  const c = (sumY - (m * sumX)) / n                     // intercept

  const lastPoint = points[points.length - 1]
  const xProjected = lastPoint.days + 30
  const yProjected = (m * xProjected) + c

  return {
    status: 'success',
    slope: m,
    slopePerMonth: m * 30,
    currentValue: lastPoint.value,
    projectedValue30Days: parseFloat(yProjected.toFixed(2))
  }
}

// 2. Re-implementation of Framingham scoring from analytics.routes.js
function calculateFramingham(age, gender, sysBP, totalChol) {
  let points = 0

  // Age Points
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

  // Cholesterol Points
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

  // Systolic BP Points
  if (sysBP < 120) points += 0
  else if (sysBP < 130) points += 1
  else if (sysBP < 140) points += 2
  else if (sysBP < 160) points += 3
  else points += 4

  // Risk Percent
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

  return { points, riskPercent }
}

// ==========================================
// RUNNING UNIT TESTS
// ==========================================
console.log('⚡ Iniciando pruebas unitarias de cálculos de analíticas...\n')

// Test Case 1: Linear Regression (Perfect increasing line)
const now = new Date()
const dayMillis = 24 * 60 * 60 * 1000
const records1 = [
  { recordedAt: new Date(now.getTime() - 10 * dayMillis).toISOString(), value: 100 },
  { recordedAt: new Date(now.getTime() - 5 * dayMillis).toISOString(), value: 105 },
  { recordedAt: new Date(now.getTime()).toISOString(), value: 110 }
]
const result1 = calculateLinearRegression(records1)
assert.strictEqual(result1.status, 'success')
assert.strictEqual(result1.slope, 1) // 10 mg/dL over 10 days = 1 mg/dL per day
assert.strictEqual(result1.slopePerMonth, 30)
assert.strictEqual(result1.projectedValue30Days, 140) // 110 + 30 * 1
console.log('✅ Prueba 1 superada: Regresión lineal con tendencia alcista perfecta.')

// Test Case 2: Linear Regression (Decreasing line)
const records2 = [
  { recordedAt: new Date(now.getTime() - 20 * dayMillis).toISOString(), value: 90 },
  { recordedAt: new Date(now.getTime() - 10 * dayMillis).toISOString(), value: 85 },
  { recordedAt: new Date(now.getTime()).toISOString(), value: 80 }
]
const result2 = calculateLinearRegression(records2)
assert.strictEqual(result2.status, 'success')
assert.strictEqual(result2.slope, -0.5) // -10 over 20 days = -0.5 per day
assert.strictEqual(result2.slopePerMonth, -15)
assert.strictEqual(result2.projectedValue30Days, 65) // 80 + 30 * -0.5
console.log('✅ Prueba 2 superada: Regresión lineal con tendencia bajista.')

// Test Case 3: Linear Regression (Insufficient Data)
const records3 = [
  { recordedAt: new Date(now.getTime() - 5 * dayMillis).toISOString(), value: 100 },
  { recordedAt: new Date(now.getTime()).toISOString(), value: 102 }
]
const result3 = calculateLinearRegression(records3)
assert.strictEqual(result3.status, 'insufficient_data')
console.log('✅ Prueba 3 superada: Identificación correcta de registros insuficientes.')

// Test Case 4: Framingham (Young healthy female)
// Age: 30, Gender: female, SysBP: 115, Cholesterol: 150
// Age points: -7
// Chol points: 0 (chol < 160)
// SysBP points: 0 (sysBP < 120)
// Total points: -7. Risk percentage: points < 9 -> 0.5%
const risk1 = calculateFramingham(30, 'female', 115, 150)
assert.strictEqual(risk1.points, -7)
assert.strictEqual(risk1.riskPercent, 0.5)
console.log('✅ Prueba 4 superada: Framingham para mujer joven y saludable (Riesgo Bajo, 0.5%).')

// Test Case 5: Older male with high indicators
// Age: 55, Gender: male, SysBP: 155, Cholesterol: 250
// Age points: 8
// Chol points: 4 (age 50-59, chol 240-279)
// SysBP points: 3 (sysBP 140-159)
// Total points: 8 + 4 + 3 = 15
// Risk percentage: points === 15 -> 20%
const risk2 = calculateFramingham(55, 'male', 155, 250)
assert.strictEqual(risk2.points, 15)
assert.strictEqual(risk2.riskPercent, 20)
console.log('✅ Prueba 5 superada: Framingham para hombre de 55 años con indicadores elevados (Riesgo Alto, 20%).')

console.log('\n🎉 ¡TODAS LAS PRUEBAS MATEMÁTICAS SE COMPLETARON CON ÉXITO!')
