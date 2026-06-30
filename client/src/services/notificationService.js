import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import api from './api'

class NotificationService {
  isNative = Capacitor.isNativePlatform()

  /**
   * Obtiene si la plataforma nativa actual cuenta con la configuración de Firebase
   */
  hasFirebaseConfig() {
    if (!this.isNative) return false
    const platform = Capacitor.getPlatform()
    
    // Leer variables definidas en vite.config.js
    const hasAndroidConfig = import.meta.env.VITE_HAS_ANDROID_GOOGLE_SERVICES === true || import.meta.env.VITE_HAS_ANDROID_GOOGLE_SERVICES === 'true'
    const hasIosConfig = import.meta.env.VITE_HAS_IOS_GOOGLE_SERVICES === true || import.meta.env.VITE_HAS_IOS_GOOGLE_SERVICES === 'true'
    
    if (platform === 'android') return hasAndroidConfig
    if (platform === 'ios') return hasIosConfig
    return false
  }

  /**
   * Inicializa las notificaciones de la aplicación.
   * Si es nativo (Android), registra los canales de notificación y listeners.
   */
  async initialize() {
    if (!this.isNative) {
      console.log('ℹ️ Entorno web: Notificaciones nativas desactivadas.')
      return
    }

    try {
      // Registrar canales locales para Android 8+ (Oreo y superior)
      await LocalNotifications.createChannel({
        id: 'reminders',
        name: 'Recordatorios de Salud',
        description: 'Canal para alertas de medicamentos y suplementos',
        importance: 5, // max priority
        visibility: 1, // public
        sound: 'default'
      })

      // Solo configurar oyentes de notificaciones push si Firebase está configurado
      if (this.hasFirebaseConfig()) {
        await this.setupPushListeners()
      } else {
        console.info(`ℹ️ Notificaciones Push omitidas: Falta configurar Firebase (${Capacitor.getPlatform()})`)
      }
    } catch (err) {
      console.error('❌ Error al inicializar notificaciones nativas:', err)
    }
  }

  /**
   * Configura los listeners para eventos de notificaciones push.
   */
  async setupPushListeners() {
    if (!this.isNative) return

    // Al registrarse exitosamente con FCM
    await PushNotifications.addListener('registration', async (token) => {
      console.log('✅ Token FCM obtenido:', token.value)
      try {
        await api.put('/notifications/token', { token: token.value })
        console.log('✅ Token FCM guardado en la base de datos del servidor')
      } catch (err) {
        console.error('❌ Error al registrar token en el backend:', err.message)
      }
    })

    // Error al registrarse
    await PushNotifications.addListener('registrationError', (err) => {
      console.error('❌ Error de registro en Push Notifications:', err)
    })

    // Al recibir notificación con la app abierta (Primer plano)
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('✉️ Notificación Push recibida (Primer plano):', notification)
    })

    // Al dar clic en una notificación push (Segundo plano o cerrada)
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('✉️ Clic en Notificación Push:', action)
      const data = action.notification.data
      if (data && data.url) {
        // Redirección interna
        window.location.href = data.url
      }
    })
  }

  /**
   * Solicita permisos de notificaciones push al usuario y las registra en el dispositivo.
   */
  async registerPush() {
    if (!this.isNative) return false

    // Si no hay configuración de Firebase, salimos en silencio para evitar un crash
    if (!this.hasFirebaseConfig()) {
      console.warn('⚠️ Registro de Notificaciones Push omitido para evitar crash (Falta google-services.json).')
      return false
    }

    try {
      let permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive === 'granted') {
        await PushNotifications.register()
        return true
      } else {
        console.warn('⚠️ Permiso para notificaciones push rechazado.')
        return false
      }
    } catch (err) {
      console.error('❌ Error al solicitar permisos push:', err)
      return false
    }
  }

  /**
   * Remueve el token de push del usuario actual en el servidor backend.
   */
  async unregisterPush() {
    if (!this.isNative) return
    if (!this.hasFirebaseConfig()) return // No hacer nada si push está desactivado

    try {
      await api.delete('/notifications/token')
      console.log('🗑️ Token de dispositivo eliminado del servidor')
    } catch (err) {
      console.error('❌ Error eliminando token de dispositivo:', err.message)
    }
  }

  /**
   * Programa una notificación local nativa para recordatorios de medicamentos.
   * Funciona de forma totalmente offline y respeta el estado inactivo del teléfono.
   * @param {string} title - Título del recordatorio.
   * @param {string} body - Cuerpo o instrucciones.
   * @param {number} id - Identificador numérico único de la alarma.
   * @param {Date} date - Fecha y hora exactas para detonar.
   */
  async scheduleLocalNotification(title, body, id, date) {
    if (!this.isNative) {
      console.log(`⏰ [Simulación Recordatorio Web] "${title}" programado para ${date.toLocaleString()}`)
      return true
    }

    try {
      const perm = await LocalNotifications.requestPermissions()
      if (perm.display !== 'granted') {
        console.warn('⚠️ Permiso de notificaciones locales denegado.')
        return false
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Number(id) || Math.floor(Math.random() * 100000),
            schedule: { at: date, allowWhileIdle: true },
            sound: 'default',
            channelId: 'reminders'
          }
        ]
      })
      console.log(`✅ Alarma "${title}" programada en el dispositivo para ${date.toLocaleString()}`)
      return true
    } catch (err) {
      console.error('❌ Error al programar notificación local:', err)
      return false
    }
  }

  /**
   * Cancela una alarma de notificación local específica.
   * @param {number} id - ID del recordatorio.
   */
  async cancelLocalNotification(id) {
    if (!this.isNative) return

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: Number(id) }]
      })
      console.log(`🗑️ Recordatorio ID ${id} cancelado en el dispositivo`)
    } catch (err) {
      console.error('❌ Error cancelando notificación local:', err)
    }
  }
}

export default new NotificationService()
