import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaSearch, FaFilter, FaExternalLinkAlt,
  FaMoneyBillWave, FaHandHoldingHeart, FaClinicMedical,
  FaLightbulb, FaCheckCircle, FaClipboardCheck, FaLock,
  FaTimes, FaUpload, FaSpinner,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// ── Constants ──────────────────────────────────────────────────
const PROGRAM_TYPES = [
  { key: '', label: 'Todos', icon: '📋' },
  { key: 'apoyo_economico', label: 'Apoyo Económico', icon: '💰' },
  { key: 'apoyo_especie', label: 'Apoyo en Especie', icon: '📦' },
  { key: 'atencion_medica', label: 'Atención Médica', icon: '🏥' },
  { key: 'orientacion', label: 'Orientación', icon: '💡' },
]

const TYPE_ICONS = {
  apoyo_economico: FaMoneyBillWave,
  apoyo_especie: FaHandHoldingHeart,
  atencion_medica: FaClinicMedical,
  orientacion: FaLightbulb,
}

const TYPE_LABELS = {
  apoyo_economico: 'Apoyo Económico',
  apoyo_especie: 'Apoyo en Especie',
  atencion_medica: 'Atención Médica',
  orientacion: 'Orientación',
}

const TYPE_COLORS = {
  apoyo_economico: '#16a34a',
  apoyo_especie: '#0369a1',
  atencion_medica: '#dc2626',
  orientacion: '#9333ea',
}

const STATUS_STYLES = {
  pending:  { bg: '#f59e0b18', color: '#d97706', label: 'Pendiente de aprobación' },
  approved: { bg: '#16a34a18', color: '#16a34a', label: 'Aprobado ✓' },
  rejected: { bg: '#dc262618', color: '#dc2626', label: 'No aprobado' },
  resubmit: { bg: '#ede9fe',   color: '#7c3aed', label: 'Reenvío solicitado' },
}

// ── Registration Modal ─────────────────────────────────────────
function EnrollmentModal({ program, onClose, onSuccess }) {
  const [formData, setFormData] = useState({})
  // pdfFiles: { [fieldIndex]: File } — one entry per field that requires a PDF
  const [pdfFiles, setPdfFiles] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const color = TYPE_COLORS[program.type] || '#871233'
  const fields = Array.isArray(program.formFields) ? program.formFields : []
  const hasAnyPdf = fields.some(f => f.requiresPdf)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Always use FormData so multer can handle multipart
      const fd = new FormData()
      fd.append('programId', program.id)
      fd.append('formData', JSON.stringify(formData))

      // Attach each PDF under its index-based field name: pdf_0, pdf_1 ...
      Object.entries(pdfFiles).forEach(([idx, file]) => {
        fd.append(`pdf_${idx}`, file)
      })

      await api.post('/enrollments', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', overflowY: 'auto',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'white', borderRadius: '20px', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: `3px solid ${color}`,
          background: `linear-gradient(135deg, ${color}08, ${color}02)`,
          borderRadius: '20px 20px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
        }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
              {TYPE_LABELS[program.type]}
            </p>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.3 }}>
              Solicitud de inscripción
            </h2>
            <p style={{ fontSize: '0.83rem', color: '#64748b', marginTop: '0.25rem' }}>{program.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem', padding: '0.2rem', flexShrink: 0 }}>
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Info notice */}
          <div style={{
            padding: '0.875rem 1rem', borderRadius: '10px',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            fontSize: '0.83rem', color: '#475569', lineHeight: 1.6,
          }}>
            📋 Tu solicitud quedará <strong>pendiente de revisión</strong> por el administrador.
            Recibirás una notificación con la respuesta.
          </div>

          {/* Dynamic fields — each can have its own PDF picker */}
          {fields.length > 0 ? fields.map((field, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Text / Select input */}
              <label style={{
                display: 'block', fontSize: '0.78rem', fontWeight: '700',
                color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {field.label}
                {(field.required || field.requiresPdf) && <span style={{ color: '#dc2626', marginLeft: '0.2rem' }}>*</span>}
              </label>
              {field.type === 'none' ? null : field.type === 'select' ? (
                <select
                  required={field.required}
                  value={formData[field.label] || ''}
                  onChange={e => setFormData(p => ({ ...p, [field.label]: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
                    border: '1.5px solid #e2e8f0', fontSize: '0.875rem',
                    outline: 'none', background: 'white', cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">— Selecciona una opción —</option>
                  {(field.options || []).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required={field.required && !field.requiresPdf}
                  placeholder={`Ingresa ${field.label.toLowerCase()}...`}
                  value={formData[field.label] || ''}
                  onChange={e => setFormData(p => ({ ...p, [field.label]: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
                    border: '1.5px solid #e2e8f0', fontSize: '0.875rem',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              )}

              {/* Per-field PDF picker */}
              {field.requiresPdf && (
                <div
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'application/pdf'
                    input.onchange = (ev) => {
                      const file = ev.target.files?.[0]
                      if (file) setPdfFiles(p => ({ ...p, [idx]: file }))
                    }
                    input.click()
                  }}
                  style={{
                    border: `2px dashed ${pdfFiles[idx] ? '#ea580c' : '#fed7aa'}`,
                    borderRadius: '8px', padding: '0.875rem', textAlign: 'center',
                    cursor: 'pointer',
                    background: pdfFiles[idx] ? '#fff7ed' : '#fffbf5',
                    transition: 'all 0.2s',
                  }}
                >
                  <FaUpload style={{ color: pdfFiles[idx] ? '#ea580c' : '#fb923c', fontSize: '1rem', marginBottom: '0.3rem' }} />
                  <p style={{ fontSize: '0.8rem', color: pdfFiles[idx] ? '#c2410c' : '#9a3412', fontWeight: pdfFiles[idx] ? '600' : '400' }}>
                    {pdfFiles[idx] ? `✓ ${pdfFiles[idx].name}` : '📎 Adjuntar PDF para este campo (máx. 10 MB)'}
                  </p>
                </div>
              )}
            </div>
          )) : (
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem 0' }}>
              Este programa no requiere información adicional para registrarse.
            </p>
          )}

          {hasAnyPdf && (
            <div style={{
              padding: '0.6rem 0.875rem', borderRadius: '8px',
              background: '#fff7ed', border: '1px solid #fed7aa',
              fontSize: '0.78rem', color: '#92400e',
            }}>
              📎 Los campos marcados con <strong>PDF</strong> requieren adjuntar un documento para completar tu solicitud.
            </div>
          )}

          {error && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '8px',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '0.75rem', borderRadius: '10px',
              border: '1.5px solid #e2e8f0', background: 'white',
              color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem',
            }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} style={{
              flex: 2, padding: '0.75rem', borderRadius: '10px', border: 'none',
              background: submitting ? '#94a3b8' : color,
              color: 'white', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.5rem',
            }}>
              {submitting ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : '✉ Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Programs Page ─────────────────────────────────────────
export default function Programs() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [enrollmentMap, setEnrollmentMap] = useState({})  // { programId: enrollment }
  const [enrollModal, setEnrollModal] = useState(null)    // program being enrolled in
  const [successMsg, setSuccessMsg] = useState('')

  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (type) params.type = type
      if (search) params.search = search
      const res = await api.get('/programs', { params })
      setPrograms(res.data.programs)
    } catch (err) {
      console.error('Error fetching programs:', err)
    } finally {
      setLoading(false)
    }
  }, [search, type])

  // Fetch user's existing enrollments so we can mark "ya inscrito"
  const fetchMyEnrollments = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await api.get('/enrollments/my')
      const map = {}
      res.data.enrollments.forEach(e => { map[e.programId] = e })
      setEnrollmentMap(map)
    } catch (err) {
      console.error('Error fetching enrollments:', err)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const timer = setTimeout(fetchPrograms, 300)
    return () => clearTimeout(timer)
  }, [fetchPrograms])

  useEffect(() => {
    fetchMyEnrollments()
  }, [fetchMyEnrollments])

  const handleRegisterClick = (program) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/programas' } })
      return
    }
    setEnrollModal(program)
  }

  const handleEnrollSuccess = () => {
    setEnrollModal(null)
    const isResubmit = enrollModal && enrollmentMap[enrollModal.id]?.status === 'resubmit'
    setSuccessMsg(
      isResubmit
        ? '↺ Solicitud reenviada. Espera la revisión del administrador. 📬'
        : '¡Solicitud enviada! Tu inscripción está pendiente de aprobación. 🎉'
    )
    fetchMyEnrollments()
    setTimeout(() => setSuccessMsg(''), 6000)
  }

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Success toast */}
      {successMsg && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '1rem 1.25rem', borderRadius: '14px', background: '#10b981',
          color: 'white', fontWeight: '600', fontSize: '0.875rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          maxWidth: '380px', lineHeight: 1.5,
        }}>
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>
          Programas Sociales
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-surface-500)', maxWidth: '600px' }}>
          Catálogo de programas de apoyo disponibles para jóvenes de 18 a 29 años con enfermedades crónicas en Tamaulipas.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        padding: '1.25rem',
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-surface-200)',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <FaSearch style={{
            position: 'absolute', left: '0.875rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--color-surface-400)', fontSize: '0.85rem',
          }} />
          <input
            id="program-search"
            type="text"
            placeholder="Buscar programa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.7rem 1rem 0.7rem 2.4rem',
              borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)',
              fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <FaFilter style={{ color: 'var(--color-surface-400)', fontSize: '0.85rem' }} />
          {PROGRAM_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              style={{
                padding: '0.5rem 0.875rem', borderRadius: '2rem',
                border: `2px solid ${type === t.key ? 'var(--color-primary-500)' : 'var(--color-surface-200)'}`,
                background: type === t.key ? 'var(--color-primary-500)' : 'white',
                color: type === t.key ? 'white' : 'var(--color-surface-600)',
                fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Programs List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: '120px', borderRadius: 'var(--radius-xl)',
              background: 'var(--color-surface-100)',
            }} />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-surface-500)' }}>
          <p style={{ fontSize: '3rem' }}>📋</p>
          <p style={{ fontSize: '1.1rem', marginTop: '1rem' }}>No se encontraron programas con esos criterios.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {programs.map(program => {
            const TypeIcon = TYPE_ICONS[program.type] || FaHandHoldingHeart
            const color = TYPE_COLORS[program.type] || '#871233'
            const isExpanded = expanded === program.id
            const requirements = Array.isArray(program.requirements)
              ? program.requirements
              : (program.requirements ? JSON.parse(program.requirements) : [])
            const targetDiseases = Array.isArray(program.targetDiseases)
              ? program.targetDiseases
              : (program.targetDiseases ? JSON.parse(program.targetDiseases) : [])
            const enrollment = enrollmentMap[program.id]
            const enrollStatus = enrollment?.status

            return (
              <div
                key={program.id}
                className="animate-fade-in-up"
                style={{
                  borderRadius: 'var(--radius-xl)',
                  background: 'white',
                  boxShadow: 'var(--shadow-card)',
                  border: `1px solid ${isExpanded ? color + '40' : 'var(--color-surface-200)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Card Header */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : program.id)}
                  style={{
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: 'var(--radius-lg)',
                      background: color + '15',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <TypeIcon style={{ color, fontSize: '1.1rem' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                          {program.name}
                        </h2>
                        <span style={{
                          padding: '0.15rem 0.6rem', borderRadius: '2rem',
                          background: color + '15', color, fontSize: '0.72rem', fontWeight: '700',
                          textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}>
                          {TYPE_LABELS[program.type]}
                        </span>
                        {program.amount && (
                          <span style={{
                            padding: '0.15rem 0.6rem', borderRadius: '2rem',
                            background: '#16a34a15', color: '#16a34a',
                            fontSize: '0.72rem', fontWeight: '700',
                          }}>
                            {program.amount}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-surface-500)', lineHeight: 1.5, margin: 0 }}>
                        {program.responsibleInstitution}
                      </p>
                    </div>
                  </div>

                  {/* Register button — always visible in header */}
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}
                  >
                    {enrollStatus && enrollStatus !== 'resubmit' ? (
                      // Enrolled and NOT in resubmit state — show static chip
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.45rem 1rem', borderRadius: '2rem',
                        background: STATUS_STYLES[enrollStatus]?.bg,
                        color: STATUS_STYLES[enrollStatus]?.color,
                        fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap',
                        border: `1px solid ${STATUS_STYLES[enrollStatus]?.color}30`,
                      }}>
                        <FaClipboardCheck size={11} />
                        {STATUS_STYLES[enrollStatus]?.label}
                      </span>
                    ) : enrollStatus === 'resubmit' ? (
                      // Admin requested resubmission — show active button in purple
                      <button
                        id={`btn-resubmit-${program.id}`}
                        onClick={() => handleRegisterClick(program)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.55rem 1.1rem', borderRadius: '2rem',
                          border: '2px solid #7c3aed',
                          background: '#7c3aed', color: 'white',
                          fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                          whiteSpace: 'nowrap', animation: 'pulse-purple 2s infinite',
                        }}
                      >
                        ↺ Reenviar solicitud
                      </button>
                    ) : (
                      // Not enrolled — show register button
                      <button
                        id={`btn-register-${program.id}`}
                        onClick={() => handleRegisterClick(program)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.55rem 1.1rem', borderRadius: '2rem',
                          border: `2px solid ${color}`,
                          background: 'white', color,
                          fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                          whiteSpace: 'nowrap', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = color
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'white'
                          e.currentTarget.style.color = color
                        }}
                      >
                        {isAuthenticated ? <FaClipboardCheck size={11} /> : <FaLock size={11} />}
                        Registrarse
                      </button>
                    )}
                    <div style={{
                      color: 'var(--color-surface-400)', fontSize: '1.2rem',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                      flexShrink: 0,
                    }}>
                      ▾
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{
                    padding: '0 1.5rem 1.5rem',
                    borderTop: `1px solid ${color}20`,
                    paddingTop: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}>
                    {/* Objective */}
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                        Objetivo
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-surface-600)', lineHeight: 1.7 }}>
                        {program.objective}
                      </p>
                    </div>

                    {/* Benefits */}
                    {program.benefits && (
                      <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                          Beneficios
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-surface-600)', lineHeight: 1.7 }}>
                          {program.benefits}
                        </p>
                      </div>
                    )}

                    {/* Requirements */}
                    {requirements.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-surface-700)', marginBottom: '0.5rem' }}>
                          Requisitos
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {requirements.map((req, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-surface-700)' }}>
                              <FaCheckCircle style={{ color, flexShrink: 0, marginTop: '0.15rem', fontSize: '0.8rem' }} />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* PDF required notice */}
                    {program.requiresDocument && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.65rem 1rem', borderRadius: '8px',
                        background: '#fffbeb', border: '1px solid #fde68a',
                        fontSize: '0.83rem', color: '#92400e',
                      }}>
                        <FaUpload size={12} />
                        Este programa requiere adjuntar un <strong>documento PDF</strong> al registrarse.
                      </div>
                    )}

                    {/* Target diseases notice */}
                    {!targetDiseases.includes('todas') && (
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        background: color + '10',
                        border: `1px solid ${color}25`,
                      }}>
                        <p style={{ fontSize: '0.84rem', color: 'var(--color-surface-600)' }}>
                          <strong>Diagnósticos elegibles:</strong> {targetDiseases.join(', ')}
                          {!isAuthenticated && ' — Inicia sesión para verificar tu elegibilidad.'}
                        </p>
                      </div>
                    )}

                    {/* Application Process */}
                    {program.applicationProcess && (
                      <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                          Proceso de solicitud
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-surface-600)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                          {program.applicationProcess}
                        </p>
                      </div>
                    )}

                    {/* Contact */}
                    {program.contactInfo && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-surface-50)',
                        border: '1px solid var(--color-surface-200)',
                        fontSize: '0.85rem',
                      }}>
                        <FaExternalLinkAlt style={{ color: 'var(--color-surface-400)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--color-surface-600)' }}>
                          <strong>Contacto:</strong> {program.contactInfo}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Enrollment modal */}
      {enrollModal && (
        <EnrollmentModal
          program={enrollModal}
          onClose={() => setEnrollModal(null)}
          onSuccess={handleEnrollSuccess}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-purple {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(124,58,237,0); }
        }
      `}</style>
    </div>
  )
}
