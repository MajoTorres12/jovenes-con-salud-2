import { sequelize } from '../src/config/database.js'
import User from '../src/models/User.js'
import HealthRecord from '../src/models/HealthRecord.js'
import MedicalAlert from '../src/models/MedicalAlert.js'
import { checkHealthLimits } from '../src/utils/healthLimits.js'

async function runTest() {
  try {
    await sequelize.authenticate()
    console.log('✅ Conexión a la base de datos establecida exitosamente.')

    // 1. Obtener el primer usuario
    const user = await User.findOne()
    if (!user) {
      console.log('❌ No se encontró ningún usuario en la base de datos para la prueba.')
      process.exit(1)
    }
    console.log(`👤 Usuario de prueba: ${user.name} (${user.email})`)

    // Resetear wearable por si acaso
    user.wearableConnected = false
    user.wearableDeviceId = null
    user.wearableDeviceName = null
    user.wearableMetrics = null
    await user.save()

    console.log('\n--- 1. ESTADO INICIAL ---')
    console.log(`Conectado: ${user.wearableConnected}`)

    console.log('\n--- 2. CONECTANDO DISPOSITIVO (Fitbit Charge 6) ---')
    const device = { id: 'fitbit', name: 'Fitbit Charge 6', brand: 'Fitbit', metrics: ['heartRate', 'weight', 'bloodPressure'] }
    user.wearableConnected = true
    user.wearableDeviceId = device.id
    user.wearableDeviceName = device.name
    user.wearableMetrics = device.metrics
    await user.save()
    console.log(`✅ Dispositivo conectado: ${user.wearableDeviceName}`)
    console.log(`Métricas soportadas: ${JSON.stringify(user.wearableMetrics)}`)

    console.log('\n--- 3. SIMULANDO SINCRONIZACIÓN DE MÉTRICAS ---')
    const metrics = user.wearableMetrics
    const UNITS = {
      weight: 'kg',
      bloodPressure: 'mmHg',
      heartRate: 'bpm',
    }

    for (const type of metrics) {
      let value = 0
      let value2 = null
      
      // Forzar valores normales para frecuencia y anormales para presión arterial
      if (type === 'heartRate') {
        value = 75 // Normal
      } else if (type === 'bloodPressure') {
        value = 145 // Sistólica alta (Anormal)
        value2 = 95 // Diastólica alta (Anormal)
      } else if (type === 'weight') {
        value = 72.5
        value2 = 170
      }

      console.log(`Sincronizando ${type}...`)
      const record = await HealthRecord.create({
        userId: user.id,
        type,
        value,
        value2,
        unit: UNITS[type] || '',
        notes: 'Test sincronizado vía ' + user.wearableDeviceName,
        recordedAt: new Date()
      })
      console.log(`  -> Guardado: ${record.type} = ${record.value}${record.value2 ? '/' + record.value2 : ''} ${record.unit}`)

      // Alertas
      try {
        const checkResult = checkHealthLimits(type, value, value2)
        if (checkResult && checkResult.isAbnormal) {
          console.log(`  ⚠️  ¡Métrica anormal detectada! ${checkResult.message}`)
          
          // Crear alerta médica si tiene doctor
          if (user.doctorId) {
            let displayValue = `${value} ${UNITS[type] || ''}`
            if (type === 'bloodPressure' && value2 != null) {
              displayValue = `${value}/${value2} ${UNITS[type] || ''}`
            }

            const alert = await MedicalAlert.create({
              userId: user.id,
              doctorId: user.doctorId,
              healthRecordId: record.id,
              severity: checkResult.severity,
              type,
              message: checkResult.message,
              value: displayValue,
              description: checkResult.description,
              status: 'pending',
              recordedAt: record.recordedAt,
            })
            console.log(`  -> Alerta médica creada en la DB con ID: ${alert.id}`)
          } else {
            console.log('  (No se crea alerta en DB porque el usuario no tiene médico asignado)')
          }
        }
      } catch (err) {
        console.error('Error al evaluar límites:', err)
      }
    }

    console.log('\n--- 4. DESCONECTANDO DISPOSITIVO ---')
    user.wearableConnected = false
    user.wearableDeviceId = null
    user.wearableDeviceName = null
    user.wearableMetrics = null
    await user.save()
    console.log('🔌 Dispositivo desconectado exitosamente.')

    console.log('\n✅ Prueba de Wearable completada con éxito en la base de datos.')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
    process.exit(1)
  }
}

runTest()
