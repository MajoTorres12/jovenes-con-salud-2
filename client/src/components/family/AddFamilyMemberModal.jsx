import { useState, useEffect } from 'react'
import { FaTimes, FaUser, FaUserFriends, FaCalendar, FaMapMarkerAlt, FaFileMedical, FaStickyNote } from 'react-icons/fa'

const RELATIONSHIP_OPTIONS = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'hermano', label: 'Hermano' },
  { value: 'hermana', label: 'Hermana' },
  { value: 'hijo', label: 'Hijo' },
  { value: 'hija', label: 'Hija' },
  { value: 'abuelo', label: 'Abuelo' },
  { value: 'abuela', label: 'Abuela' },
  { value: 'tio', label: 'Tío' },
  { value: 'tia', label: 'Tía' },
  { value: 'otro', label: 'Otro' },
]

const GENDER_OPTIONS = [
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'no_binario', label: 'No Binario' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decir' },
]

export default function AddFamilyMemberModal({ isOpen, onClose, onSave, member }) {
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'otro',
    birthDate: '',
    gender: 'prefiero_no_decir',
    municipality: '',
    diagnosis: '',
    notes: '',
    curp: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        relationship: member.relationship || 'otro',
        birthDate: member.birthDate ? member.birthDate.slice(0, 10) : '',
        gender: member.gender || 'prefiero_no_decir',
        municipality: member.municipality || '',
        diagnosis: member.diagnosis || '',
        notes: member.notes || '',
        curp: member.curp || '',
      })
    } else {
      setFormData({
        name: '',
        relationship: 'otro',
        birthDate: '',
        gender: 'prefiero_no_decir',
        municipality: '',
        diagnosis: '',
        notes: '',
        curp: '',
      })
    }
    setError('')
  }, [member, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    const finalValue = name === 'curp' ? value.toUpperCase() : value
    setFormData((prev) => ({ ...prev, [name]: finalValue }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/i
    if (!formData.curp || !curpRegex.test(formData.curp)) {
      setError('La CURP es requerida y debe tener exactamente 18 caracteres en el formato oficial mexicano (ej. HEMT950820HDFLNS01).')
      setLoading(false)
      return
    }

    try {
      await onSave(formData, member?.id)
      onClose()
    } catch (err) {
      console.error('Error saving family member:', err)
      setError(err.response?.data?.error || 'Error al guardar el familiar. Revisa los datos.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: 'var(--radius-lg)',
    border: '2px solid var(--color-surface-200)',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'white',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--color-surface-700)',
    marginBottom: '0.35rem',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(0, 0, 0, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1.25rem',
        padding: '1.5rem 1.75rem',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-elevated)',
        border: '1px solid var(--color-surface-200)',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
            {member ? 'Editar Familiar' : 'Agregar Familiar'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-surface-400)',
              fontSize: '1.2rem',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary-500)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-surface-400)'}
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: 'var(--radius-lg)',
            background: '#ef444415',
            color: '#dc2626',
            fontSize: '0.8rem',
            fontWeight: '600',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={labelStyle}><FaUser size={11} /> Nombre Completo</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}><FaUser size={11} /> CURP (Obligatorio)</label>
            <input
              type="text"
              name="curp"
              required
              maxLength={18}
              value={formData.curp}
              onChange={handleChange}
              placeholder="Ej: HEMT950820HDFLNS01"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}><FaUserFriends size={11} /> Parentesco</label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                style={inputStyle}
              >
                {RELATIONSHIP_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}><FaCalendar size={11} /> Nacimiento</label>
              <input
                type="date"
                name="birthDate"
                required
                value={formData.birthDate}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Género</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={inputStyle}
              >
                {GENDER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}><FaMapMarkerAlt size={11} /> Municipio</label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
                placeholder="Ej: Cd. Victoria"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}><FaFileMedical size={11} /> Diagnóstico Médico</label>
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              placeholder="Ej: Diabetes Tipo 2 (Opcional)"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}><FaStickyNote size={11} /> Notas / Observaciones</label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observaciones de salud relevantes..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--color-surface-200)',
                background: 'white',
                color: 'var(--color-surface-600)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
