import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HiMenu, HiX } from 'react-icons/hi'
import { FaHeartbeat, FaSignOutAlt, FaChartLine, FaUserCircle, FaUserShield, FaStethoscope, FaChevronDown, FaMoon, FaSun, FaBell, FaTimes, FaPills, FaCheck } from 'react-icons/fa'
import { MdWatch } from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import WearableSection from '../dashboard/WearableSection'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { dark, toggleDark } = useTheme()
  const [showWearableModal, setShowWearableModal] = useState(false)

  // Translation support
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  const LANGUAGES = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
  ]

  const getLanguageFromCookie = () => {
    const match = document.cookie.match(/googtrans=\/es\/([a-z]{2})/)
    return match ? match[1] : 'es'
  }

  const selectLanguage = (langCode) => {
    if (langCode === 'es') {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost";
    } else {
      document.cookie = `googtrans=/es/${langCode}; path=/`;
      document.cookie = `googtrans=/es/${langCode}; path=/; domain=localhost`;
      document.cookie = `googtrans=/es/${langCode}; path=/; domain=.localhost`;
    }
    window.location.reload()
  }

  const activeLang = LANGUAGES.find(l => l.code === getLanguageFromCookie()) || LANGUAGES[0]

  // Alerts and Notifications
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [readAlertIds, setReadAlertIds] = useState(() => {
    try {
      const stored = localStorage.getItem('jcs_alerts_read_ids')
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      return []
    }
  })
  const notificationsRef = useRef(null)

  // Medication Reminders
  const [medsOpen, setMedsOpen] = useState(false)
  const [medications, setMedications] = useState([])
  const [completedDoses, setCompletedDoses] = useState(() => {
    try {
      const todayKey = new Date().toISOString().split('T')[0]
      const stored = localStorage.getItem('jcs_meds_taken_' + todayKey)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      return []
    }
  })
  const medsRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchAlerts = () => {
      api.get('/health-tracking/alerts')
        .then(res => {
          if (res.data.alerts) {
            const fetchedAlerts = res.data.alerts
            setAlerts(fetchedAlerts)
            
            const fetchedIds = fetchedAlerts.map(a => a.id)
            
            if (notificationsOpen) {
              setReadAlertIds(fetchedIds)
              localStorage.setItem('jcs_alerts_read_ids', JSON.stringify(fetchedIds))
              setUnreadCount(0)
            } else {
              setReadAlertIds(prev => {
                const updated = prev.filter(id => fetchedIds.includes(id))
                localStorage.setItem('jcs_alerts_read_ids', JSON.stringify(updated))
                const unread = fetchedAlerts.filter(a => !updated.includes(a.id)).length
                setUnreadCount(unread)
                return updated
              })
            }
          }
        })
        .catch(err => console.error('Error fetching navbar alerts:', err))
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 60000) // update every minute
    return () => clearInterval(interval)
  }, [isAuthenticated, notificationsOpen])

  // Cleanup old keys and fetch medications
  useEffect(() => {
    if (!isAuthenticated) return

    const todayKey = new Date().toISOString().split('T')[0]
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('jcs_meds_taken_') && !key.endsWith(todayKey)) {
          localStorage.removeItem(key)
        }
      }
    } catch (e) {}

    const fetchMeds = () => {
      api.get('/medications')
        .then(res => {
          if (res.data.medications) {
            setMedications(res.data.medications)
          }
        })
        .catch(err => console.error('Error fetching navbar medications:', err))
    }

    fetchMeds()
    const interval = setInterval(fetchMeds, 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const markDoseAsTaken = (medId, time) => {
    const todayKey = new Date().toISOString().split('T')[0]
    const key = `${medId}_${time}`
    setCompletedDoses(prev => {
      const updated = [...prev, key]
      localStorage.setItem('jcs_meds_taken_' + todayKey, JSON.stringify(updated))
      return updated
    })
  }

  const getTodayDoses = () => {
    const list = []
    medications.forEach(med => {
      if (!med.schedules || !Array.isArray(med.schedules)) return
      med.schedules.forEach(time => {
        const key = `${med.id}_${time}`
        const isTaken = completedDoses.includes(key)
        
        const [hours, minutes] = time.split(':').map(Number)
        const now = new Date()
        const scheduledDate = new Date()
        scheduledDate.setHours(hours, minutes, 0, 0)
        
        const isPast = now > scheduledDate
        
        list.push({
          medId: med.id,
          name: med.name,
          dose: med.dose,
          instructions: med.instructions,
          time,
          key,
          isTaken,
          isPast,
          scheduledDate
        })
      })
    })
    return list.sort((a, b) => a.scheduledDate - b.scheduledDate)
  }

  const todayDoses = getTodayDoses()
  const pendingMedsCount = todayDoses.filter(d => !d.isTaken).length

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/enfermedades', label: 'Enfermedades' },
    { to: '/programas', label: 'Programas' },
    { to: '/nutraceuticos', label: 'Nutracéuticos' },
    { to: '/noticias', label: 'Noticias' },
    { to: '/contacto', label: 'Contacto' },
    { to: '/faq', label: 'FAQ' },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    setUserMenuOpen(false)
    setNotificationsOpen(false)
    setMedsOpen(false)
    navigate('/')
  }

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false)
      }
      if (medsRef.current && !medsRef.current.contains(e.target)) {
        setMedsOpen(false)
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
            <FaHeartbeat style={{ fontSize: '1.75rem', color: 'var(--color-accent-500)' }} />
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>
              Jóvenes con Salud
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
               className="desktop-nav">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive(link.to) ? '600' : '500',
                  color: isActive(link.to) ? 'var(--color-primary-500)' : 'var(--color-surface-600)',
                  backgroundColor: isActive(link.to) ? 'var(--color-primary-50)' : 'transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Language Selector Dropdown (Desktop Nav) */}
            <div ref={langRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 0.8rem', borderRadius: 'var(--radius-lg)',
                  background: dark ? 'var(--color-surface-200)' : 'var(--color-surface-50)', 
                  border: `1px solid ${dark ? '#272530' : 'var(--color-surface-200)'}`,
                  color: 'var(--color-surface-700)', fontSize: '0.78rem', fontWeight: '700',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <span>{activeLang.flag}</span>
                <span style={{ textTransform: 'uppercase' }}>{activeLang.code}</span>
                <FaChevronDown size={10} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {langOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
                  background: dark ? 'var(--color-surface-100)' : 'var(--color-surface-50)',
                  borderRadius: '10px', minWidth: '130px',
                  boxShadow: 'var(--shadow-elevated)', border: `1px solid ${dark ? '#272530' : 'var(--color-surface-200)'}`,
                  padding: '0.4rem 0', animation: 'slideUp 0.15s ease',
                }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { selectLanguage(lang.code); setLangOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        width: '100%', padding: '0.5rem 1rem', border: 'none',
                        background: activeLang.code === lang.code ? (dark ? '#272530' : '#f0fdf4') : 'transparent',
                        color: activeLang.code === lang.code ? 'var(--color-primary-500)' : 'var(--color-surface-700)',
                        fontSize: '0.82rem', fontWeight: activeLang.code === lang.code ? '700' : '500',
                        textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (activeLang.code !== lang.code) e.currentTarget.style.background = dark ? '#1e1c25' : '#faf8f5' }}
                      onMouseLeave={e => { if (activeLang.code !== lang.code) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.75rem' }}>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    color: isActive('/dashboard') ? 'white' : 'var(--color-accent-600)',
                    background: isActive('/dashboard')
                      ? 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-700))'
                      : 'var(--color-accent-50)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FaChartLine size={13} /> Mi Salud
                </Link>



                {/* Admin link — solo visible para administradores */}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    title="Panel de Administración"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 0.875rem',
                      borderRadius: 'var(--radius-lg)',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      color: isActive('/admin') ? 'white' : '#871233',
                      background: isActive('/admin') ? '#871233' : '#87123318',
                      border: '1px solid #87123330',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <FaUserShield size={13} /> Admin
                  </Link>
                )}

                {/* Doctor link — solo visible para doctores */}
                {user?.role === 'doctor' && (
                  <Link
                    to="/doctor"
                    title="Panel Médico"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 0.875rem',
                      borderRadius: 'var(--radius-lg)',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      color: isActive('/doctor') ? 'white' : '#0369a1',
                      background: isActive('/doctor') ? '#0369a1' : '#0369a118',
                      border: '1px solid #0369a130',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <FaStethoscope size={13} /> Doctor
                  </Link>
                )}
                {/* Medication Reminders */}
                <div ref={medsRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      const nextOpen = !medsOpen
                      setMedsOpen(nextOpen)
                      setNotificationsOpen(false)
                    }}
                    style={{
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '32px', height: '32px',
                      borderRadius: '50%',
                      background: medsOpen ? 'var(--color-surface-100)' : 'var(--color-surface-50)',
                      border: '1px solid var(--color-surface-200)',
                      cursor: 'pointer', transition: 'all 0.2s',
                      color: pendingMedsCount > 0 ? '#10b981' : 'var(--color-surface-600)',
                      marginRight: '0.5rem',
                    }}
                    title="Recordatorio de medicamentos"
                  >
                    <FaPills size={14} className={pendingMedsCount > 0 ? 'bell-shake' : ''} />
                    {pendingMedsCount > 0 && (
                      <span style={{
                        position: 'absolute', top: '-3px', right: '-3px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: '15px', height: '15px', padding: '0 3px',
                        borderRadius: '7.5px',
                        background: '#10b981', color: 'white',
                        fontSize: '0.55rem', fontWeight: '800',
                      }}>
                        {pendingMedsCount}
                      </span>
                    )}
                  </button>

                  {medsOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
                      background: 'var(--color-surface-50)', borderRadius: '12px', width: '320px',
                      boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--color-surface-200)',
                      padding: '0.5rem 0', animation: 'slideUp 0.15s ease',
                    }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem 0.6rem', borderBottom: '1px solid var(--color-surface-200)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-surface-800)' }}>Toma de Medicamentos</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-surface-500)', fontWeight: '600' }}>Hoy</span>
                      </div>

                      {/* Meds List */}
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {todayDoses.length === 0 ? (
                          <div style={{ padding: '1.75rem 1rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.4rem' }}>💊</span>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-surface-500)', fontWeight: '700', margin: 0 }}>Sin recordatorios</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-surface-400)', margin: '2px 0 0' }}>No tienes medicamentos agendados para hoy.</p>
                          </div>
                        ) : (
                          todayDoses.map((doseItem, idx) => {
                            return (
                              <div 
                                key={idx}
                                style={{
                                  padding: '0.75rem 1rem',
                                  borderBottom: '1px solid var(--color-surface-200)',
                                  display: 'flex',
                                  gap: '0.6rem',
                                  alignItems: 'center',
                                  background: doseItem.isTaken 
                                    ? (dark ? 'rgba(16, 185, 129, 0.18)' : '#f0fdf4') 
                                    : 'transparent',
                                  opacity: doseItem.isTaken ? 0.85 : 1,
                                  transition: 'background 0.2s',
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-surface-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {doseItem.name}
                                    </span>
                                    <span style={{
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      fontSize: '0.65rem',
                                      fontWeight: '800',
                                      color: 'white',
                                      background: doseItem.isPast && !doseItem.isTaken ? '#dc2626' : '#3b82f6',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {doseItem.time}
                                    </span>
                                  </div>
                                  
                                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-600)', margin: '3px 0 1px' }}>
                                    Dosis: <strong>{doseItem.dose}</strong>
                                  </p>
                                  {doseItem.instructions && (
                                    <p style={{ fontSize: '0.7rem', color: 'var(--color-surface-400)', margin: 0, fontStyle: 'italic' }}>
                                      "{doseItem.instructions}"
                                    </p>
                                  )}
                                </div>

                                <div style={{ flexShrink: 0 }}>
                                  {doseItem.isTaken ? (
                                    <span style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      width: '24px', height: '24px', borderRadius: '50%',
                                      background: '#10b981', color: 'white', fontSize: '0.75rem',
                                    }}>
                                      <FaCheck size={10} />
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => markDoseAsTaken(doseItem.medId, doseItem.time)}
                                      style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '6px',
                                        fontSize: '0.7rem',
                                        fontWeight: '700',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                                      onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                                    >
                                      Tomar
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      {/* Footer link to manage meds */}
                      <div style={{ borderTop: '1px solid var(--color-surface-200)', padding: '0.4rem 0.5rem 0.1rem', textAlign: 'center' }}>
                        <Link 
                          to="/dashboard" 
                          onClick={() => setMedsOpen(false)}
                          style={{ display: 'block', width: '100%', padding: '0.3rem', fontSize: '0.75rem', color: '#10b981', fontWeight: '700', textDecoration: 'none' }}
                        >
                          Administrar Medicamentos
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notification Bell */}
                <div ref={notificationsRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      const nextOpen = !notificationsOpen
                      setNotificationsOpen(nextOpen)
                      if (nextOpen) {
                        const fetchedIds = alerts.map(a => a.id)
                        setReadAlertIds(fetchedIds)
                        localStorage.setItem('jcs_alerts_read_ids', JSON.stringify(fetchedIds))
                        setUnreadCount(0)
                      }
                    }}
                    style={{
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '32px', height: '32px',
                      borderRadius: '50%',
                      background: notificationsOpen ? 'var(--color-surface-100)' : 'var(--color-surface-50)',
                      border: '1px solid var(--color-surface-200)',
                      cursor: 'pointer', transition: 'all 0.2s',
                      color: unreadCount > 0 ? 'var(--color-primary-500)' : 'var(--color-surface-600)',
                      marginRight: '0.25rem',
                    }}
                    title="Notificaciones de salud"
                  >
                    <FaBell size={14} className={unreadCount > 0 ? 'bell-shake' : ''} />
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute', top: '-3px', right: '-3px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: '15px', height: '15px', padding: '0 3px',
                        borderRadius: '7.5px',
                        background: '#dc2626', color: 'white',
                        fontSize: '0.55rem', fontWeight: '800',
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
                      background: 'white', borderRadius: '12px', width: '320px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid var(--color-surface-200)',
                      padding: '0.5rem 0', animation: 'slideUp 0.15s ease',
                    }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem 0.6rem', borderBottom: '1px solid var(--color-surface-200)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-surface-800)' }}>Alertas de Salud</span>
                        {alerts.length > 0 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-surface-500)', fontWeight: '600' }}>Últimos 7 días</span>
                        )}
                      </div>

                      {/* Alerts List */}
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {alerts.length === 0 ? (
                          <div style={{ padding: '1.75rem 1rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.4rem' }}>💚</span>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-surface-500)', fontWeight: '700', margin: 0 }}>Todo en orden</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-surface-400)', margin: '2px 0 0' }}>No hay alertas recientes.</p>
                          </div>
                        ) : (
                          alerts.map((alert) => {
                            const isCritical = alert.severity === 'critical'
                            const alertColor = isCritical ? 'var(--color-alert-crit-text)' : 'var(--color-alert-warn-text)'
                            const alertBg = isCritical ? 'var(--color-alert-crit-bg)' : 'var(--color-alert-warn-bg)'
                            const alertBorder = isCritical ? 'var(--color-alert-crit-border)' : 'var(--color-alert-warn-border)'
                            
                            const TYPE_ICONS = {
                              glucose: '🩸',
                              heartRate: '💓',
                              bloodPressure: '🩺',
                              weight: '⚖️',
                              cholesterol: '🧪',
                              triglycerides: '⚗️',
                            }
                            const icon = TYPE_ICONS[alert.type] || '❓'

                            return (
                              <div 
                                key={alert.id}
                                style={{
                                  padding: '0.75rem 1rem',
                                  borderBottom: '1px solid var(--color-surface-200)',
                                  display: 'flex',
                                  gap: '0.6rem',
                                  alignItems: 'flex-start',
                                }}
                                className="notification-item"
                              >
                                <span style={{ fontSize: '1.1rem', marginTop: '1px', flexShrink: 0 }}>{icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-surface-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {alert.memberName} {alert.relationLabel ? `(${alert.relationLabel})` : ''}
                                    </span>
                                    <span style={{
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      fontSize: '0.58rem',
                                      fontWeight: '700',
                                      color: alertColor,
                                      background: alertBg,
                                      border: `1px solid ${alertBorder}`,
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {isCritical ? 'Crítica' : 'Alerta'}
                                    </span>
                                  </div>
                                  
                                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-700)', margin: '3px 0 1px', lineHeight: 1.35 }}>
                                    {alert.metricLabel}: <strong style={{ color: isCritical ? 'var(--color-error)' : 'var(--color-surface-800)' }}>{alert.value}</strong>
                                  </p>
                                  <p style={{ fontSize: '0.7rem', color: 'var(--color-surface-500)', margin: 0, fontStyle: 'italic' }}>
                                    {alert.description}
                                  </p>
                                  <span style={{ fontSize: '0.62rem', color: 'var(--color-surface-400)', display: 'block', marginTop: '3px' }}>
                                    {new Date(alert.recordedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      {/* Footer link */}
                      {alerts.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--color-surface-200)', padding: '0.4rem 0.5rem 0.1rem', textAlign: 'center' }}>
                          <Link 
                            to="/dashboard" 
                            onClick={() => setNotificationsOpen(false)}
                            style={{ display: 'block', width: '100%', padding: '0.3rem', fontSize: '0.75rem', color: 'var(--color-primary-500)', fontWeight: '700', textDecoration: 'none' }}
                          >
                            Ver historial en Mi Salud
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User avatar with dropdown menu */}
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-lg)',
                      background: userMenuOpen ? 'var(--color-surface-100)' : 'var(--color-surface-50)',
                      border: '1px solid var(--color-surface-200)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0,
                    }}>
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-surface-700)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name?.split(' ')[0]}
                    </span>
                    <FaChevronDown size={10} style={{ color: 'var(--color-surface-400)', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </button>

                  {userMenuOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
                      background: 'white', borderRadius: '12px', minWidth: '200px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid var(--color-surface-200)',
                      padding: '0.35rem', animation: 'slideUp 0.15s ease',
                    }}>
                      <Link
                        to="/perfil"
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.6rem 0.75rem', borderRadius: '8px',
                          textDecoration: 'none', fontSize: '0.85rem', fontWeight: '500',
                          color: 'var(--color-surface-700)', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FaUserCircle style={{ color: 'var(--color-surface-400)' }} /> Mi Perfil
                      </Link>

                      {user && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            setShowWearableModal(true)
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: '500',
                            color: 'var(--color-surface-700)', transition: 'background 0.15s',
                            textAlign: 'left'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-50)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <MdWatch style={{ color: 'var(--color-surface-400)', fontSize: '1rem' }} /> Dispositivo Wearable
                        </button>
                      )}

                      {/* ── Dark mode toggle row ─────────────────── */}
                      <button
                        onClick={toggleDark}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          fontSize: '0.85rem', fontWeight: '500',
                          color: 'var(--color-surface-700)', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {dark
                            ? <FaSun  style={{ color: '#f59e0b', fontSize: '0.9rem' }} />
                            : <FaMoon style={{ color: '#6366f1', fontSize: '0.9rem' }} />
                          }
                          {dark ? 'Modo claro' : 'Modo oscuro'}
                        </span>
                        {/* Pill switch */}
                        <span style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '36px', height: '20px',
                          borderRadius: '10px',
                          background: dark ? '#871233' : 'var(--color-surface-300)',
                          transition: 'background 0.25s',
                          flexShrink: 0,
                        }}>
                          <span style={{
                            position: 'absolute',
                            top: '3px',
                            left: dark ? '19px' : '3px',
                            width: '14px', height: '14px',
                            borderRadius: '50%',
                            background: 'white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            transition: 'left 0.25s',
                          }} />
                        </span>
                      </button>

                      <div style={{ height: '1px', background: 'var(--color-surface-100)', margin: '0.2rem 0.5rem' }} />
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                          padding: '0.6rem 0.75rem', borderRadius: '8px',
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          fontSize: '0.85rem', fontWeight: '500', color: 'var(--color-error)',
                          textAlign: 'left', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FaSignOutAlt /> Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                style={{
                  marginLeft: '0.75rem',
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgb(135 18 51 / 0.3)',
                }}
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-menu-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: 'var(--color-surface-700)',
              fontSize: '1.5rem',
            }}
          >
            {isOpen ? <HiX /> : <HiMenu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="mobile-nav animate-fade-in" style={{
            paddingBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}>
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: isActive(link.to) ? '600' : '500',
                  color: isActive(link.to) ? 'var(--color-primary-500)' : 'var(--color-surface-600)',
                  backgroundColor: isActive(link.to) ? 'var(--color-primary-50)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'var(--color-accent-600)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}
                >
                  <FaChartLine size={14} /> Mi Salud
                </Link>

                {/* Admin link móvil */}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: '#871233',
                      background: '#87123312',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <FaUserShield size={14} /> Panel de Administración
                  </Link>
                )}

                {user && (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowWearableModal(true)
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: 'var(--color-surface-600)',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <MdWatch size={14} style={{ color: 'var(--color-surface-400)' }} /> Dispositivo Wearable
                  </button>
                )}

                <div style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  color: 'var(--color-surface-400)',
                }}>
                  Sesión: <strong style={{ color: 'var(--color-surface-700)' }}>{user?.name}</strong>
                </div>

                {/* Dark mode toggle — mobile */}
                <button
                  onClick={toggleDark}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                    border: 'none', background: dark ? 'var(--color-surface-100)' : 'var(--color-surface-50)',
                    cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500',
                    color: 'var(--color-surface-700)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {dark
                      ? <FaSun  size={14} style={{ color: '#f59e0b' }} />
                      : <FaMoon size={14} style={{ color: '#6366f1' }} />
                    }
                    {dark ? 'Modo claro' : 'Modo oscuro'}
                  </span>
                  {/* Pill switch */}
                  <span style={{
                    position: 'relative', display: 'inline-block',
                    width: '40px', height: '22px', borderRadius: '11px',
                    background: dark ? '#871233' : 'var(--color-surface-300)',
                    transition: 'background 0.25s', flexShrink: 0,
                  }}>
                    <span style={{
                      position: 'absolute', top: '4px',
                      left: dark ? '20px' : '4px',
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      transition: 'left 0.25s',
                    }} />
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'var(--color-surface-50)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    color: 'var(--color-error)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    textAlign: 'left',
                  }}
                >
                  <FaSignOutAlt /> Cerrar Sesión
                </button>
                <Link
                  to="/perfil"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'var(--color-primary-500)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}
                >
                  <FaUserCircle size={14} /> Mi Perfil
                </Link>



                {/* Doctor link móvil */}
                {user?.role === 'doctor' && (
                  <Link
                    to="/doctor"
                    onClick={() => setIsOpen(false)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: '#0369a1',
                      background: '#0369a112',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <FaStethoscope size={14} /> Panel Médico
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                  textAlign: 'center',
                }}
              >
                Iniciar Sesión
              </Link>
            )}

            {/* Language Selector (Mobile Nav Drawer) */}
            <div style={{
              padding: '0.75rem 1rem',
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              borderTop: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`,
              marginTop: '0.5rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-surface-400)' }}>Idioma / Language</div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => selectLanguage(lang.code)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.4rem 0.65rem', borderRadius: '8px',
                      border: `1.5px solid ${activeLang.code === lang.code ? 'var(--color-primary-500)' : (dark ? '#272530' : '#e8ddd0')}`,
                      background: activeLang.code === lang.code ? (dark ? 'rgba(135,18,51,0.15)' : 'var(--color-primary-50)') : 'transparent',
                      color: activeLang.code === lang.code ? 'var(--color-primary-500)' : 'var(--color-surface-700)',
                      fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* ── Wearable Connection Modal Overlay ── */}
      {showWearableModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '1rem',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--color-surface-50)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '460px',
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid var(--color-surface-200)',
            position: 'relative',
            animation: 'wearable-modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdWatch size={20} style={{ color: 'var(--color-primary-500)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
                  Monitoreo con Wearables
                </h3>
              </div>
              <button
                onClick={() => setShowWearableModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)', fontSize: '1.2rem', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary-500)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-surface-400)'}
              >
                <FaTimes />
              </button>
            </div>
            
            <WearableSection isModal={true} />
          </div>
        </div>,
        document.body
      )}
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 1101px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
