import { useState, useEffect, useRef, useCallback } from 'react'
import { FaComments, FaTimes, FaPaperPlane, FaUserCircle, FaArrowLeft, FaCircle } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api, { getApiBaseUrl } from '../../services/api'

const API_BASE = getApiBaseUrl()

export default function ChatBubble() {
  const { user, isAuthenticated } = useAuth()
  const { dark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [activeContact, setActiveContact] = useState(null) // { id, name, role }
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [patients, setPatients] = useState([]) // For doctor view
  const [patientSearch, setPatientSearch] = useState('')
  const [doctorContact, setDoctorContact] = useState(null) // For patient view
  const [unreadTotal, setUnreadTotal] = useState(0)

  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  // Fetch data depending on user role
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated || !user) return

    try {
      if (user.role === 'user') {
        // Patient user: fetch their assigned doctor
        const res = await api.get('/chat/contact')
        if (res.data.doctor) {
          setDoctorContact(res.data.doctor)
          // Pre-select doctor as contact
          setActiveContact({
            id: res.data.doctor.id,
            name: `Dr. ${res.data.doctor.name}`,
            role: 'doctor',
            avatar: res.data.doctor.avatar
          })
        }
      } else if (user.role === 'doctor') {
        // Doctor user: fetch list of assigned patients
        const res = await api.get('/doctor/patients')
        setPatients(res.data.patients)
      }
    } catch (err) {
      console.error('Error fetching initial chat contact data:', err)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData()
    } else {
      // Clear states on logout
      setIsOpen(false)
      setActiveContact(null)
      setMessages([])
      setDoctorContact(null)
      setPatients([])
      setUnreadTotal(0)
    }
  }, [isAuthenticated, loadInitialData])

  // Fetch messages between current user and active contact
  const fetchMessages = useCallback(async () => {
    if (!activeContact) return
    try {
      const res = await api.get('/chat/messages', {
        params: { userId: activeContact.id }
      })
      setMessages(res.data.messages)
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }, [activeContact])

  // Set up polling for messages when chat is open
  useEffect(() => {
    if (isOpen && activeContact) {
      fetchMessages()
      pollIntervalRef.current = setInterval(fetchMessages, 4000)
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [isOpen, activeContact, fetchMessages])

  // Separate polling to check for unread messages when widget is closed
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const checkUnread = async () => {
      try {
        if (user.role === 'user' && doctorContact) {
          const res = await api.get('/chat/messages', {
            params: { userId: doctorContact.id }
          })
          const incomingUnread = res.data.messages.filter(
            m => m.senderId === doctorContact.id && !m.isRead
          )
          setUnreadTotal(incomingUnread.length)
        } else if (user.role === 'doctor' && patients.length > 0) {
          // Check unread count for each patient
          let total = 0
          for (const p of patients) {
            const res = await api.get('/chat/messages', { params: { userId: p.id } })
            const unread = res.data.messages.filter(m => m.senderId === p.id && !m.isRead)
            total += unread.length
          }
          setUnreadTotal(total)
        }
      } catch (e) {
        // Suppress polling network logs
      }
    }

    // Run check every 15 seconds if widget is closed
    let interval = null
    if (!isOpen) {
      checkUnread()
      interval = setInterval(checkUnread, 15000)
    } else {
      setUnreadTotal(0) // Clear badge when open
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isOpen, isAuthenticated, user, doctorContact, patients])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !activeContact) return

    const text = inputText.trim()
    setInputText('')

    // Optimistically add to UI list
    const tempMsg = {
      id: Math.random().toString(),
      senderId: user.id,
      receiverId: activeContact.id,
      message: text,
      createdAt: new Date().toISOString(),
      isTemp: true
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      await api.post('/chat/messages', {
        receiverId: activeContact.id,
        message: text
      })
      fetchMessages()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al enviar mensaje')
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    }
  }

  // If user is not logged in, do not render bubble
  if (!isAuthenticated || !user) return null

  // If patient has no doctor assigned, display placeholder in widget body
  const hasDoctor = user.role === 'user' ? !!doctorContact : true

  // Filter patients list for doctor searching
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const primaryColor = user.role === 'doctor' ? '#0369a1' : 'var(--color-primary-500)'

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, fontFamily: 'var(--font-sans)' }}>
      {/* ── Chat Widget Bubble Toggle Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${primaryColor}, ${user.role === 'doctor' ? '#0284c7' : 'var(--color-primary-700)'})`,
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Chat de Salud"
        >
          <FaComments size={26} />
          {unreadTotal > 0 && (
            <span style={{
              position: 'absolute', top: '-2px', right: '-2px',
              background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: '800',
              width: '22px', height: '22px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              {unreadTotal}
            </span>
          )}
        </button>
      )}

      {/* ── Main Chat Panel ── */}
      {isOpen && (
        <div style={{
          width: '360px',
          height: '480px',
          background: dark ? '#141319' : '#fff',
          border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`,
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'wearable-modal-in 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{
            background: primaryColor,
            color: 'white',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              {user.role === 'doctor' && activeContact && (
                <button
                  onClick={() => setActiveContact(null)}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                  title="Volver a la lista"
                >
                  <FaArrowLeft />
                </button>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                {activeContact ? (
                  <>
                    <FaUserCircle size={20} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activeContact.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.85, textTransform: 'capitalize' }}>
                        {activeContact.role === 'doctor' ? 'Médico Asignado' : 'Paciente'}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <FaComments size={18} />
                    <span style={{ fontWeight: '800', fontSize: '0.92rem' }}>Chat de Pacientes</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem' }}
            >
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: dark ? '#0c0b0f' : '#faf8f5' }}>
            {user.role === 'user' && !hasDoctor ? (
              
              /* Patient has no doctor assigned */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem' }}>🩺</span>
                <h4 style={{ margin: 0, fontWeight: '800', color: dark ? '#fff' : '#1a1715', fontSize: '0.95rem' }}>Médico no asignado</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: dark ? '#7e7a8c' : '#7d6e5e', lineHeight: 1.4 }}>
                  El administrador asignará tu médico de cabecera próximamente. Una vez asignado, podrás comunicarte directamente desde aquí.
                </p>
              </div>

            ) : user.role === 'doctor' && !activeContact ? (

              /* Doctor contact selection menu */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`, background: dark ? '#141319' : '#fff' }}>
                  <input
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Buscar paciente por nombre..."
                    style={{
                      width: '100%', padding: '0.4rem 0.75rem', borderRadius: '6px',
                      border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`,
                      background: dark ? '#1e1c25' : '#faf8f5', color: dark ? '#fff' : '#1a1715',
                      fontSize: '0.8rem', outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                  {filteredPatients.length === 0 ? (
                    <p style={{ textAlign: 'center', fontSize: '0.78rem', color: dark ? '#7e7a8c' : '#a89580', marginTop: '2rem' }}>No hay pacientes asignados</p>
                  ) : (
                    filteredPatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setActiveContact({ id: p.id, name: p.name, role: 'user', avatar: p.avatar })}
                        style={{
                          display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '0.75rem',
                          padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                          transition: 'background 0.15s',
                          marginBottom: '0.25rem'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = dark ? '#1e1c25' : '#faf8f5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', background: '#0369a120',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', color: '#0369a1', overflow: 'hidden'
                        }}>
                          {p.avatar ? (
                            <img src={p.avatar.startsWith('http') ? p.avatar : `${API_BASE}/${p.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            p.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: dark ? '#fff' : '#1a1715', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: dark ? '#7e7a8c' : '#7d6e5e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.email}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            ) : (

              /* Conversation feed */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Scrollable feed */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.65, padding: '2rem', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.78rem', color: dark ? '#7e7a8c' : '#a89580', margin: 0 }}>
                        Inicia la conversación enviando un mensaje.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user.id
                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{
                            padding: '0.55rem 0.85rem',
                            borderRadius: '12px',
                            borderTopRightRadius: isMe ? '2px' : '12px',
                            borderTopLeftRadius: isMe ? '12px' : '2px',
                            background: isMe ? primaryColor : (dark ? '#1e1c25' : '#fff'),
                            color: isMe ? '#white' : (dark ? '#e5dfef' : '#1a1715'),
                            border: isMe ? 'none' : `1px solid ${dark ? '#272530' : '#e8ddd0'}`,
                            fontSize: '0.8rem',
                            lineHeight: 1.4,
                            wordBreak: 'break-word',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}>
                            {msg.message}
                          </div>
                          
                          <span style={{ fontSize: '0.62rem', color: dark ? '#7e7a8c' : '#a89580', marginTop: '2px', padding: '0 2px' }}>
                            {new Date(msg.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input form */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: '0.75rem',
                    borderTop: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`,
                    background: dark ? '#141319' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <input
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
                      background: dark ? '#1e1c25' : '#faf8f5',
                      color: dark ? '#fff' : '#1a1715',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: primaryColor,
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                    onMouseLeave={e => e.currentTarget.style.opacity = 1}
                  >
                    <FaPaperPlane size={12} />
                  </button>
                </form>
              </div>

            )}
          </div>
        </div>
      )}
    </div>
  )
}
