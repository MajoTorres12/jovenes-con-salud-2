import axios from 'axios'
import { Capacitor } from '@capacitor/core'
import { getCachedData, setCachedData, addToSyncQueue } from './offlineDb'
import { initOfflineSyncListeners } from './offlineSync'

const LOCAL_SERVER_PORT = '3001'
const PRODUCTION_GCP_URL = 'https://34-26-57-247.sslip.io'


function getApiUrl() {
  if (Capacitor.isNativePlatform()) {
    return `${PRODUCTION_GCP_URL}/api`
  }
  return import.meta.env.VITE_API_URL || `http://localhost:${LOCAL_SERVER_PORT}/api`
}

export function getApiBaseUrl() {
  if (Capacitor.isNativePlatform()) {
    return PRODUCTION_GCP_URL
  }
  return import.meta.env.VITE_API_URL?.replace('/api', '') || `http://localhost:${LOCAL_SERVER_PORT}`
}

const API_URL = getApiUrl()

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jcs_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Helper: Determina si un error fue por falta de red/conectividad
function isNetworkError(error) {
  return (
    !navigator.onLine ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    !error.response
  )
}

// Response interceptor — manejo de caché offline y colas de sincronización
api.interceptors.response.use(
  async (response) => {
    // Si es GET exitoso, guardamos la respuesta en IndexedDB para lectura offline
    if (response.config.method === 'get' && response.data) {
      const cacheKey = response.config.url
      setCachedData(cacheKey, response.data)
    }
    return response
  },
  async (error) => {
    const config = error.config

    if (error.response?.status === 401) {
      localStorage.removeItem('jcs_token')
      const path = window.location.pathname
      if (path !== '/login' && path !== '/registro') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Manejo de peticiones cuando se está Offline o falla la red
    if (config && isNetworkError(error)) {
      const cacheKey = config.url
      const method = config.method ? config.method.toLowerCase() : 'get'

      // ── MODO OFFLINE LECTURA (GET) ──────────────────────────────────────────
      if (method === 'get') {
        const cachedData = await getCachedData(cacheKey)
        if (cachedData) {
          console.warn(`[Offline Mode] Servidor no disponible. Usando datos locales cacheados para: ${cacheKey}`)
          return Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (Offline Cache)',
            headers: {},
            config,
            isOffline: true,
          })
        }
      }

      // ── MODO OFFLINE ESCRITURA (POST / PUT / DELETE) ───────────────────────
      if (['post', 'put', 'delete'].includes(method)) {
        let payload = {}
        try {
          payload = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {})
        } catch {
          payload = {}
        }

        const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        
        // Guardar mutación en la cola IndexedDB
        await addToSyncQueue({
          id: tempId,
          type: config.url.includes('/records') ? 'health_record' : 'general',
          method: method.toUpperCase(),
          url: config.url,
          payload,
        })

        // Notificar a la UI sobre el estado de la cola
        window.dispatchEvent(new Event('offline-queue-updated'))

        console.warn(`[Offline Mode] Operación ${method.toUpperCase()} '${config.url}' guardada en la cola de sincronización.`)

        return Promise.resolve({
          data: {
            ...payload,
            id: tempId,
            recordedAt: payload.recordedAt || new Date().toISOString(),
            isOffline: true,
            message: 'Registro guardado en el dispositivo (sin conexión). Se sincronizará automáticamente al recuperar internet.',
          },
          status: 200,
          statusText: 'OK (Offline Queue)',
          headers: {},
          config,
          isOffline: true,
        })
      }
    }

    return Promise.reject(error)
  }
)

// Inicializar escuchadores para auto-sincronización al detectar red
initOfflineSyncListeners(api)

export default api
