import { useState, useEffect, useCallback } from 'react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import {
  FaWeight, FaTint, FaHeartbeat, FaRunning, FaPlus, FaTimes,
  FaVial, FaFlask, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa'
import api from '../../services/api'
import {
  calcBMI, getBMICategory, getGlucoseCategory, getHeartRateCategory, getBloodPressureCategory,
  getCholesterolCategory, getTriglyceridesCategory,
} from '../../utils/bmiUtils'

const TYPES = [
  { key: 'weight', label: 'Peso', icon: FaWeight, unit: 'kg', color: 'var(--color-metric-weight)', gradient: ['var(--color-metric-weight-grad-0)', 'var(--color-metric-weight-grad-1)'] },
  { key: 'glucose', label: 'Glucosa', icon: FaTint, unit: 'mg/dL', color: 'var(--color-metric-glucose)', gradient: ['var(--color-metric-glucose-grad-0)', 'var(--color-metric-glucose-grad-1)'] },
  { key: 'bloodPressure', label: 'P. Arterial', icon: FaHeartbeat, unit: 'mmHg', color: 'var(--color-metric-bloodPressure)', gradient: ['var(--color-metric-bloodPressure-grad-0)', 'var(--color-metric-bloodPressure-grad-1)'] },
  { key: 'heartRate', label: 'F. Cardíaca', icon: FaRunning, unit: 'bpm', color: 'var(--color-metric-heartRate)', gradient: ['var(--color-metric-heartRate-grad-0)', 'var(--color-metric-heartRate-grad-1)'] },
  { key: 'cholesterol', label: 'Colesterol', icon: FaVial, unit: 'mg/dL', color: 'var(--color-metric-cholesterol)', gradient: ['var(--color-metric-cholesterol-grad-0)', 'var(--color-metric-cholesterol-grad-1)'] },
  { key: 'triglycerides', label: 'Triglicéridos', icon: FaFlask, unit: 'mg/dL', color: 'var(--color-metric-triglycerides)', gradient: ['var(--color-metric-triglycerides-grad-0)', 'var(--color-metric-triglycerides-grad-1)'] },
]

export default function FamilyHealthTab({ memberId }) {
  const [stats, setStats] = useState(null)
  const [records, setRecords] = useState([])
  const [activeType, setActiveType] = useState('weight')
  const [startIndex, setStartIndex] = useState(0)

  // Auto-focus active type in carousel
  useEffect(() => {
    const idx = TYPES.findIndex(t => t.key === activeType)
    if (idx !== -1) {
      setStartIndex(prev => {
        if (idx < prev) {
          return idx
        } else if (idx >= prev + 4) {
          return idx - 3
        }
        return prev
      })
    }
  }, [activeType])

  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    type: 'weight', value: '', value2: '', heightCm: '', notes: '',
    recordedAt: new Date().toISOString().slice(0, 16),
  })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!memberId) return
    try {
      const [statsRes, recordsRes] = await Promise.all([
        api.get(`/family/${memberId}/health/stats`),
        api.get(`/family/${memberId}/health`, { params: { limit: 100 } }),
      ])
      setStats(statsRes.data)
      setRecords(recordsRes.data.records || [])
    } catch (err) {
      console.error('Error fetching family health:', err)
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => { setLoading(true); fetchData() }, [fetchData])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/family/${memberId}/health`, {
        type: formData.type,
        value: parseFloat(formData.value),
        value2: formData.type === 'bloodPressure'
          ? parseFloat(formData.value2)
          : formData.type === 'weight' && formData.heightCm
            ? parseFloat(formData.heightCm)
            : undefined,
        notes: formData.notes || undefined,
        recordedAt: formData.recordedAt,
      })
      // ── Persist height in localStorage ──────────────────────────────
      if (formData.type === 'weight' && formData.heightCm) {
        localStorage.setItem(`bmi_height_family_${memberId}`, formData.heightCm)
      }
      setShowModal(false)
      setFormData({ type: 'weight', value: '', value2: '', heightCm: '', notes: '', recordedAt: new Date().toISOString().slice(0, 16) })
      fetchData()
    } catch (err) {
      console.error('Error saving:', err)
      alert(err.response?.data?.error || 'Error al guardar el registro')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (recordId) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      await api.delete(`/family/${memberId}/health/${recordId}`)
      fetchData()
    } catch { alert('Error al eliminar') }
  }

  const chartData = [...records]
    .filter(r => r.type === activeType)
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .map(r => ({
      date: new Date(r.recordedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      value: r.value, value2: r.value2,
    }))

  const activeTypeInfo = TYPES.find(t => t.key === activeType)

  const formatLatest = (record) => {
    if (!record) return '—'
    return record.type === 'bloodPressure' ? `${record.value}/${record.value2}` : `${record.value}`
  }

  // ── Saved height for auto-fill ────────────────────────────────
  // Priority: 1) latest weight record value2 (API)  2) localStorage
  const savedHeight =
    (stats?.latest?.weight?.value2 ? String(stats.latest.weight.value2) : '') ||
    localStorage.getItem(`bmi_height_family_${memberId}`) ||
    ''

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div>
      {/* Summary cards Carousel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        width: '100%',
      }}>
        {/* Navigation Left Chevron */}
        <button
          onClick={() => setStartIndex(prev => Math.max(0, prev - 1))}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1.5px solid #f1f5f9',
            background: 'white',
            color: '#64748b',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
            visibility: startIndex > 0 ? 'visible' : 'hidden',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#871233' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b' }}
        >
          <FaChevronLeft size={14} />
        </button>

        {/* Carousel Grid showing 4 cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          flex: 1,
          minWidth: 0,
        }}>
          {TYPES.slice(startIndex, startIndex + 4).map(t => {
            const latest = stats?.latest?.[t.key]

            // ── BMI for weight card ──────────────────────
            const heightForBMI = t.key === 'weight'
              ? (latest?.value2 || localStorage.getItem(`bmi_height_family_${memberId}`))
              : null
            const bmi = t.key === 'weight' && latest?.value && heightForBMI
              ? calcBMI(latest.value, heightForBMI)
              : null
            const bmiCat = getBMICategory(bmi)

            // ── Indicator badge for other metrics ────────
            const glucoseCat       = t.key === 'glucose'       ? getGlucoseCategory(latest?.value)                            : null
            const heartRateCat     = t.key === 'heartRate'     ? getHeartRateCategory(latest?.value)                         : null
            const bpCat            = t.key === 'bloodPressure' ? getBloodPressureCategory(latest?.value, latest?.value2)     : null
            const cholesterolCat   = t.key === 'cholesterol'   ? getCholesterolCategory(latest?.value)                       : null
            const triglyceridesCat = t.key === 'triglycerides' ? getTriglyceridesCategory(latest?.value)                   : null

            // The active indicator badge for this card (whichever applies)
            const indicatorCat  = bmiCat || glucoseCat || heartRateCat || bpCat || cholesterolCat || triglyceridesCat
            const indicatorLabel = bmiCat
              ? `IMC ${bmi} — ${bmiCat.label}`
              : glucoseCat
                ? glucoseCat.label
                : heartRateCat
                  ? heartRateCat.label
                  : bpCat
                    ? bpCat.label
                    : cholesterolCat
                      ? cholesterolCat.label
                      : triglyceridesCat
                        ? triglyceridesCat.label
                        : null
            const indicatorDescription = indicatorCat?.description || null

            return (
              <div key={t.key} onClick={() => setActiveType(t.key)} style={{
                padding: '1rem', borderRadius: '14px', background: 'white',
                boxShadow: activeType === t.key ? `0 0 0 2px ${t.color}, 0 4px 12px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: `linear-gradient(90deg, ${t.gradient[0]}, ${t.gradient[1]})`,
                  opacity: activeType === t.key ? 1 : 0, transition: 'opacity 0.3s',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{t.label}</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b' }}>
                      {formatLatest(latest)}
                      <span style={{ fontSize: '0.7rem', fontWeight: '500', color: '#94a3b8', marginLeft: '0.2rem' }}>{latest ? t.unit : ''}</span>
                    </p>
                    {/* Health indicator badge — shown for all metrics when data exists */}
                    {latest && indicatorCat && indicatorLabel && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                          padding: '0.15rem 0.55rem', borderRadius: '2rem',
                          background: indicatorCat.bg, color: indicatorCat.color,
                          border: `1px solid ${indicatorCat.border}`,
                          fontSize: '0.68rem', fontWeight: '700',
                        }}>
                          <span style={{ fontSize: '0.62rem' }}>{indicatorCat.emoji}</span>
                          {indicatorLabel}
                        </span>
                        {indicatorDescription && (
                          <span style={{ fontSize: '#64748b', fontStyle: 'italic', fontSize: '0.65rem' }}>
                            {indicatorDescription}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px', background: `${t.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <t.icon style={{ fontSize: '0.9rem', color: t.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation Right Chevron */}
        <button
          onClick={() => setStartIndex(prev => Math.min(TYPES.length - 4, prev + 1))}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1.5px solid #f1f5f9',
            background: 'white',
            color: '#64748b',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
            visibility: startIndex < TYPES.length - 4 ? 'visible' : 'hidden',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#871233' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b' }}
        >
          <FaChevronRight size={14} />
        </button>
      </div>

      {/* Chart */}
      <div style={{
        padding: '1.25rem', borderRadius: '16px', background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
            Evolución — {activeTypeInfo.label}
          </h3>
          <button onClick={() => {
            const hcm = activeType === 'weight' ? savedHeight : ''
            setFormData(f => ({ ...f, type: activeType, heightCm: hcm }))
            setShowModal(true)
          }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
              background: `linear-gradient(135deg, ${activeTypeInfo.gradient[0]}, ${activeTypeInfo.gradient[1]})`,
              color: 'white', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
              boxShadow: `0 2px 8px ${activeTypeInfo.color}40`,
            }}>
            <FaPlus size={10} /> Nuevo
          </button>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id={`fg-${activeType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeTypeInfo.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={activeTypeInfo.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.82rem' }} />
              <Area type="monotone" dataKey="value" stroke={activeTypeInfo.color} strokeWidth={2.5}
                fill={`url(#fg-${activeType})`} dot={{ fill: activeTypeInfo.color, r: 3 }}
                name={activeTypeInfo.label} />
              {activeType === 'bloodPressure' && (
                <Area type="monotone" dataKey="value2" stroke="#f87171" strokeWidth={2}
                  fill="none" dot={{ fill: '#f87171', r: 2 }} name="Diastólica" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '0.5rem' }}>
            <activeTypeInfo.icon style={{ fontSize: '2rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.88rem' }}>Sin registros de {activeTypeInfo.label.toLowerCase()}</p>
          </div>
        )}
      </div>

      {/* Recent records table */}
      {records.filter(r => r.type === activeType).length > 0 && (
        <div style={{ borderRadius: '14px', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid var(--color-surface-200)', overflow: 'hidden' }}>
          <div style={{
            padding: '0.75rem 1rem', borderBottom: `3px solid ${activeTypeInfo.color}`,
            background: `${activeTypeInfo.color}08`, display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <activeTypeInfo.icon style={{ color: activeTypeInfo.color, fontSize: '0.9rem' }} />
            <span style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--color-surface-800)' }}>{activeTypeInfo.label}</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>({activeTypeInfo.unit})</span>
          </div>
          {records.filter(r => r.type === activeType).slice(0, 10).map((r, i) => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.6rem 1rem', background: i % 2 === 0 ? 'var(--color-table-row-even)' : 'var(--color-table-row-odd)',
              borderBottom: '1px solid var(--color-surface-200)',
            }}>
              <div style={{ flex: '0 0 120px' }}>
                <p style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>
                  {new Date(r.recordedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div style={{ flex: '0 0 80px' }}>
                <span style={{ fontWeight: '800', color: activeTypeInfo.color, fontSize: '1rem' }}>
                  {r.type === 'bloodPressure' ? `${r.value}/${r.value2}` : r.value}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.2rem' }}>{activeTypeInfo.unit}</span>
              </div>
              <p style={{ flex: 1, fontSize: '0.78rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.notes || <span style={{ color: '#cbd5e1' }}>Sin notas</span>}
              </p>
              <button onClick={() => handleDelete(r.id)} title="Eliminar"
                style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #fecaca', background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add record modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '18px', width: '90%', maxWidth: '440px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>Nuevo Registro de Salud</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><FaTimes /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Tipo</label>
                <select value={formData.type} onChange={e => {
                  const newType = e.target.value
                  const hcm = newType === 'weight' ? (formData.heightCm || savedHeight) : formData.heightCm
                  setFormData(f => ({ ...f, type: newType, heightCm: hcm }))
                }}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', background: '#f8fafc' }}>
                  {TYPES.map(t => <option key={t.key} value={t.key}>{t.label} ({t.unit})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: formData.type === 'bloodPressure' ? '1fr 1fr' : formData.type === 'weight' ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    {formData.type === 'bloodPressure' ? 'Sistólica' : 'Valor'}
                  </label>
                  <input type="number" step="0.1" required value={formData.value}
                    onChange={e => setFormData(f => ({ ...f, value: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', background: '#f8fafc', boxSizing: 'border-box' }} />
                </div>
                {formData.type === 'bloodPressure' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Diastólica</label>
                    <input type="number" step="0.1" required value={formData.value2}
                      onChange={e => setFormData(f => ({ ...f, value2: e.target.value }))}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', background: '#f8fafc', boxSizing: 'border-box' }} />
                  </div>
                )}
                {formData.type === 'weight' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Altura (cm)</label>
                    <input type="number" step="1" min="50" max="250" placeholder="Ej: 170" value={formData.heightCm}
                      onChange={e => setFormData(f => ({ ...f, heightCm: e.target.value }))}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', background: '#f8fafc', boxSizing: 'border-box' }} />
                    {savedHeight && formData.heightCm === savedHeight && (
                      <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Guardada: {savedHeight} cm — modifica solo si cambió
                      </p>
                    )}
                  </div>
                )}
              </div>
              {/* Live BMI preview removed — IMC se muestra en la tarjeta de peso */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Fecha y hora</label>
                <input type="datetime-local" value={formData.recordedAt}
                  onChange={e => setFormData(f => ({ ...f, recordedAt: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', background: '#f8fafc', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Notas</label>
                <textarea value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones opcionales"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', background: '#f8fafc', minHeight: '50px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={saving} style={{
                padding: '0.65rem', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #871233, #4e0413)',
                color: 'white', fontSize: '0.88rem', fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Guardando...' : 'Guardar Registro'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
