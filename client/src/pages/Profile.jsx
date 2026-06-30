import { useState } from 'react'
import { FaUser, FaLock, FaEnvelope, FaCalendar, FaCheck, FaExclamationCircle } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'

export default function Profile() {
  const { user, setUser } = useAuth()
  const { dark, toggleDark } = useTheme()
  const [activeTab, setActiveTab] = useState('info')
  const [name, setName] = useState(user?.name || '')
  const [birthDate, setBirthDate] = useState(user?.birthDate?.slice(0, 10) || '')
  const [profileMsg, setProfileMsg] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const res = await api.put('/profile', { name, birthDate })
      setUser(res.data.user)
      setProfileMsg({ type: 'success', text: 'Perfil actualizado exitosamente' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Error al actualizar' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    setSavingPassword(true)
    try {
      await api.put('/profile/password', { currentPassword, newPassword })
      setPasswordMsg({ type: 'success', text: 'Contraseña actualizada exitosamente' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Error al cambiar contraseña' })
    } finally {
      setSavingPassword(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)',
    fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
    background: 'white',
    transition: 'border-color 0.2s',
  }

  const tabs = [
    { key: 'info', label: 'Información', icon: FaUser },
    { key: 'password', label: 'Contraseña', icon: FaLock },
  ]

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-400))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
          fontSize: '2rem', color: 'white', fontWeight: '700',
          boxShadow: 'var(--shadow-glow)',
        }}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
          {user?.name}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-surface-400)' }}>
          {user?.email}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
        background: 'var(--color-surface-100)',
        padding: '0.3rem', borderRadius: 'var(--radius-xl)',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: activeTab === t.key ? 'white' : 'transparent',
              boxShadow: activeTab === t.key ? 'var(--shadow-card)' : 'none',
              color: activeTab === t.key ? 'var(--color-primary-500)' : 'var(--color-surface-400)',
              fontWeight: '600', fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              transition: 'all 0.2s',
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Dark Mode Config Card (always visible below tabs or as part of the profile settings, or inside Info/Settings) */}
      <div className="animate-fade-in" style={{
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 2rem',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-surface-200)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{dark ? '🌙' : '☀️'}</span>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>Modo Oscuro</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', margin: 0 }}>Activa el tema oscuro en toda la plataforma</p>
          </div>
        </div>
        <button
          onClick={toggleDark}
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '46px', height: '26px',
            borderRadius: '13px',
            background: dark ? 'var(--color-primary-500)' : 'var(--color-surface-300)',
            transition: 'background 0.25s',
            border: 'none',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <span style={{
            position: 'absolute',
            top: '3px',
            left: dark ? '23px' : '3px',
            width: '20px', height: '20px',
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'left 0.25s',
          }} />
        </button>
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="animate-fade-in" style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-surface-200)',
        }}>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                <FaUser size={12} /> Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                <FaEnvelope size={12} /> Correo electrónico
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{ ...inputStyle, background: 'var(--color-surface-50)', color: 'var(--color-surface-400)', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', marginTop: '0.25rem' }}>
                El correo no se puede cambiar
              </p>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                <FaCalendar size={12} /> Fecha de nacimiento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            {profileMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                background: profileMsg.type === 'success' ? '#10b98115' : '#ef444415',
                color: profileMsg.type === 'success' ? '#059669' : '#dc2626',
                fontSize: '0.85rem', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                {profileMsg.type === 'success' ? <FaCheck size={14} /> : <FaExclamationCircle size={14} />}
                {profileMsg.text}
              </div>
            )}

            <button type="submit" disabled={savingProfile} style={{
              padding: '0.875rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: savingProfile ? 'var(--color-surface-300)' : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
              color: 'white',
              fontSize: '0.95rem', fontWeight: '600',
              cursor: savingProfile ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}>
              {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="animate-fade-in" style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-surface-200)',
        }}>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                Contraseña actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite la nueva contraseña"
                style={inputStyle}
              />
            </div>

            {passwordMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                background: passwordMsg.type === 'success' ? '#10b98115' : '#ef444415',
                color: passwordMsg.type === 'success' ? '#059669' : '#dc2626',
                fontSize: '0.85rem', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                {passwordMsg.type === 'success' ? <FaCheck size={14} /> : <FaExclamationCircle size={14} />}
                {passwordMsg.text}
              </div>
            )}

            <button type="submit" disabled={savingPassword} style={{
              padding: '0.875rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: savingPassword ? 'var(--color-surface-300)' : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
              color: 'white',
              fontSize: '0.95rem', fontWeight: '600',
              cursor: savingPassword ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}>
              {savingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
