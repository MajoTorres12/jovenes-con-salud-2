import { useState, useEffect } from 'react'
import { FaWifi, FaCloudUploadAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import { getSyncQueue } from '../../services/offlineDb'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [toast, setToast] = useState(null)

  const updateQueueCount = async () => {
    try {
      const queue = await getSyncQueue()
      setPendingCount(queue.length)
    } catch (err) {
      console.error('Error al obtener cola en OfflineBanner:', err)
    }
  }

  useEffect(() => {
    updateQueueCount()

    const handleOnline = () => {
      setIsOnline(true)
      updateQueueCount()
    }

    const handleOffline = () => {
      setIsOnline(false)
      updateQueueCount()
    }

    const handleQueueChanged = (e) => {
      if (e.detail?.count !== undefined) {
        setPendingCount(e.detail.count)
      } else {
        updateQueueCount()
      }
    }

    const handleSyncCompleted = (e) => {
      const count = e.detail?.count || 1
      setToast(`¡Conexión reestablecida! ${count} registro(s) sincronizado(s) exitosamente.`)
      updateQueueCount()
      setTimeout(() => setToast(null), 5000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('offline-queue-updated', updateQueueCount)
    window.addEventListener('offline-queue-changed', handleQueueChanged)
    window.addEventListener('offline-sync-completed', handleSyncCompleted)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offline-queue-updated', updateQueueCount)
      window.removeEventListener('offline-queue-changed', handleQueueChanged)
      window.removeEventListener('offline-sync-completed', handleSyncCompleted)
    }
  }, [])

  if (isOnline && pendingCount === 0 && !toast) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      maxWidth: '92%',
      width: '440px',
      animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {/* Toast de resincronización exitosa */}
      {toast && (
        <div style={{
          background: 'linear-gradient(135deg, #059669, #10b981)',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '14px',
          boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.88rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
        }}>
          <FaCheckCircle size={18} style={{ flexShrink: 0 }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Banner de Modo Sin Conexión o Cola Pendiente */}
      {(!isOnline || pendingCount > 0) && (
        <div style={{
          background: !isOnline
            ? 'linear-gradient(135deg, #1e293b, #0f172a)'
            : 'linear-gradient(135deg, #7c2d12, #9a3412)',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '14px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          fontSize: '0.85rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {!isOnline ? (
              <FaExclamationTriangle style={{ color: '#fbbf24', fontSize: '1.1rem', flexShrink: 0 }} />
            ) : (
              <FaCloudUploadAlt style={{ color: '#60a5fa', fontSize: '1.2rem', flexShrink: 0 }} />
            )}
            <div>
              <span style={{ fontWeight: '700', display: 'block', lineHeight: '1.2' }}>
                {!isOnline ? 'Modo sin conexión activado' : 'Sincronizando registros...'}
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                {!isOnline
                  ? 'Tus datos se guardan localmente y se enviarán al volver la red'
                  : 'Enviando operaciones acumuladas al servidor'}
              </span>
            </div>
          </div>

          {pendingCount > 0 && (
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '800',
              flexShrink: 0,
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}>
              {pendingCount} pend.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
