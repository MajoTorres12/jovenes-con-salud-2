import { initializeApp, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

let isFirebaseConfigured = false
let messagingInstance = null

function ensureFirebaseInitialized() {
  if (isFirebaseConfigured) return true

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && privateKey) {
    try {
      // Format private key if it has escaped newlines
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n')

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      })
      messagingInstance = getMessaging()
      isFirebaseConfigured = true
      console.log('✅ Firebase Admin SDK inicializado correctamente para Notificaciones Push')
      return true
    } catch (error) {
      console.error('❌ Error inicializando Firebase Admin SDK:', error.message)
      return false
    }
  } else {
    if (!global.firebaseWarnLogged) {
      console.warn('⚠️  Firebase Admin SDK no configurado (falta FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en .env).')
      console.warn('   Las notificaciones push se simularán.')
      global.firebaseWarnLogged = true
    }
    return false
  }
}

/**
 * Envia una notificación push a un token de dispositivo específico.
 * @param {string} deviceToken - El token de FCM del destinatario.
 * @param {object} payload - El contenido de la notificación.
 * @param {string} payload.title - Título.
 * @param {string} payload.body - Cuerpo del mensaje.
 * @param {object} [payload.data] - Datos extra.
 */
export async function sendPushNotification(deviceToken, { title, body, data = {} }) {
  if (!deviceToken) {
    console.warn('⚠️ Intento de enviar push sin token de dispositivo.')
    return false
  }

  // Ensure all data values are strings for FCM compatibility
  const stringifiedData = {}
  Object.keys(data).forEach(key => {
    stringifiedData[key] = String(data[key])
  })

  const message = {
    notification: {
      title,
      body,
    },
    data: stringifiedData,
    token: deviceToken,
  }

  ensureFirebaseInitialized()

  if (isFirebaseConfigured && messagingInstance) {
    try {
      const response = await messagingInstance.send(message)
      console.log('✉️ Notificación Push enviada exitosamente:', response)
      return true
    } catch (error) {
      console.error('❌ Error enviando notificación Push vía FCM:', error.message)
      return false
    }
  } else {
    console.log(`✉️ [SIMULACIÓN PUSH] Destinatario: ${deviceToken}`)
    console.log(`   Título: "${title}"`)
    console.log(`   Cuerpo: "${body}"`)
    console.log(`   Datos:`, stringifiedData)
    return true
  }
}

/**
 * Envia notificaciones push a múltiples tokens.
 * @param {string[]} deviceTokens - Array de tokens.
 * @param {object} payload - Contenido.
 */
export async function sendMulticastNotification(deviceTokens, { title, body, data = {} }) {
  const validTokens = deviceTokens.filter(t => !!t)
  if (validTokens.length === 0) return

  // Ensure all data values are strings for FCM compatibility
  const stringifiedData = {}
  Object.keys(data).forEach(key => {
    stringifiedData[key] = String(data[key])
  })

  ensureFirebaseInitialized()

  if (isFirebaseConfigured && messagingInstance) {
    try {
      const response = await messagingInstance.sendEachForMulticast({
        tokens: validTokens,
        notification: { title, body },
        data: stringifiedData,
      })
      console.log(`✉️ Multicast Push enviado. Éxito: ${response.successCount}, Fallos: ${response.failureCount}`)
      return response
    } catch (error) {
      console.error('❌ Error enviando multicast Push:', error.message)
    }
  } else {
    console.log(`✉️ [SIMULACIÓN MULTICAST PUSH] ${validTokens.length} dispositivos`)
    console.log(`   Título: "${title}"`)
    console.log(`   Cuerpo: "${body}"`)
    return { successCount: validTokens.length, failureCount: 0 }
  }
}
