import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import { generatePrescriptionPdf } from '../utils/prescriptionPdf'
import {
  FaCalendarAlt, FaClock, FaVideo, FaFilePrescription, FaArrowLeft,
  FaUserMd, FaExclamationCircle, FaCheckCircle, FaTrashAlt, FaLink,
  FaCopy, FaDownload, FaClipboardCheck
} from 'react-icons/fa'

export default function VirtualAppointments() {
  const { user } = useAuth()
  const { dark } = useTheme()
  const navigate = useNavigate()

  // State
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [reason, setReason] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [availableSlotsData, setAvailableSlotsData] = useState({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Navigation tabs
  const [activeView, setActiveView] = useState('appointments') // 'appointments' or 'prescriptions'
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [copiedApptId, setCopiedApptId] = useState(null)

  // Fetch all user appointments
  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/appointments')
      setAppointments(res.data.appointments)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError(err.response?.data?.error || 'Error al cargar las citas.')
    }
  }, [])

  // Fetch available slots for the doctor
  const fetchAvailableSlots = useCallback(async () => {
    if (!user?.doctorId) return
    setLoadingSlots(true)
    try {
      const res = await api.get('/appointments/available-slots')
      setAvailableSlotsData(res.data.availableSlots || {})
    } catch (err) {
      console.error('Error fetching slots:', err)
    } finally {
      setLoadingSlots(false)
    }
  }, [user])

  // Fetch doctor data
  const fetchDoctorInfo = useCallback(async () => {
    if (!user?.doctorId) return
    try {
      const res = await api.get(`/doctor/patients/${user.id}/records`)
      setDoctorInfo(res.data.patient?.doctor || null)
    } catch (err) {
      // Fallback: list all doctors to match or extract
      try {
        const res = await api.get('/auth/me')
        setDoctorInfo(res.data.user?.doctor || null)
      } catch (e) {
        console.error('Error fetching doctor details:', e)
      }
    }
  }, [user])

  // Fetch all prescriptions
  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await api.get('/appointments')
      // Fetch prescriptions for each completed appointment or list from backend if we had bulk endpoint
      // To simplify, we extract prescription objects if they are returned or fetch separately.
      // We will also allow querying prescription by checking complete appointments.
      const completedAppointments = res.data.appointments.filter(a => a.status === 'completed')
      
      const prescriptionList = []
      for (const appt of completedAppointments) {
        try {
          const presRes = await api.get(`/appointments/${appt.id}/prescription`)
          if (presRes.data.prescription) {
            prescriptionList.push(presRes.data.prescription)
          }
        } catch (e) {
          // No prescription generated yet for this completed appointment
        }
      }
      setPrescriptions(prescriptionList)
    } catch (err) {
      console.error('Error fetching prescriptions:', err)
    }
  }, [])

  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (!user?.doctorId) {
        setLoading(false)
        return
      }
      await Promise.all([
        fetchAppointments(),
        fetchDoctorInfo(),
        fetchAvailableSlots(),
        fetchPrescriptions()
      ])
    } catch (err) {
      console.error('Error loading page data:', err)
    } finally {
      setLoading(false)
    }
  }, [user, fetchAppointments, fetchDoctorInfo, fetchAvailableSlots, fetchPrescriptions])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Submit appointment request
  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime || !reason) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/appointments', {
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason,
        symptoms
      })
      setSuccess('¡Solicitud de cita enviada correctamente! Tu médico la revisará pronto.')
      setSelectedDate('')
      setSelectedTime('')
      setReason('')
      setSymptoms('')
      setShowRequestForm(false)
      // Reload
      await fetchAppointments()
      await fetchAvailableSlots()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud.')
    } finally {
      setActionLoading(false)
    }
  }

  // Cancel appointment
  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta solicitud de cita?')) return
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.put(`/appointments/${apptId}/cancel`)
      setSuccess('Cita cancelada con éxito.')
      await fetchAppointments()
      await fetchAvailableSlots()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cancelar la cita.')
    } finally {
      setActionLoading(false)
    }
  }

  // Calculate age utility
  const getPatientAge = () => {
    if (!user?.birthDate) return ''
    const today = new Date()
    const birthDate = new Date(user.birthDate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Download prescription PDF
  const handleDownloadPrescription = async (pres) => {
    try {
      await generatePrescriptionPdf(pres, user.name, getPatientAge())
    } catch (err) {
      alert('Error al generar el PDF de la receta.')
    }
  }

  // Copy code utility
  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedApptId(id)
    setTimeout(() => setCopiedApptId(null), 2000)
  }

  // Date formatting options
  const formatDateString = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: 'var(--color-primary-500)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="animate-spin" style={{ width: '3rem', height: '3rem', border: '4px solid var(--color-surface-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%' }} />
          <p style={{ fontWeight: '600' }}>Cargando agenda de citas virtuales...</p>
        </div>
      </div>
    )
  }

  if (!user?.doctorId) {
    return (
      <div className="disease-detail-wrapper" style={{ padding: '2rem 1.5rem' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-500)', textDecoration: 'none', fontWeight: '700', marginBottom: '2rem' }}>
          <FaArrowLeft /> Volver a Mi Salud
        </Link>
        <div className="glass" style={{ padding: '3rem 2rem', borderRadius: 'var(--radius-2xl)', textAlign: 'center', border: '1px solid var(--color-surface-200)' }}>
          <FaUserMd size={64} style={{ color: 'var(--color-surface-400)', marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-surface-900)', marginBottom: '1rem' }}>Servicio de Citas Virtuales</h2>
          <p style={{ color: 'var(--color-surface-600)', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Actualmente no tienes un médico asignado. Para agendar citas virtuales, un administrador del Instituto de la Juventud debe asignarte un médico de cabecera.
          </p>
          <Link to="/contacto" style={{ display: 'inline-block', padding: '0.75rem 1.75rem', borderRadius: '30px', background: 'var(--color-primary-500)', color: 'white', fontWeight: '700', textDecoration: 'none' }}>
            Contactar Soporte
          </Link>
        </div>
      </div>
    )
  }

  // Check if patient has any appointment in pending state to block duplicate booking
  const hasPending = appointments.some(a => a.status === 'pending')

  return (
    <div className="disease-detail-wrapper" style={{ padding: '2rem 1.5rem' }}>
      {/* Volver y Título */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-500)', textDecoration: 'none', fontWeight: '700' }}>
          <FaArrowLeft /> Volver a Mi Salud
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-surface-900)', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          📹 Citas Virtuales
        </h1>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <FaExclamationCircle /> {error}
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#10b981', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <FaCheckCircle /> {success}
        </div>
      )}

      {/* Grid General */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'flex-start' }} className="disease-detail-container">
        {/* Lado Izquierdo: Citas y Recetas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }} className="disease-content-area">
          {/* Selector de Pestañas Citas / Recetas */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-surface-200)', paddingBottom: '0.75rem' }}>
            <button
              onClick={() => setActiveView('appointments')}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                background: activeView === 'appointments' ? 'var(--color-primary-500)' : 'transparent',
                color: activeView === 'appointments' ? 'white' : 'var(--color-surface-600)',
                fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Mis Citas
            </button>
            <button
              onClick={() => setActiveView('prescriptions')}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                background: activeView === 'prescriptions' ? 'var(--color-primary-500)' : 'transparent',
                color: activeView === 'prescriptions' ? 'white' : 'var(--color-surface-600)',
                fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Recetas Médicas ({prescriptions.length})
            </button>
          </div>

          {/* VISTA CITAS */}
          {activeView === 'appointments' && (
            <>
              {/* Botón Nueva Solicitud o Formulario */}
              {!showRequestForm ? (
                <button
                  disabled={hasPending}
                  onClick={() => setShowRequestForm(true)}
                  style={{
                    alignSelf: 'flex-start', padding: '0.75rem 1.5rem', borderRadius: '30px',
                    border: 'none', background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                    color: 'white', fontWeight: '700', fontSize: '0.88rem', cursor: hasPending ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow-card)', opacity: hasPending ? 0.6 : 1, transition: 'all 0.25s'
                  }}
                >
                  {hasPending ? '⏳ Tienes una solicitud en espera' : '📅 Solicitar Cita Médica'}
                </button>
              ) : (
                /* FORMULARIO DE SOLICITUD */
                <form onSubmit={handleRequestSubmit} className="disease-card-content" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', background: 'white', border: '1px solid var(--color-surface-200)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-surface-900)' }}>Solicitar Cita Virtual</h3>
                    <button type="button" onClick={() => setShowRequestForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-surface-400)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                  </div>

                  {/* Selector de Fecha */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-surface-500)', marginBottom: '0.5rem' }}>
                      1. Selecciona la Fecha:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="no-scrollbar">
                      {Object.keys(availableSlotsData).map(dateStr => {
                        const dateInfo = availableSlotsData[dateStr]
                        const isSel = selectedDate === dateStr
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            disabled={!dateInfo.available}
                            onClick={() => { setSelectedDate(dateStr); setSelectedTime('') }}
                            style={{
                              flexShrink: 0, padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid',
                              borderColor: isSel ? 'var(--color-primary-500)' : 'var(--color-surface-200)',
                              background: isSel ? 'var(--color-primary-50)' : 'white',
                              color: isSel ? 'var(--color-primary-500)' : (dateInfo.available ? 'var(--color-surface-800)' : 'var(--color-surface-400)'),
                              cursor: dateInfo.available ? 'pointer' : 'not-allowed', opacity: dateInfo.available ? 1 : 0.45,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{formatDateString(dateStr)}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: dateInfo.available ? '#10b981' : '#ef4444' }}>
                              {dateInfo.available ? 'Disponible' : 'Lleno/Inactivo'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selector de Hora */}
                  {selectedDate && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-surface-500)', marginBottom: '0.5rem' }}>
                        2. Elige la Hora Disponibles:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                        {availableSlotsData[selectedDate]?.slots.map(tStr => {
                          const isSel = selectedTime === tStr
                          return (
                            <button
                              key={tStr}
                              type="button"
                              onClick={() => setSelectedTime(tStr)}
                              style={{
                                padding: '0.5rem', borderRadius: '8px', border: '1px solid',
                                borderColor: isSel ? 'var(--color-primary-500)' : 'var(--color-surface-200)',
                                background: isSel ? 'var(--color-primary-500)' : 'white',
                                color: isSel ? 'white' : 'var(--color-surface-700)',
                                fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                              }}
                            >
                              {tStr}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Motivo de la Cita */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-surface-500)', marginBottom: '0.5rem' }}>
                      Motivo de la Cita: *
                    </label>
                    <textarea
                      required
                      placeholder="Escribe brevemente el motivo de tu consulta médica..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-surface-200)', fontSize: '0.9rem', resize: 'vertical' }}
                    />
                  </div>

                  {/* Síntomas */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-surface-500)', marginBottom: '0.5rem' }}>
                      Síntomas adicionales (opcional):
                    </label>
                    <textarea
                      placeholder="Si tienes síntomas (fiebre, dolor, tos...), indícalos aquí..."
                      value={symptoms}
                      onChange={e => setSymptoms(e.target.value)}
                      style={{ width: '100%', minHeight: '60px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-surface-200)', fontSize: '0.9rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="submit" disabled={actionLoading || !selectedTime} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary-500)', color: 'white', fontWeight: '700', cursor: (actionLoading || !selectedTime) ? 'not-allowed' : 'pointer' }}>
                      {actionLoading ? 'Enviando...' : 'Confirmar Cita'}
                    </button>
                    <button type="button" onClick={() => setShowRequestForm(false)} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--color-surface-200)', background: 'transparent', color: 'var(--color-surface-700)', fontWeight: '600', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* LISTADO DE CITAS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {appointments.length === 0 ? (
                  <div className="glass" style={{ padding: '3rem 1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-surface-200)', textAlign: 'center', color: 'var(--color-surface-400)' }}>
                    <FaCalendarAlt size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p style={{ margin: 0, fontWeight: '600' }}>No tienes citas médicas programadas aún.</p>
                  </div>
                ) : (
                  appointments.map(appt => {
                    const isPending = appt.status === 'pending'
                    const isAccepted = appt.status === 'accepted'
                    const isCompleted = appt.status === 'completed'
                    const isRejected = appt.status === 'rejected'
                    const isCancelled = appt.status === 'cancelled'

                    let badgeBg = '#f1f5f9', badgeColor = '#64748b', statusLabel = 'Cancelada'
                    if (isPending) { badgeBg = '#fef3c7'; badgeColor = '#d97706'; statusLabel = 'En Espera' }
                    if (isAccepted) { badgeBg = '#dcfce7'; badgeColor = '#15803d'; statusLabel = 'Confirmada' }
                    if (isCompleted) { badgeBg = '#dbeafe'; badgeColor = '#1d4ed8'; statusLabel = 'Finalizada' }
                    if (isRejected) { badgeBg = '#fee2e2'; badgeColor = '#b91c1c'; statusLabel = 'Rechazada' }

                    return (
                      <div
                        key={appt.id}
                        className="disease-card-content"
                        style={{
                          padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'white',
                          border: '1px solid var(--color-surface-200)', boxShadow: 'var(--shadow-card)',
                          display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative'
                        }}
                      >
                        {/* Fila superior: Fecha/Hora y Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-surface-800)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: '700' }}>
                              <FaCalendarAlt style={{ color: 'var(--color-primary-500)' }} />
                              {formatDateString(appt.appointmentDate)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: '700' }}>
                              <FaClock style={{ color: 'var(--color-primary-500)' }} />
                              {appt.appointmentTime} hrs
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '20px', background: badgeBg, color: badgeColor }}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Motivo */}
                        <div style={{ fontSize: '0.95rem', color: 'var(--color-surface-900)' }}>
                          <p style={{ margin: '0 0 0.25rem 0', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-surface-400)' }}>Motivo de consulta:</p>
                          {appt.reason}
                        </div>

                        {/* Síntomas */}
                        {appt.symptoms && (
                          <div style={{ fontSize: '0.9rem', color: 'var(--color-surface-600)' }}>
                            <p style={{ margin: '0 0 0.25rem 0', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-surface-400)' }}>Síntomas reportados:</p>
                            {appt.symptoms}
                          </div>
                        )}

                        {/* Info de Reclamación / Rechazo */}
                        {isRejected && appt.rejectionReason && (
                          <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontSize: '0.88rem' }}>
                            <strong>Motivo de rechazo:</strong> {appt.rejectionReason}
                          </div>
                        )}

                        {/* Panel de Enlace Google Meet (Confirmado) */}
                        {isAccepted && appt.meetLink && (
                          <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9' }}>
                              <FaVideo size={16} />
                              <strong style={{ fontSize: '0.9rem' }}>Detalles de la Cita Virtual</strong>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-surface-700)' }}>
                              <div><strong>Duración:</strong> {appt.duration} min</div>
                              {appt.meetCode && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <strong>Código:</strong> <code>{appt.meetCode}</code>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(appt.meetCode, appt.id)}
                                    style={{ border: 'none', background: 'transparent', padding: 0, color: '#0ea5e9', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    title="Copiar código"
                                  >
                                    {copiedApptId === appt.id ? <FaClipboardCheck size={14} style={{ color: '#10b981' }} /> : <FaCopy size={12} />}
                                  </button>
                                </div>
                              )}
                            </div>

                            {appt.notes && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--color-surface-500)', fontStyle: 'italic' }}>
                                <strong>Notas médicas:</strong> {appt.notes}
                              </div>
                            )}

                            <a
                              href={appt.meetLink.startsWith('http') ? appt.meetLink : `https://${appt.meetLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.25rem', borderRadius: '8px', background: '#0ea5e9', color: 'white',
                                textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem', marginTop: '0.25rem',
                                textAlign: 'center', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.25)'
                              }}
                            >
                              <FaLink /> Unirse a Google Meet
                            </a>
                          </div>
                        )}

                        {/* Botón cancelar si está pendiente */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(appt.id)}
                            style={{
                              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem',
                              border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.85rem',
                              fontWeight: '600', cursor: 'pointer', padding: '0.25rem 0', marginTop: '0.25rem'
                            }}
                          >
                            <FaTrashAlt size={12} /> Cancelar Solicitud
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* VISTA RECETAS */}
          {activeView === 'prescriptions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {prescriptions.length === 0 ? (
                <div className="glass" style={{ padding: '3rem 1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-surface-200)', textAlign: 'center', color: 'var(--color-surface-400)' }}>
                  <FaFilePrescription size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontWeight: '600' }}>No tienes recetas médicas emitidas aún.</p>
                </div>
              ) : (
                prescriptions.map(pres => (
                  <div
                    key={pres.id}
                    className="disease-card-content"
                    style={{
                      padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'white',
                      border: '1px solid var(--color-surface-200)', boxShadow: 'var(--shadow-card)',
                      display: 'flex', flexDirection: 'column', gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--color-primary-500)', background: 'var(--color-primary-50)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {pres.folio}
                        </span>
                        <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '0.98rem', fontWeight: '800', color: 'var(--color-surface-900)' }}>
                          Dr(a). {pres.doctorName}
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-surface-400)' }}>
                          {pres.doctorSpecialty || 'Médico General'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--color-surface-500)' }}>
                        Fecha: {new Date(pres.issuedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-surface-50)', fontSize: '0.9rem', color: 'var(--color-surface-700)' }}>
                      <strong>Diagnóstico:</strong> {pres.diagnosis}
                    </div>

                    <div style={{ fontSize: '0.85rem' }}>
                      <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-surface-800)' }}>Medicamentos Recetados:</strong>
                      <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--color-surface-600)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {pres.medications.map((m, idx) => (
                          <li key={idx}>
                            <strong>{m.name}</strong> - {m.dose} (Vía {m.route || 'Oral'}) / {m.frequency} por {m.duration}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadPrescription(pres)}
                      style={{
                        alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.55rem 1.25rem', borderRadius: '20px', border: '1px solid var(--color-primary-500)',
                        background: 'transparent', color: 'var(--color-primary-500)', fontWeight: '700',
                        fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.5rem'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-50)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <FaDownload /> Descargar Receta (PDF)
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Lado Derecho: Info del Médico Asignado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-surface-200)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-surface-400)', letterSpacing: '0.05em', width: '100%', borderBottom: '1px solid var(--color-surface-200)', paddingBottom: '0.5rem' }}>
              Tu Médico de Cabecera
            </h3>
            
            {doctorInfo ? (
              <>
                <img
                  src={doctorInfo.avatar ? (doctorInfo.avatar.startsWith('http') ? doctorInfo.avatar : `http://localhost:3001${doctorInfo.avatar}`) : '/icons.svg#user'}
                  alt={doctorInfo.name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid var(--color-primary-500)', padding: '2px', background: 'white' }}
                  onError={e => { e.currentTarget.src = '/favicon.svg' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--color-surface-900)' }}>Dr(a). {doctorInfo.name}</h4>
                  <p style={{ margin: '0.2rem 0 0.4rem 0', fontSize: '0.8rem', color: 'var(--color-surface-400)', fontWeight: '600', textTransform: 'uppercase' }}>
                    {doctorInfo.specialty || 'General Practitioner'}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', background: 'var(--color-surface-100)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                    Lic: {doctorInfo.professionalLicense || 'Pending'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-surface-100)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-surface-400)' }}>
                  <FaUserMd size={40} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--color-surface-900)' }}>Asignado</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-surface-400)' }}>Consultorio de cabecera</p>
                </div>
              </>
            )}
          </div>

          {/* Tips block */}
          <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-surface-200)', fontSize: '0.82rem', color: 'var(--color-surface-500)', lineHeight: 1.5 }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-surface-800)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FaExclamationCircle style={{ color: 'var(--color-accent-500)' }} /> Importante
            </h4>
            <ul style={{ paddingLeft: '1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>Debes solicitar tu cita con un mínimo de <strong>24 horas</strong> de anticipación.</li>
              <li>Las recetas generadas son documentos digitales certificados oficiales del Gobierno del Estado de Tamaulipas.</li>
              <li>Si presentas una emergencia médica crítica, por favor acude de inmediato a tu hospital más cercano o llama al <strong>911</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
