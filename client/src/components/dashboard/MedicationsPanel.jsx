import { useState, useEffect, useCallback } from 'react'
import { FaPills, FaPlus, FaTimes, FaTrash, FaEdit, FaCheck, FaInfoCircle } from 'react-icons/fa'
import api from '../../services/api'

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

const PREDEFINED_MEDICATIONS = [
  {
    name: 'Metformina',
    category: 'Diabetes',
    dose: '850 mg',
    frequency: 'Cada 12 horas',
    schedules: '08:00, 20:00',
    instructions: 'Tomar con las comidas principales para reducir molestias estomacales.',
    info: {
      recommendations: 'Mantener una hidratación adecuada y seguir un plan de alimentación saludable bajo en carbohidratos simples.',
      precautions: 'Evitar el consumo excesivo de alcohol (riesgo de acidosis láctica). Monitorear la función renal periódicamente.',
      sideEffects: 'Molestias estomacales, náuseas, diarrea (suelen disminuir con los días) o sabor metálico.'
    }
  },
  {
    name: 'Insulina Glargina',
    category: 'Diabetes',
    dose: '10 UI',
    frequency: 'Cada 24 horas',
    schedules: '22:00',
    instructions: 'Aplicar vía subcutánea en abdomen, muslo o brazo a la misma hora todos los días. Rotar el sitio de inyección.',
    info: {
      recommendations: 'Aprender la técnica correcta de inyección subcutánea y rotar siempre el sitio para evitar lipodistrofia. Mantener en uso a menos de 30°C.',
      precautions: 'Monitorear los niveles de glucosa en sangre frecuentemente. Llevar siempre una fuente de carbohidratos rápidos por si hay hipoglucemia.',
      sideEffects: 'Hipoglucemia (baja de azúcar), reacciones en el sitio de inyección, aumento de peso leve.'
    }
  },
  {
    name: 'Glibenclamida',
    category: 'Diabetes',
    dose: '5 mg',
    frequency: 'Cada 24 horas',
    schedules: '07:30',
    instructions: 'Tomar 30 minutos antes del desayuno. No saltarse comidas después de tomarla.',
    info: {
      recommendations: 'Es fundamental desayunar o comer inmediatamente después de tomar el medicamento para evitar hipoglucemias severas.',
      precautions: 'Alto riesgo de hipoglucemia. Evitar el consumo de alcohol y realizar actividad física moderada monitoreando síntomas de mareo.',
      sideEffects: 'Hipoglucemia, aumento de peso, náuseas o sarpullido cutáneo leve.'
    }
  },
  {
    name: 'Empagliflozina',
    category: 'Diabetes',
    dose: '10 mg',
    frequency: 'Cada 24 horas',
    schedules: '08:00',
    instructions: 'Tomar por la mañana, con o sin alimentos.',
    info: {
      recommendations: 'Aumentar la ingesta de agua durante el día para compensar la eliminación de líquidos por la orina y mantener una buena higiene genital.',
      precautions: 'Monitorear signos de deshidratación. Consultar al médico de inmediato ante síntomas de cetoacidosis (dolor abdominal, dificultad para respirar).',
      sideEffects: 'Infecciones urinarias o genitales, aumento de la frecuencia urinaria, sed o mareo.'
    }
  },
  {
    name: 'Sitagliptina',
    category: 'Diabetes',
    dose: '100 mg',
    frequency: 'Cada 24 horas',
    schedules: '09:00',
    instructions: 'Tomar a la misma hora todos los días, con o sin alimentos.',
    info: {
      recommendations: 'Ayuda a regular la insulina después de comer y es bien tolerado. No suele provocar hipoglucemias por sí solo.',
      precautions: 'Reportar al médico de inmediato si presenta dolor abdominal severo y persistente que se extienda a la espalda (signo de pancreatitis).',
      sideEffects: 'Dolor de cabeza, congestión nasal, dolor de garganta o molestias estomacales leves.'
    }
  },
  {
    name: 'Losartán',
    category: 'Hipertensión',
    dose: '50 mg',
    frequency: 'Cada 24 horas',
    schedules: '08:00',
    instructions: 'Tomar con o sin alimentos, preferentemente por la mañana.',
    info: {
      recommendations: 'Monitorear la presión arterial con regularidad en casa. Llevar una dieta baja en sodio (sal).',
      precautions: 'Evitar levantarse bruscamente de posiciones acostadas o sentadas para prevenir mareos. No usar suplementos de potasio sin indicación médica.',
      sideEffects: 'Mareo, fatiga, niveles elevados de potasio en sangre (hiperpotasemia) o dolor de cabeza.'
    }
  },
  {
    name: 'Enalapril',
    category: 'Hipertensión',
    dose: '10 mg',
    frequency: 'Cada 12 horas',
    schedules: '08:00, 20:00',
    instructions: 'Tomar con o sin alimentos, intentando mantener los mismos horarios.',
    info: {
      recommendations: 'La primera dosis puede causar mareo, por lo que se puede tomar al acostarse. Mantenerse hidratado.',
      precautions: 'Si presenta inflamación de cara, labios, lengua o garganta (angioedema), suspenda de inmediato y acuda a urgencias. Reportar tos persistente.',
      sideEffects: 'Tos seca persistente, mareo, fatiga, alteración del gusto o presión arterial baja.'
    }
  },
  {
    name: 'Amlodipino',
    category: 'Hipertensión',
    dose: '5 mg',
    frequency: 'Cada 24 horas',
    schedules: '08:00',
    instructions: 'Tomar con o sin alimentos, a la misma hora todos los días.',
    info: {
      recommendations: 'Ayuda a relajar los vasos sanguíneos. Evitar el consumo de jugo de toronja (pomelo), ya que puede elevar sus niveles en sangre.',
      precautions: 'Es común presentar hinchazón en tobillos o pies. Informe a su médico si esto ocurre o si nota palpitaciones.',
      sideEffects: 'Hinchazón de tobillos/pies (edema), enrojecimiento facial, dolor de cabeza, palpitaciones o fatiga.'
    }
  },
  {
    name: 'Metoprolol',
    category: 'Hipertensión',
    dose: '50 mg',
    frequency: 'Cada 12 horas',
    schedules: '08:00, 20:00',
    instructions: 'Tomar con o inmediatamente después de las comidas.',
    info: {
      recommendations: 'Ayuda a reducir el ritmo cardíaco y la presión arterial. Monitorear el pulso cardíaco regularmente.',
      precautions: 'No suspender el tratamiento de forma abrupta. Precaución si padece de asma o enfermedades pulmonares.',
      sideEffects: 'Cansancio, manos y pies fríos, ritmo cardíaco lento (bradicardia), mareos o pesadillas.'
    }
  },
  {
    name: 'Hidroclorotiazida',
    category: 'Hipertensión',
    dose: '12.5 mg',
    frequency: 'Cada 24 horas',
    schedules: '08:00',
    instructions: 'Tomar por la mañana para evitar tener que levantarse por la noche a orinar.',
    info: {
      recommendations: 'Al ser un diurético, aumentará la cantidad de orina. Mantenerse hidratado adecuadamente.',
      precautions: 'Puede alterar los niveles de electrolitos (potasio, sodio) o elevar el ácido úrico y glucosa. Usar bloqueador solar.',
      sideEffects: 'Deshidratación, calambres musculares (por bajo potasio), debilidad, mareo o aumento de micciones.'
    }
  }
]

export default function MedicationsPanel({ selectedFamilyId = null }) {
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  
  const emptyForm = { name: '', dose: '', frequency: '', instructions: '', schedules: [{ hour: '08', minute: '00', period: 'AM' }] }
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [selectedPredefinedIndex, setSelectedPredefinedIndex] = useState('-1')
  const [expandedInfoIds, setExpandedInfoIds] = useState({})

  const fetchMedications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (selectedFamilyId) {
        params.familyMemberId = selectedFamilyId
      }
      const { data } = await api.get('/medications', { params })
      setMedications(data.medications || [])
    } catch (err) {
      console.error('Error fetching medications:', err)
      setError('No se pudieron cargar los medicamentos. Intenta de nuevo.')
      setMedications([])
    } finally {
      setLoading(false)
    }
  }, [selectedFamilyId])

  useEffect(() => { fetchMedications() }, [fetchMedications])

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
        await api.put(`/medications/${editId}`, payload)
      } else {
        await api.post('/medications', payload)
      }
      
      setShowModal(false)
      setForm(emptyForm)
      setEditId(null)
      setSelectedPredefinedIndex('-1')
      fetchMedications()
    } catch (err) {
      console.error('Error saving medication:', err)
      const msg = err?.response?.data?.error || 'Error al guardar. Intenta de nuevo.'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar el medicamento ${name}?`)) return
    try {
      await api.delete(`/medications/${id}`)
      fetchMedications()
    } catch (err) {
      console.error('Error deleting medication:', err)
    }
  }

  const openEdit = (med) => {
    const idx = PREDEFINED_MEDICATIONS.findIndex(m => m.name.toLowerCase() === med.name.toLowerCase())
    setSelectedPredefinedIndex(idx.toString())
    setForm({
      name: med.name,
      dose: med.dose,
      frequency: med.frequency,
      instructions: med.instructions || '',
      schedules: parse24hTo12hList(med.schedules),
    })
    setEditId(med.id)
    setShowModal(true)
  }

  const handlePredefinedChange = (e) => {
    const val = e.target.value
    setSelectedPredefinedIndex(val)
    if (val !== '-1') {
      const med = PREDEFINED_MEDICATIONS[parseInt(val, 10)]
      setForm({
        name: med.name,
        dose: med.dose,
        frequency: med.frequency,
        schedules: parse24hTo12hList(med.schedules),
        instructions: med.instructions
      })
    } else {
      setForm(emptyForm)
    }
  }

  const toggleInfo = (id) => {
    setExpandedInfoIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const isFamily = selectedFamilyId !== null

  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: 'var(--radius-xl)',
      background: 'white',
      boxShadow: 'var(--shadow-card)',
      border: '1px solid var(--color-surface-200)',
      marginBottom: '2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FaPills style={{ color: 'white', fontSize: '1.1rem' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
              {isFamily ? 'Medicamentos del Familiar' : 'Mis Medicamentos'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-surface-500)' }}>
              Control de tratamiento y horarios
            </p>
          </div>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditId(null); setSelectedPredefinedIndex('-1'); setShowModal(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: '#10b981',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
            transition: 'all 0.2s',
          }}
        >
          <FaPlus size={12} /> Nuevo
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-surface-400)', textAlign: 'center', padding: '2rem 0' }}>Cargando medicamentos...</p>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#fef2f2', borderRadius: 'var(--radius-lg)', border: '1px solid #fecaca' }}>
          <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</p>
          <button onClick={fetchMedications} style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Reintentar</button>
        </div>
      ) : medications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--color-surface-50)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-surface-300)' }}>
          <p style={{ color: 'var(--color-surface-500)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {isFamily ? 'Este familiar no tiene medicamentos registrados actualmente.' : 'No tienes medicamentos registrados actualmente.'}
          </p>
          <button
            onClick={() => { setForm(emptyForm); setEditId(null); setSelectedPredefinedIndex('-1'); setShowModal(true) }}
            style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            {isFamily ? 'Añadir primer medicamento' : 'Añadir mi primer medicamento'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {medications.map(med => {
            const predefinedMatch = PREDEFINED_MEDICATIONS.find(m => m.name.toLowerCase() === med.name.toLowerCase())
            return (
              <div key={med.id} style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-surface-200)',
                background: 'var(--color-surface-50)',
                position: 'relative',
              }}>
                {/* Status active pip */}
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.35rem' }}>
                  <button onClick={() => openEdit(med)} style={{ background: 'var(--color-surface-100)', border: '1px solid var(--color-surface-200)', padding: '0.3rem', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-surface-500)' }} title="Editar">
                    <FaEdit size={12} />
                  </button>
                  <button onClick={() => handleDelete(med.id, med.name)} style={{ background: 'var(--color-surface-100)', border: '1px solid #fecaca', padding: '0.3rem', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }} title="Eliminar">
                    <FaTrash size={12} />
                  </button>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '0.2rem', paddingRight: '40px' }}>
                  {med.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600', marginBottom: '0.75rem' }}>
                  {med.dose} • {med.frequency}
                </p>

                {med.schedules?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {med.schedules.map((s, i) => (
                      <span key={i} style={{ padding: '0.2rem 0.5rem', background: '#10b98120', color: '#047857', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                        {formatTimeTo12h(s)}
                      </span>
                    ))}
                  </div>
                )}

                {med.instructions && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-surface-600)', fontStyle: 'italic', background: 'var(--color-surface-100)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-surface-300)' }}>
                    "{med.instructions}"
                  </p>
                )}

                {predefinedMatch && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-surface-200)' }}>
                    <button
                      onClick={() => toggleInfo(med.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'none',
                        border: 'none',
                        color: '#10b981',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <FaInfoCircle size={12} />
                      {expandedInfoIds[med.id] ? 'Ocultar Información' : 'Ver Ficha Informativa'}
                    </button>
                    
                    {expandedInfoIds[med.id] && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'var(--color-surface-100)',
                        border: '1px solid var(--color-surface-300)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        animation: 'fadeIn 0.2s',
                      }}>
                        <div>
                          <strong style={{ color: '#047857', display: 'block', marginBottom: '0.1rem' }}>Recomendaciones:</strong>
                          <span style={{ color: 'var(--color-surface-600)' }}>{predefinedMatch.info.recommendations}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#b45309', display: 'block', marginBottom: '0.1rem' }}>Cuidados:</strong>
                          <span style={{ color: 'var(--color-surface-600)' }}>{predefinedMatch.info.precautions}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '0.1rem' }}>Efectos secundarios:</strong>
                          <span style={{ color: 'var(--color-surface-600)' }}>{predefinedMatch.info.sideEffects}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
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
            background: 'white', width: '100%', maxWidth: '480px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            borderRadius: '24px', boxShadow: '0 25px 50px -12px rgb(0 0 0/0.25)',
            overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-surface-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
                {editId ? 'Editar Medicamento' : 'Nuevo Medicamento'}
              </h3>
              <button
                onClick={() => { setShowModal(false); setSelectedPredefinedIndex('-1'); setForm(emptyForm); setEditId(null); }}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: 'var(--color-surface-400)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {saveError && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: '500' }}>
                  ⚠️ {saveError}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                  Medicamento común (Opcional)
                </label>
                <select
                  value={selectedPredefinedIndex}
                  onChange={handlePredefinedChange}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)',
                    border: '2px solid var(--color-surface-200)', fontSize: '0.9rem', outline: 'none',
                    background: 'white', color: 'var(--color-surface-700)', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  <option value="-1">-- Seleccionar un medicamento común --</option>
                  <optgroup label="Diabetes">
                    {PREDEFINED_MEDICATIONS.map((med, idx) => med.category === 'Diabetes' && (
                      <option key={idx} value={idx}>{med.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Hipertensión">
                    {PREDEFINED_MEDICATIONS.map((med, idx) => med.category === 'Hipertensión' && (
                      <option key={idx} value={idx}>{med.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {selectedPredefinedIndex !== '-1' && (
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface-50)',
                  border: '1px solid var(--color-surface-200)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '0.8rem',
                  lineHeight: '1.4'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--color-surface-200)', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>
                    <FaInfoCircle style={{ color: '#10b981', flexShrink: 0 }} />
                    <span style={{ fontWeight: '700', color: 'var(--color-surface-900)' }}>
                      Ficha Informativa: {PREDEFINED_MEDICATIONS[parseInt(selectedPredefinedIndex, 10)].name}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#047857', display: 'block', fontSize: '0.75rem' }}>Recomendaciones de uso:</strong>
                    <span style={{ color: 'var(--color-surface-600)' }}>{PREDEFINED_MEDICATIONS[parseInt(selectedPredefinedIndex, 10)].info.recommendations}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#b45309', display: 'block', fontSize: '0.75rem' }}>Cuidados y precauciones:</strong>
                    <span style={{ color: 'var(--color-surface-600)' }}>{PREDEFINED_MEDICATIONS[parseInt(selectedPredefinedIndex, 10)].info.precautions}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#b91c1c', display: 'block', fontSize: '0.75rem' }}>Efectos secundarios comunes:</strong>
                    <span style={{ color: 'var(--color-surface-600)' }}>{PREDEFINED_MEDICATIONS[parseInt(selectedPredefinedIndex, 10)].info.sideEffects}</span>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>Nombre del medicamento *</label>
                <input
                  type="text" required placeholder="Ej: Metformina" value={form.name}
                  onChange={e => {
                    const newName = e.target.value
                    setForm(f => ({ ...f, name: newName }))
                    const idx = PREDEFINED_MEDICATIONS.findIndex(m => m.name.toLowerCase() === newName.trim().toLowerCase())
                    setSelectedPredefinedIndex(idx.toString())
                  }}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>Dosis *</label>
                  <input
                    type="text" required placeholder="Ej: 500mg" value={form.dose}
                    onChange={e => setForm(f => ({ ...f, dose: e.target.value }))}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>Frecuencia *</label>
                  <input
                    type="text" required placeholder="Ej: Cada 12 horas" value={form.frequency}
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
                  rows={2} placeholder="Ej: Tomar con alimentos" value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit" disabled={saving}
                style={{
                  marginTop: '0.5rem', padding: '0.875rem', borderRadius: 'var(--radius-lg)', border: 'none',
                  background: saving ? 'var(--color-surface-300)' : '#10b981', color: 'white', fontSize: '0.95rem', fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                {saving ? 'Guardando...' : (editId ? 'Actualizar' : 'Guardar Medicamento')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
