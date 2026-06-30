export function checkHealthLimits(type, value, value2) {
  const numValue = parseFloat(value)
  const numValue2 = value2 != null ? parseFloat(value2) : null

  if (isNaN(numValue)) return null

  switch (type) {
    case 'glucose':
      if (numValue >= 126) {
        return {
          isAbnormal: true,
          severity: 'critical',
          message: 'Glucosa Alta',
          description: 'Nivel indicativo de diabetes, requiere consulta médica inmediata.'
        }
      }
      if (numValue >= 100) {
        return {
          isAbnormal: true,
          severity: 'warning',
          message: 'Glucosa Elevada',
          description: 'Nivel indicativo de prediabetes, cuida tu dieta.'
        }
      }
      break;

    case 'heartRate':
      if (numValue > 100) {
        return {
          isAbnormal: true,
          severity: 'critical',
          message: 'Taquicardia',
          description: 'Ritmo cardíaco elevado en reposo.'
        }
      }
      if (numValue < 60) {
        return {
          isAbnormal: true,
          severity: 'warning',
          message: 'Bradicardia',
          description: 'Ritmo cardíaco bajo en reposo.'
        }
      }
      break;

    case 'bloodPressure':
      if (numValue2 == null) break;
      if (numValue >= 140 || numValue2 >= 90) {
        return {
          isAbnormal: true,
          severity: 'critical',
          message: 'Hipertensión Nivel 2',
          description: 'Presión arterial muy alta, requiere valoración médica.'
        }
      }
      if ((numValue >= 130 && numValue < 140) || (numValue2 >= 80 && numValue2 < 90)) {
        return {
          isAbnormal: true,
          severity: 'warning',
          message: 'Hipertensión Nivel 1',
          description: 'Presión arterial elevada, monitorea con tu médico.'
        }
      }
      if (numValue >= 120 && numValue < 130 && numValue2 < 80) {
        return {
          isAbnormal: true,
          severity: 'warning',
          message: 'Presión Elevada',
          description: 'Presión arterial ligeramente elevada.'
        }
      }
      break;

    case 'cholesterol':
      if (numValue >= 240) {
        return {
          isAbnormal: true,
          severity: 'critical',
          message: 'Colesterol Alto',
          description: 'Nivel alto de colesterol, consulta a tu médico.'
        }
      }
      if (numValue >= 200) {
        return {
          isAbnormal: true,
          severity: 'warning',
          message: 'Colesterol Límite Alto',
          description: 'Cuidado con las grasas saturadas.'
        }
      }
      break;

    case 'triglycerides':
      if (numValue >= 200) {
        return {
          isAbnormal: true,
          severity: 'critical',
          message: 'Triglicéridos Altos',
          description: 'Nivel alto de triglicéridos, requiere atención médica.'
        }
      }
      if (numValue >= 150) {
        return {
          isAbnormal: true,
          severity: 'warning',
          message: 'Triglicéridos Límite Alto',
          description: 'Nivel moderadamente elevado de triglicéridos.'
        }
      }
      break;

    case 'weight':
      if (numValue2 != null && numValue2 > 0) {
        const heightM = numValue2 / 100
        const bmi = numValue / (heightM * heightM)
        if (bmi >= 30) {
          return {
            isAbnormal: true,
            severity: 'critical',
            message: 'Obesidad Detectada',
            description: `Tu IMC de ${bmi.toFixed(1)} indica obesidad. Cuida tu alimentación y consulta a un profesional.`
          }
        }
        if (bmi >= 25) {
          return {
            isAbnormal: true,
            severity: 'warning',
            message: 'Sobrepeso Detectado',
            description: `Tu IMC de ${bmi.toFixed(1)} indica sobrepeso.`
          }
        }
        if (bmi < 18.5) {
          return {
            isAbnormal: true,
            severity: 'warning',
            message: 'Bajo Peso Detectado',
            description: `Tu IMC de ${bmi.toFixed(1)} indica peso bajo.`
          }
        }
      }
      break;
  }

  return { isAbnormal: false }
}
