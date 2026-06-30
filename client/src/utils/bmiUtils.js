// ── BMI / IMC utilities ─────────────────────────────────────────────────────
// Used across Dashboard, FamilyHealthTab, FamilyProfileTab, DoctorDashboard

export const BMI_CATEGORIES = [
  {
    label: 'Bajo peso',
    range: '< 18.5',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    emoji: '💙',
    key: 'underweight',
  },
  {
    label: 'Normal',
    range: '18.5 – 24.9',
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    emoji: '💚',
    key: 'normal',
  },
  {
    label: 'Sobrepeso',
    range: '25.0 – 29.9',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    emoji: '💛',
    key: 'overweight',
  },
  {
    label: 'Obesidad I',
    range: '30.0 – 34.9',
    color: '#f59e0b',
    bg: '#fff7ed',
    border: '#fed7aa',
    emoji: '🟠',
    key: 'obesity1',
  },
  {
    label: 'Obesidad II',
    range: '35.0 – 39.9',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    emoji: '🔴',
    key: 'obesity2',
  },
  {
    label: 'Obesidad III',
    range: '≥ 40.0',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
    emoji: '🟣',
    key: 'obesity3',
  },
]

/**
 * Calculate BMI given weight (kg) and height (cm)
 */
export function calcBMI(weight, heightCm) {
  if (!weight || !heightCm) return null
  const heightM = heightCm / 100
  return parseFloat((weight / (heightM * heightM)).toFixed(1))
}

/**
 * Get the corresponding BMI category object
 */
export function getBMICategory(bmi) {
  if (!bmi) return null
  if (bmi < 18.5) return BMI_CATEGORIES[0]
  if (bmi < 25.0) return BMI_CATEGORIES[1]
  if (bmi < 30.0) return BMI_CATEGORIES[2]
  if (bmi < 35.0) return BMI_CATEGORIES[3]
  if (bmi < 40.0) return BMI_CATEGORIES[4]
  return BMI_CATEGORIES[5]
}

/**
 * Get category for glucose level (mg/dL)
 */
export function getGlucoseCategory(value) {
  if (!value) return null
  if (value < 100) {
    return { label: 'Normal', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', emoji: '💚', description: 'En ayuno saludable' }
  }
  if (value < 126) {
    return { label: 'Prediabetes', color: '#d97706', bg: '#fffbeb', border: '#fde68a', emoji: '💛', description: 'Marginal, cuida tu dieta' }
  }
  return { label: 'Diabetes', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', emoji: '🔴', description: 'Nivel alto, consulta médica' }
}

/**
 * Get category for heart rate (bpm)
 */
export function getHeartRateCategory(value) {
  if (!value) return null
  if (value < 60) {
    return { label: 'Bradicardia', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', emoji: '💙', description: 'Bajo reposo o atleta' }
  }
  if (value <= 100) {
    return { label: 'Normal', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', emoji: '💚', description: 'Ritmo cardíaco normal' }
  }
  return { label: 'Taquicardia', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', emoji: '🔴', description: 'Ritmo elevado en reposo' }
}

/**
 * Get category for blood pressure (mmHg)
 */
export function getBloodPressureCategory(sys, dia) {
  if (!sys || !dia) return null
  if (sys < 120 && dia < 80) {
    return { label: 'Normal', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', emoji: '💚', description: 'Presión saludable' }
  }
  if (sys >= 120 && sys < 130 && dia < 80) {
    return { label: 'Elevada', color: '#d97706', bg: '#fffbeb', border: '#fde68a', emoji: '💛', description: 'Ligeramente elevada' }
  }
  if ((sys >= 130 && sys < 140) || (dia >= 80 && dia < 90)) {
    return { label: 'Hipertensión Nivel 1', color: '#f59e0b', bg: '#fff7ed', border: '#fed7aa', emoji: '🟠', description: 'Monitorea con tu médico' }
  }
  if (sys >= 140 || dia >= 90) {
    return { label: 'Hipertensión Nivel 2', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', emoji: '🔴', description: 'Requiere valoración médica' }
  }
  return null
}

/**
 * Get category for cholesterol (mg/dL)
 */
export function getCholesterolCategory(value) {
  if (!value) return null
  if (value < 200) {
    return { label: 'Deseable', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', emoji: '💚', description: 'Nivel óptimo' }
  }
  if (value < 240) {
    return { label: 'Límite alto', color: '#d97706', bg: '#fffbeb', border: '#fde68a', emoji: '💛', description: 'Cuidado con las grasas saturadas' }
  }
  return { label: 'Alto', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', emoji: '🔴', description: 'Nivel alto, consulta a tu médico' }
}

/**
 * Get category for triglycerides (mg/dL)
 */
export function getTriglyceridesCategory(value) {
  if (!value) return null
  if (value < 150) {
    return { label: 'Normal', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', emoji: '💚', description: 'Nivel óptimo' }
  }
  if (value < 200) {
    return { label: 'Límite alto', color: '#d97706', bg: '#fffbeb', border: '#fde68a', emoji: '💛', description: 'Moderadamente elevado' }
  }
  return { label: 'Alto', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', emoji: '🔴', description: 'Nivel alto, requiere atención' }
}