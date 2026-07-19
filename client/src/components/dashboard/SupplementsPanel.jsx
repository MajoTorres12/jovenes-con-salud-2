import { useState, useEffect, useCallback } from 'react'
import { FaLeaf, FaPlus, FaTimes, FaTrash, FaEdit } from 'react-icons/fa'
import api from '../../services/api'
import notificationService from '../../services/notificationService'

const parse24hTo12hList = (timeString) => {
  if (!timeString) return [{ hour: '08', minute: '00', period: 'AM' }]
  const times = Array.isArray(timeString) 
    ? timeString 
    : timeString.split(',').map(s => s.trim()).filter(Boolean)
  
  return times.map(timeStr => {
    const parts = timeStr.split(':')
    if (parts.length < 2) return { hour: '08', minute: '00', period: 'AM' }
    const rawHours = parseInt(parts[0], 10)
    const minutes = parts[1]
    const period = rawHours >= 12 ? 'PM' : 'AM'
    const displayHours = rawHours % 12 || 12
    const hour = String(displayHours).padStart(2, '0')
    return { hour, minute: minutes, period }
  })
}

const serialize12hListTo24h = (list) => {
  if (!list || !Array.isArray(list)) return []
  return list.map(item => {
    let hours = parseInt(item.hour, 10)
    if (item.period === 'PM' && hours < 12) hours += 12
    if (item.period === 'AM' && hours === 12) hours = 0
    const formattedHours = String(hours).padStart(2, '0')
    return `${formattedHours}:${item.minute}`
  })
}

const formatTimeTo12h = (timeStr) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  const hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.'
  const displayHours = hours % 12 || 12
  const formattedHours = String(displayHours).padStart(2, '0')
  return `${formattedHours}:${minutes} ${ampm}`
}

export default function SupplementsPanel({ selectedFamilyId = null }) {
  const [supplements, setSupplements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  
  const emptyForm = { name: '', dose: '', frequency: '', instructions: '', schedules: [{ hour: '08', minute: '00', period: 'AM' }] }
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)

  const fetchSupplements = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (selectedFamilyId) {
        params.familyMemberId = selectedFamilyId
      }
      const { data } = await api.get('/supplements', { params })
      const list = data.supplements || []
      setSupplements(list)

      // Sincronizar alarmas locales en dispositivo móvil (solo para el titular, no familiares)
      if (!selectedFamilyId) {
        notificationService.syncSupplements(list)
      }
    } catch (err) {
      console.error('Error fetching supplements:', err)
      setError('No se pudieron cargar los suplementos. Intenta de nuevo.')
      setSupplements([])
    } finally {
      setLoading(false)
    }
  }, [selectedFamilyId])

  useEffect(() => { fetchSupplements() }, [fetchSupplements])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        ...form,
        schedules: serialize12hListTo24h(form.schedules),
      }

      // Include familyMemberId when creating/updating for a family member
      if (selectedFamilyId) {
        payload.familyMemberId = selectedFamilyId
      }
      
      if (editId) {
        await api.put(`/supplements/${editId}`, payload)
      } else {
        await api.post('/supplements', payload)
      }
      
      setShowModal(false)
      setForm(emptyForm)
      setEditId(null)
      fetchSupplements()
    } catch (err) {
      console.error('Error saving supplement:', err)
      const msg = err?.response?.data?.error || 'Error al guardar. Intenta de nuevo.'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar el suplemento ${name}?`)) return
    try {
      await api.delete(`/supplements/${id}`)
      fetchSupplements()
    } catch (err) {
      console.error('Error deleting supplement:', err)
    }
  }

  const openEdit = (sup) => {
    setForm({
      name: sup.name,
      dose: sup.dose,
      frequency: sup.frequency,
      instructions: sup.instructions || '',
      schedules: parse24hTo12hList(sup.schedules),
    })
    setEditId(sup.id)
    setShowModal(true)
  }

  const isFamily = selectedFamilyId !== null

  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: 'var(--radius-xl)',
      background: 'white',
      boxShadow: 'var(--shadow-card)',
      border: '1px solid var(--color-theme-accent-border)',
      marginBottom: '2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FaLeaf style={{ color: 'white', fontSize: '1.1rem' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
              {isFamily ? 'Suplementos del Familiar' : 'Mis Suplementos'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-surface-500)' }}>
              Control de complementos nutricionales y vitaminas
            </p>
          </div>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditId(null); setShowModal(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: '#0d9488',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(13,148,136,0.3)',
            transition: 'all 0.2s',
          }}
        >
          <FaPlus size={12} /> Nuevo
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-surface-400)', textAlign: 'center', padding: '2rem 0' }}>Cargando suplementos...</p>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#fef2f2', borderRadius: 'var(--radius-lg)', border: '1px solid #fecaca' }}>
          <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</p>
          <button onClick={fetchSupplements} style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Reintentar</button>
        </div>
      ) : supplements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--color-surface-50)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-surface-300)' }}>
          <p style={{ color: 'var(--color-surface-500)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {isFamily ? 'Este familiar no tiene suplementos registrados actualmente.' : 'No tienes suplementos registrados actualmente.'}
          </p>
          <button
            onClick={() => { setForm(emptyForm); setEditId(null); setShowModal(true) }}
            style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #0d9488', color: '#0d9488', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            {isFamily ? 'Añadir primer suplemento' : 'Añadir mi primer suplemento'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {supplements.map(sup => (
            <div key={sup.id} style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-theme-accent-border)',
              background: 'var(--color-surface-50)',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.35rem' }}>
                <button onClick={() => openEdit(sup)} style={{ background: 'white', border: '1px solid var(--color-theme-accent-border)', padding: '0.3rem', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-surface-500)' }} title="Editar">
                  <FaEdit size={12} />
                </button>
                <button onClick={() => handleDelete(sup.id, sup.name)} style={{ background: 'white', border: '1px solid #fecaca', padding: '0.3rem', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }} title="Eliminar">
                  <FaTrash size={12} />
                </button>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '0.2rem', paddingRight: '40px' }}>
                {sup.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#0d9488', fontWeight: '600', marginBottom: '0.75rem' }}>
                {sup.dose} • {sup.frequency}
              </p>

              {sup.schedules?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {sup.schedules.map((s, i) => (
                    <span key={i} style={{ padding: '0.2rem 0.5rem', background: '#0d948820', color: '#0f766e', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {formatTimeTo12h(s)}
                    </span>
                  ))}
                </div>
              )}

              {sup.instructions && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-surface-500)', fontStyle: 'italic', background: 'white', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-theme-accent-border)' }}>
                  "{sup.instructions}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          animation: 'fadeIn 0.2s',
        }}>
          <div style={{
            background: 'white', width: '100%', maxWidth: '450px',
            borderRadius: '24px', boxShadow: '0 25px 50px -12px rgb(0 0 0/0.25)',
            overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-surface-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
                {editId ? 'Editar Suplemento' : 'Nuevo Suplemento'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: 'var(--color-surface-400)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {saveError && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: '500' }}>
                  ⚠️ {saveError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>Nombre del suplemento *</label>
                <input
                  type="text" required placeholder="Ej: Omega 3, Proteína, Vitamina D" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>Dosis *</label>
                  <input
                    type="text" required placeholder="Ej: 1 cápsula, 30g" value={form.dose}
                    onChange={e => setForm(f => ({ ...f, dose: e.target.value }))}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>Frecuencia *</label>
                  <input
                    type="text" required placeholder="Ej: Con el desayuno, 1 vez al día" value={form.frequency}
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                  Horarios de toma
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  {form.schedules.map((sch, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* Hour dropdown */}
                      <select
                        value={sch.hour}
                        onChange={e => {
                          const updated = [...form.schedules]
                          updated[index].hour = e.target.value
                          setForm(f => ({ ...f, schedules: updated }))
                        }}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: '2px solid var(--color-surface-200)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          background: 'white',
                          color: 'black'
                        }}
                      >
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>

                      <span style={{ fontWeight: '700', color: 'var(--color-surface-600)' }}>:</span>

                      {/* Minute dropdown */}
                      <select
                        value={sch.minute}
                        onChange={e => {
                          const updated = [...form.schedules]
                          updated[index].minute = e.target.value
                          setForm(f => ({ ...f, schedules: updated }))
                        }}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: '2px solid var(--color-surface-200)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          background: 'white',
                          color: 'black'
                        }}
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      {/* AM / PM select dropdown */}
                      <select
                        value={sch.period}
                        onChange={e => {
                          const updated = [...form.schedules]
                          updated[index].period = e.target.value
                          setForm(f => ({ ...f, schedules: updated }))
                        }}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: '2px solid var(--color-surface-200)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          background: 'white',
                          color: 'black',
                          fontWeight: '700'
                        }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>

                      {/* Remove button */}
                      {form.schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = form.schedules.filter((_, idx) => idx !== index)
                            setForm(f => ({ ...f, schedules: updated }))
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#ef4444'
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                            e.currentTarget.style.color = '#ef4444'
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setForm(f => ({
                      ...f,
                      schedules: [...f.schedules, { hour: '08', minute: '00', period: 'AM' }]
                    }))
                  }}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: 'var(--color-surface-100)',
                    color: 'var(--color-surface-700)',
                    border: '1px solid var(--color-surface-300)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--color-surface-200)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--color-surface-100)'
                  }}
                >
                  + Agregar horario
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                  Indicaciones adicionales <span style={{ color: 'var(--color-surface-400)', fontWeight: '400' }}>(Opcional)</span>
                </label>
                <textarea
                  rows={2} placeholder="Ej: Tomar con un vaso de agua después del ejercicio" value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit" disabled={saving}
                style={{
                  marginTop: '0.5rem', padding: '0.875rem', borderRadius: 'var(--radius-lg)', border: 'none',
                  background: saving ? 'var(--color-surface-300)' : '#0d9488', color: 'white', fontSize: '0.95rem', fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                {saving ? 'Guardando...' : (editId ? 'Actualizar' : 'Guardar Suplemento')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
