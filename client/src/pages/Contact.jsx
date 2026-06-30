import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi'
import { FaEnvelope, FaUser, FaPaperPlane, FaCheckCircle } from 'react-icons/fa'
import api from '../services/api'

export default function Contact() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null)
  
  const [locations, setLocations] = useState([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  
  const [settings, setSettings] = useState({
    address: 'Parque Bicentenario, Blvrd Praxedis Balboa, Sin Nombre de Col 13, 87083 Cdad. Victoria, Tamps.',
    phone: '(834) 123-4567',
    email: 'contacto@jovenesconsalud.gob.mx',
    schedule: 'Lunes a Viernes: 8:00 AM - 5:00 PM\nSábados: 9:00 AM - 1:00 PM',
    latitude: 23.75166,
    longitude: -99.09692,
    label: 'Instituto de la Juventud de Tamaulipas',
  })
  const [activeMap, setActiveMap] = useState({
    label: 'Instituto de la Juventud de Tamaulipas',
    address: 'Parque Bicentenario, Blvrd Praxedis Balboa, Sin Nombre de Col 13, 87083 Cdad. Victoria, Tamps.',
    latitude: 23.75166,
    longitude: -99.09692,
  })
  const [selectedKey, setSelectedKey] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/contact/settings'),
      api.get('/contact/locations')
    ]).then(([settingsRes, locationsRes]) => {
      const s = settingsRes.data.settings || {}
      const locs = locationsRes.data.locations || []
      
      setSettings(prev => ({ ...prev, ...s }))
      setLocations(locs)
      
      const lat = parseFloat(s.latitude)
      const lng = parseFloat(s.longitude)
      
      const match = locs.find(loc => 
        Math.abs(loc.latitude - lat) < 0.001 && 
        Math.abs(loc.longitude - lng) < 0.001
      )
      
      if (match) {
        setSelectedKey(match.id)
        setActiveMap({
          label: match.label,
          address: match.address,
          latitude: match.latitude,
          longitude: match.longitude
        })
      } else if (locs.length > 0) {
        setSelectedKey(locs[0].id)
        setActiveMap({
          label: locs[0].label,
          address: locs[0].address,
          latitude: locs[0].latitude,
          longitude: locs[0].longitude
        })
      } else {
        setSelectedKey('official')
        setActiveMap({
          label: s.label || 'Dirección Oficial',
          address: s.address || 'Victoria, Tamps.',
          latitude: isNaN(lat) ? 23.75166 : lat,
          longitude: isNaN(lng) ? -99.09692 : lng
        })
      }
    })
    .catch(err => console.error('Error fetching contact settings/locations:', err))
    .finally(() => setLocationsLoading(false))
  }, [])

  const onSubmit = async (data) => {
    setSending(true)
    setFeedback(null)
    try {
      const res = await api.post('/contact', data)
      setFeedback({ type: 'success', text: res.data.message })
      reset()
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.error || 'Error al enviar el mensaje' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', paddingTop: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>
          Contáctanos
        </h1>
        <p style={{ color: 'var(--color-surface-500)', maxWidth: '500px', margin: '0 auto' }}>
          ¿Tienes dudas o sugerencias? Estamos para ayudarte.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Contact Info */}
        <div className="animate-fade-in-up">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--color-surface-800)' }}>
            Información de Contacto
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { icon: HiLocationMarker, label: 'Dirección', value: settings.address },
              { icon: HiPhone, label: 'Teléfono', value: settings.phone },
              { icon: HiMail, label: 'Correo', value: settings.email },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: '1rem', padding: '1rem',
                borderRadius: 'var(--radius-lg)', background: 'white',
                boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-surface-200)',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-50)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <item.icon style={{ color: 'var(--color-primary-500)', fontSize: '1.1rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-surface-400)', fontWeight: '600', marginBottom: '0.15rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-surface-700)' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '1.5rem', padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-accent-50))',
            border: '1px solid var(--color-primary-100)',
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>
              Horario de Atención
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-surface-600)', whiteSpace: 'pre-line' }}>
              {settings.schedule}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="animate-fade-in-up stagger-2" style={{
          padding: '2rem', borderRadius: 'var(--radius-xl)',
          background: 'white', boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-surface-200)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--color-surface-800)' }}>
            Envíanos un Mensaje
          </h2>

          {feedback && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-lg)',
              background: feedback.type === 'success' ? '#10b98115' : '#ef444415',
              color: feedback.type === 'success' ? '#059669' : '#dc2626',
              fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              {feedback.type === 'success' && <FaCheckCircle size={14} />}
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <FaUser style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
              <input
                type="text" placeholder="Tu nombre"
                {...register('name', { required: true })}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius-lg)', border: `2px solid ${errors.name ? '#ef4444' : 'var(--color-surface-200)'}`,
                  fontSize: '0.9rem', outline: 'none',
                }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <FaEnvelope style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
              <input
                type="email" placeholder="Tu correo"
                {...register('email', { required: true })}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius-lg)', border: `2px solid ${errors.email ? '#ef4444' : 'var(--color-surface-200)'}`,
                  fontSize: '0.9rem', outline: 'none',
                }}
              />
            </div>
            <input
              type="text" placeholder="Asunto"
              {...register('subject', { required: true })}
              style={{
                width: '100%', padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)', border: `2px solid ${errors.subject ? '#ef4444' : 'var(--color-surface-200)'}`,
                fontSize: '0.9rem', outline: 'none',
              }}
            />
            <textarea
              placeholder="Escribe tu mensaje aquí..."
              rows={5}
              {...register('message', { required: true })}
              style={{
                width: '100%', padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)', border: `2px solid ${errors.message ? '#ef4444' : 'var(--color-surface-200)'}`,
                fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            <button type="submit" disabled={sending} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.875rem', borderRadius: 'var(--radius-lg)', border: 'none',
              background: sending ? 'var(--color-surface-300)' : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
              color: 'white', fontSize: '0.95rem', fontWeight: '600',
              cursor: sending ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 10px rgb(135 18 51 / 0.3)',
            }}>
              {sending ? (
                <><div className="spinner" style={{ width: '18px', height: '18px' }} /> Enviando...</>
              ) : (
                <><FaPaperPlane /> Enviar Mensaje</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Map Section ─────────────────────────────────── */}
      <div className="animate-fade-in-up stagger-3" style={{
        marginTop: '2.5rem', borderRadius: 'var(--radius-xl)',
        overflow: 'hidden', border: '1px solid var(--color-surface-200)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div className="map-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', minHeight: '400px' }}>
          {/* Menu Column */}
          <div style={{
            background: 'var(--color-surface-50)',
            borderRight: '1px solid var(--color-surface-200)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxHeight: '450px',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--color-surface-800)', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📍 Directorio de Sedes
            </h3>
            
            {/* Show custom official address if it doesn't match any predefined location */}
            {selectedKey === 'official' && (
              <button 
                type="button"
                onClick={() => {
                  setSelectedKey('official')
                  setActiveMap({
                    label: settings.label || 'Dirección Oficial',
                    address: settings.address,
                    latitude: parseFloat(settings.latitude),
                    longitude: parseFloat(settings.longitude)
                  })
                }}
                className="location-menu-item active"
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-primary-200)',
                  background: 'var(--color-primary-50)',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
              >
                <HiLocationMarker style={{ color: 'var(--color-primary-500)', fontSize: '1.2rem', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div className="location-title" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-primary-900)' }}>
                    {settings.label || 'Dirección Oficial'}
                  </div>
                  <div className="location-address" style={{ fontSize: '0.72rem', color: 'var(--color-primary-700)', marginTop: '2px', lineHeight: '1.3' }}>
                    {settings.address}
                  </div>
                </div>
              </button>
            )}

            {locationsLoading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-surface-400)', fontSize: '0.85rem' }}>
                Cargando sedes...
              </div>
            ) : locations.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-surface-400)', fontSize: '0.85rem' }}>
                No hay sedes registradas
              </div>
            ) : (
              locations.map((loc) => {
                const isActive = selectedKey === loc.id
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setSelectedKey(loc.id)
                      setActiveMap({
                        label: loc.label,
                        address: loc.address,
                        latitude: loc.latitude,
                        longitude: loc.longitude
                      })
                    }}
                    className={`location-menu-item ${isActive ? 'active' : ''}`}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-lg)',
                      border: isActive ? '1px solid var(--color-primary-200)' : '1px solid var(--color-surface-200)',
                      background: isActive ? 'var(--color-primary-50)' : 'var(--color-surface-100)',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                  >
                    <HiLocationMarker style={{ color: isActive ? 'var(--color-primary-500)' : 'var(--color-surface-400)', fontSize: '1.2rem', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div className="location-title" style={{ fontSize: '0.85rem', fontWeight: '700', color: isActive ? 'var(--color-primary-900)' : 'var(--color-surface-800)' }}>
                        {loc.label}
                      </div>
                      <div className="location-address" style={{ fontSize: '0.72rem', color: isActive ? 'var(--color-primary-700)' : 'var(--color-surface-500)', marginTop: '2px', lineHeight: '1.3' }}>
                        {loc.address}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Map Column */}
          <div style={{ position: 'relative', height: '100%', minHeight: '340px' }}>
            {/* Label overlay */}
            <div className="map-overlay-card" style={{
              position: 'absolute', top: '1rem', left: '1rem', zIndex: 10,
              backdropFilter: 'blur(8px)',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              maxWidth: 'calc(100% - 70px)',
            }}>
              <HiLocationMarker style={{ color: 'var(--color-primary-500)', fontSize: '1.35rem', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-surface-900)', margin: 0 }}>{activeMap.label}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-surface-600)', margin: '2px 0 0 0', lineHeight: 1.3 }}>{activeMap.address}</p>
              </div>
            </div>
            <iframe
              title={`Ubicación — ${activeMap.label}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeMap.longitude - 0.008},${activeMap.latitude - 0.005},${activeMap.longitude + 0.008},${activeMap.latitude + 0.005}&layer=mapnik&marker=${activeMap.latitude},${activeMap.longitude}`}
              width="100%"
              height="100%"
              style={{ border: 'none', display: 'block', minHeight: '400px' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <style>{`
          .location-menu-item {
            transition: all 0.25s ease !important;
          }
          .location-menu-item:hover {
            border-color: var(--color-primary-300) !important;
            background: var(--color-primary-50) !important;
            transform: translateX(3px);
          }
          .location-menu-item:hover .location-title {
            color: var(--color-primary-900) !important;
          }
          .location-menu-item:hover .location-address {
            color: var(--color-primary-700) !important;
          }
          
          /* Active item overrides */
          .location-menu-item.active .location-title {
            color: var(--color-primary-900) !important;
          }
          .location-menu-item.active .location-address {
            color: var(--color-primary-700) !important;
          }
          
          /* Map overlay card default styling */
          .map-overlay-card {
            background: rgba(255, 255, 255, 0.92) !important;
            border: 1px solid var(--color-surface-200) !important;
          }

          /* Dark Mode Overrides */
          html.dark .location-menu-item:hover .location-title,
          html.dark .location-menu-item.active .location-title {
            color: #ffffff !important;
          }
          html.dark .location-menu-item:hover .location-address,
          html.dark .location-menu-item.active .location-address {
            color: var(--color-surface-600) !important;
          }
          html.dark .map-overlay-card {
            background: rgba(21, 23, 29, 0.92) !important;
            border: 1px solid var(--color-surface-200) !important;
          }
          
          @media (min-width: 768px) {
            .map-grid {
              grid-template-columns: 320px 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
