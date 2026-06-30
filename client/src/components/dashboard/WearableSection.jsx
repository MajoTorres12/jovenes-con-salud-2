import { useState, useEffect, useRef } from 'react'
import { FaSync, FaPlug, FaWifi, FaCheckCircle, FaTimesCircle, FaTimes, FaChevronDown } from 'react-icons/fa'
import { MdBluetoothConnected, MdDevices, MdWatch } from 'react-icons/md'
import api from '../../services/api'

const BRAND_COLORS = {
  Fitbit: '#00B0B9',
  Samsung: '#1428A0',
  Xiaomi:  '#FF6900',
  Garmin:  '#007CC3',
  Apple:   '#555555',
}

const METRIC_LABELS = {
  heartRate:     'Frecuencia cardíaca',
  glucose:       'Glucosa',
  bloodPressure: 'Presión arterial',
  cholesterol:   'Colesterol',
  triglycerides: 'Triglicéridos',
  weight:        'Peso',
}

function timeAgo(dateStr) {
  if (!dateStr) return null
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return 'hace menos de 1 min'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} día(s)`
}

export default function WearableSection({ onSyncComplete, isModal }) {
  const [status, setStatus] = useState(null)       // null = loading
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [toast, setToast] = useState(null)
  const modalRef = useRef(null)

  const fetchStatus = async () => {
    try {
      const res = await api.get('/wearable/status')
      setStatus(res.data)
    } catch (err) {
      console.error('Error fetching wearable status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  // Close modal on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowDeviceModal(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleConnect = async (deviceId) => {
    setConnecting(true)
    try {
      const res = await api.post('/wearable/connect', { deviceId })
      setShowDeviceModal(false)
      await fetchStatus()
      showToast(`✅ ${res.data.message}`)
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al conectar dispositivo', 'error')
    } finally {
      setConnecting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await api.post('/wearable/sync')
      setSyncResult(res.data)
      await fetchStatus()
      if (res.data.saved?.length > 0) {
        showToast(`⌚ ${res.data.message}`)
        onSyncComplete?.()   // notify Dashboard to refresh records
        window.dispatchEvent(new Event('health-records-updated'))
      } else {
        showToast('Sin cambios — todos los valores ya estaban registrados', 'info')
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al sincronizar', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('¿Desconectar el dispositivo? El historial de registros se conserva.')) return
    try {
      const res = await api.delete('/wearable/disconnect')
      setSyncResult(null)
      await fetchStatus()
      showToast(`🔌 ${res.data.message}`)
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al desconectar', 'error')
    }
  }

  if (loading) {
    return (
      <div className={`wearable-section wearable-loading ${isModal ? 'wearable-section--modal' : ''}`}>
        <div className="wearable-loading-dot" />
        <span>Verificando conexión de dispositivo…</span>
      </div>
    )
  }

  return (
    <div className={`wearable-section ${isModal ? 'wearable-section--modal' : ''}`}>
      {/* Toast */}
      {toast && (
        <div className={`wearable-toast wearable-toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* ── CONNECTED STATE ── */}
      {status?.connected ? (
        <div className="wearable-connected">
          <div className="wearable-connected__header">
            <div className="wearable-connected__icon">
              <MdBluetoothConnected size={20} />
            </div>
            <div className="wearable-connected__info">
              <span className="wearable-connected__name">{status.deviceName}</span>
              <span className="wearable-connected__meta">
                {status.lastSync
                  ? `Última sync: ${timeAgo(status.lastSync)}`
                  : 'Aún no sincronizado'
                }
                {status.syncedToday > 0 && ` · ${status.syncedToday} registro(s) hoy`}
              </span>
            </div>
            <span className="wearable-connected__badge">
              <FaCheckCircle size={12} /> Conectado
            </span>
          </div>

          {/* Metrics supported */}
          {status.deviceMetrics?.length > 0 && (
            <div className="wearable-metrics-list">
              {status.deviceMetrics.map(m => (
                <span key={m} className="wearable-metric-chip">
                  {METRIC_LABELS[m] || m}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="wearable-actions">
            <button
              className="wearable-btn wearable-btn--primary"
              onClick={handleSync}
              disabled={syncing}
            >
              <FaSync className={syncing ? 'wearable-spin' : ''} size={13} />
              {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
            </button>
            <button
              className="wearable-btn wearable-btn--ghost"
              onClick={handleDisconnect}
            >
              <FaTimesCircle size={13} />
              Desconectar
            </button>
          </div>

          {/* Sync result */}
          {syncResult && (
            <div className="wearable-sync-result">
              <div className="wearable-sync-result__title">
                Resultado de la última sincronización
              </div>
              {syncResult.saved?.length > 0 ? (
                <div className="wearable-sync-result__list">
                  {syncResult.saved.map((s, i) => (
                    <div key={i} className={`wearable-sync-item ${s.isOut ? 'wearable-sync-item--alert' : ''}`}>
                      <span className="wearable-sync-item__icon">⌚</span>
                      <span className="wearable-sync-item__label">{METRIC_LABELS[s.type]}</span>
                      <span className="wearable-sync-item__value">
                        {s.value2 != null ? `${s.value}/${s.value2}` : s.value}
                      </span>
                      {s.isOut && <span className="wearable-sync-item__out">⚠️ Fuera de rango</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="wearable-sync-result__empty">
                  Sin nuevos registros — valores normales ya existentes hoy.
                </div>
              )}
              {syncResult.skipped?.length > 0 && (
                <div className="wearable-sync-result__skipped">
                  {syncResult.skipped.length} medición(es) omitida(s) (duplicados o valores normales ya registrados hoy)
                </div>
              )}
            </div>
          )}
        </div>

      ) : showDeviceModal && isModal ? (
        /* ── INLINE DEVICE PICKER (modal mode) ── */
        <div className="wearable-device-picker-inline animate-fade-in">
          <p className="wearable-modal__subtitle" style={{ marginTop: 0 }}>
            Elige el dispositivo que usas para monitorear tu salud:
          </p>
          <div className="wearable-device-list">
            {status?.availableDevices?.map(device => (
              <button
                key={device.id}
                className="wearable-device-item"
                onClick={() => handleConnect(device.id)}
                disabled={connecting}
                style={{ '--brand-color': BRAND_COLORS[device.brand] }}
              >
                <div className="wearable-device-item__icon" style={{ background: BRAND_COLORS[device.brand] + '18', color: BRAND_COLORS[device.brand] }}>
                  <MdWatch size={18} />
                </div>
                <div className="wearable-device-item__info">
                  <span className="wearable-device-item__name">{device.name}</span>
                  <span className="wearable-device-item__metrics">
                    {device.metrics.map(m => METRIC_LABELS[m]).join(' · ')}
                  </span>
                </div>
                <FaPlug size={12} className="wearable-device-item__arrow" />
              </button>
            ))}
          </div>
          <button
            className="wearable-btn wearable-btn--ghost"
            style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
            onClick={() => setShowDeviceModal(false)}
          >
            Volver
          </button>
        </div>

      ) : (
        /* ── DISCONNECTED STATE ── */
        <div className="wearable-disconnected">
          <div className="wearable-disconnected__icon">
            <MdWatch size={32} />
          </div>
          <div className="wearable-disconnected__content">
            <h3 className="wearable-disconnected__title">Conecta tu dispositivo</h3>
            <p className="wearable-disconnected__desc">
              Sincroniza automáticamente tus métricas de salud desde tu pulsera o reloj inteligente.
              Los datos se registran de forma inteligente según su relevancia clínica.
            </p>
            <div className="wearable-brands">
              {['Fitbit', 'Samsung', 'Xiaomi', 'Garmin', 'Apple'].map(b => (
                <span key={b} className="wearable-brand-chip" style={{ borderColor: BRAND_COLORS[b] + '44', color: BRAND_COLORS[b] }}>
                  {b}
                </span>
              ))}
            </div>
            <button
              className="wearable-btn wearable-btn--connect"
              onClick={() => setShowDeviceModal(true)}
            >
              <MdDevices size={16} />
              Seleccionar dispositivo
            </button>
          </div>
        </div>
      )}

      {/* ── DEVICE PICKER MODAL (only when NOT in modal mode) ── */}
      {showDeviceModal && !isModal && (
        <div className="wearable-modal-overlay">
          <div className="wearable-modal" ref={modalRef}>
            <div className="wearable-modal__header">
              <span>Selecciona tu dispositivo</span>
              <button className="wearable-modal__close" onClick={() => setShowDeviceModal(false)}>
                <FaTimes size={14} />
              </button>
            </div>
            <p className="wearable-modal__subtitle">
              Elige el dispositivo que usas para monitorear tu salud
            </p>
            <div className="wearable-device-list">
              {status?.availableDevices?.map(device => (
                <button
                  key={device.id}
                  className="wearable-device-item"
                  onClick={() => handleConnect(device.id)}
                  disabled={connecting}
                  style={{ '--brand-color': BRAND_COLORS[device.brand] }}
                >
                  <div className="wearable-device-item__icon" style={{ background: BRAND_COLORS[device.brand] + '18', color: BRAND_COLORS[device.brand] }}>
                    <MdWatch size={18} />
                  </div>
                  <div className="wearable-device-item__info">
                    <span className="wearable-device-item__name">{device.name}</span>
                    <span className="wearable-device-item__metrics">
                      {device.metrics.map(m => METRIC_LABELS[m]).join(' · ')}
                    </span>
                  </div>
                  <FaPlug size={12} className="wearable-device-item__arrow" />
                </button>
              ))}
            </div>
            <p className="wearable-modal__note">
              * Modo demostración. Los datos se generan de forma simulada con valores realistas.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
