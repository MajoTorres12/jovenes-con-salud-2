import axios from 'axios'
import { Capacitor } from '@capacitor/core'

// IP de la computadora del desarrollador en la red Wi-Fi local.
// Obtener con: ipconfig (Windows) / ifconfig (Mac/Linux)
const LOCAL_NETWORK_IP = '192.168.1.128'
const LOCAL_SERVER_PORT = '3001'

/**
 * Determina la URL base de la API automáticamente.
 * - En dispositivo nativo (Android/iOS): usa la IP de la red local.
 * - En navegador web: usa la variable de entorno o localhost.
 */
function getApiUrl() {
  if (Capacitor.isNativePlatform()) {
    return `http://${LOCAL_NETWORK_IP}:${LOCAL_SERVER_PORT}/api`
  }
  return import.meta.env.VITE_API_URL || `http://localhost:${LOCAL_SERVER_PORT}/api`
}

/**
 * Retorna la URL base del servidor (sin /api), útil para cargar imágenes.
 */
export function getApiBaseUrl() {
  if (Capacitor.isNativePlatform()) {
    return `http://${LOCAL_NETWORK_IP}:${LOCAL_SERVER_PORT}`
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

// Response interceptor — handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jcs_token')
      // Only redirect if not already on login/register page
      const path = window.location.pathname
      if (path !== '/login' && path !== '/registro') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
