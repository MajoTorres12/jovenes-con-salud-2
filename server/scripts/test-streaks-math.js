// Unit test script for health record tracking streaks logic
import { calculateStreaks } from '../src/utils/streakUtils.js'
import assert from 'assert'

console.log('⚡ Iniciando pruebas unitarias de cálculo de rachas de salud...\n')

// Helper to get formatted dates
const getPastDate = (daysAgo) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d
}

const getPastMonthDate = (monthsAgo) => {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  return d
}

const getPastYearDate = (yearsAgo) => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - yearsAgo)
  return d
}

// -------------------------------------------------------------
// Test Case 1: Perfect consecutive daily streak (today, yesterday, 2 days ago)
// -------------------------------------------------------------
try {
  const records = [
    { recordedAt: getPastDate(0) }, // today
    { recordedAt: getPastDate(1) }, // yesterday
    { recordedAt: getPastDate(2) }  // 2 days ago
  ]
  const streaks = calculateStreaks(records)
  assert.strictEqual(streaks.daily.current, 3, 'Racha diaria actual debería ser 3')
  assert.strictEqual(streaks.daily.max, 3, 'Racha diaria máxima debería ser 3')
  console.log('✅ Prueba 1 superada: Racha diaria perfecta de 3 días consecutivos.')
} catch (e) {
  console.error('❌ Prueba 1 falló:', e.message)
  process.exit(1)
}

// -------------------------------------------------------------
// Test Case 2: Yesterday only (today not yet recorded) -> streak is still active
// -------------------------------------------------------------
try {
  const records = [
    { recordedAt: getPastDate(1) }, // yesterday
    { recordedAt: getPastDate(2) }  // 2 days ago
  ]
  const streaks = calculateStreaks(records)
  assert.strictEqual(streaks.daily.current, 2, 'Racha diaria actual debería ser 2')
  assert.strictEqual(streaks.daily.max, 2, 'Racha diaria máxima de 2')
  console.log('✅ Prueba 2 superada: Racha diaria activa finalizando ayer.')
} catch (e) {
  console.error('❌ Prueba 2 falló:', e.message)
  process.exit(1)
}

// -------------------------------------------------------------
// Test Case 3: Gap yesterday (today and 2 days ago) -> streak reset today to 1
// -------------------------------------------------------------
try {
  const records = [
    { recordedAt: getPastDate(0) }, // today
    { recordedAt: getPastDate(2) }  // 2 days ago (gap at yesterday)
  ]
  const streaks = calculateStreaks(records)
  assert.strictEqual(streaks.daily.current, 1, 'Racha diaria actual debería ser 1 debido al salto de ayer')
  assert.strictEqual(streaks.daily.max, 1, 'Racha diaria máxima de 1')
  console.log('✅ Prueba 3 superada: Racha diaria reiniciada por salto intermedio (ayer).')
} catch (e) {
  console.error('❌ Prueba 3 falló:', e.message)
  process.exit(1)
}

// -------------------------------------------------------------
// Test Case 4: No records yesterday and today -> streak is inactive (current = 0, max = historical max)
// -------------------------------------------------------------
try {
  const records = [
    { recordedAt: getPastDate(2) }, // 2 days ago
    { recordedAt: getPastDate(3) }, // 3 days ago
    { recordedAt: getPastDate(4) }  // 4 days ago
  ]
  const streaks = calculateStreaks(records)
  assert.strictEqual(streaks.daily.current, 0, 'Racha diaria actual debería ser 0')
  assert.strictEqual(streaks.daily.max, 3, 'Racha diaria máxima debería ser 3')
  console.log('✅ Prueba 4 superada: Racha rota/inactiva (cero actual, max histórico preservado).')
} catch (e) {
  console.error('❌ Prueba 4 falló:', e.message)
  process.exit(1)
}

// -------------------------------------------------------------
// Test Case 5: Weekly, Monthly, and Yearly Streaks
// -------------------------------------------------------------
try {
  // Let's create records once per week for 3 weeks
  // Let's calculate dates in millisecond offsets to avoid calendar boundary issues
  const records = [
    { recordedAt: new Date() }, // this week
    { recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // last week
    { recordedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // 2 weeks ago
    // Months
    { recordedAt: getPastMonthDate(0) }, // this month
    { recordedAt: getPastMonthDate(1) }, // last month
    { recordedAt: getPastMonthDate(2) }, // 2 months ago
    // Years
    { recordedAt: getPastYearDate(0) }, // this year
    { recordedAt: getPastYearDate(1) }  // last year
  ]
  const streaks = calculateStreaks(records)
  assert.ok(streaks.weekly.current >= 2, `Racha semanal actual (${streaks.weekly.current}) debería ser al menos 2`)
  assert.ok(streaks.monthly.current >= 2, `Racha mensual actual (${streaks.monthly.current}) debería ser al menos 2`)
  assert.ok(streaks.yearly.current >= 2, `Racha anual actual (${streaks.yearly.current}) debería ser al menos 2`)
  console.log('✅ Prueba 5 superada: Cálculo correcto de rachas de mediano y largo plazo (semanal, mensual, anual).')
} catch (e) {
  console.error('❌ Prueba 5 falló:', e.message)
  process.exit(1)
}

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE RACHAS MATEMÁTICAS SE COMPLETARON CON ÉXITO!')
