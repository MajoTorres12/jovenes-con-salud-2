import { useState } from 'react'
import { FaMedal, FaLock, FaCheck, FaPalette, FaUndo } from 'react-icons/fa'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

// Define the 6 badges with their requirements and colors
const BADGES_CONFIG = [
  {
    id: 'bronze',
    name: 'Insignia de Bronce',
    daysRequired: 3,
    color: '#cd7f32',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    iconColor: '#f59e0b',
    description: 'Registra tus datos de salud por 3 días seguidos.'
  },
  {
    id: 'silver',
    name: 'Insignia de Plata',
    daysRequired: 7,
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #cbd5e1 0%, #4b5563 100%)',
    iconColor: '#9ca3af',
    description: 'Registra tus datos de salud por 7 días seguidos.'
  },
  {
    id: 'gold',
    name: 'Insignia de Oro',
    daysRequired: 14,
    color: '#ca8a04',
    gradient: 'linear-gradient(135deg, #fef08a 0%, #ca8a04 100%)',
    iconColor: '#eab308',
    description: 'Registra tus datos de salud por 14 días seguidos.'
  },
  {
    id: 'emerald',
    name: 'Insignia de Esmeralda',
    daysRequired: 30,
    color: '#059669',
    gradient: 'linear-gradient(135deg, #a7f3d0 0%, #059669 100%)',
    iconColor: '#10b981',
    description: 'Mantén hábitos saludables y registra 30 días seguidos.'
  },
  {
    id: 'sapphire',
    name: 'Insignia de Zafiro',
    daysRequired: 60,
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #bfdbfe 0%, #1d4ed8 100%)',
    iconColor: '#3b82f6',
    description: 'Demuestra disciplina registrando 60 días seguidos.'
  },
  {
    id: 'diamond',
    name: 'Insignia de Diamante',
    daysRequired: 90,
    color: '#0891b2',
    gradient: 'linear-gradient(135deg, #a5f3fc 0%, #0891b2 100%)',
    iconColor: '#06b6d4',
    description: '¡Nivel Leyenda! Registra tus hábitos por 90 días seguidos.'
  }
]

export default function StreakBadges({ maxStreak = 0, currentUser = null, onThemeUpdated = () => {}, plain = false }) {
  const { dark } = useTheme()
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleApplyThemeColor = async (color) => {
    setSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      const { data } = await api.put('/profile/theme', { themeColor: color })
      onThemeUpdated(data.themeColor)
      setSuccessMsg('¡Color de personalización aplicado exitosamente!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      console.error('Error al aplicar el tema de color:', err)
      setErrorMsg('No se pudo aplicar el color. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetTheme = async () => {
    await handleApplyThemeColor(null)
  }

  return (
    <div style={plain ? {
      padding: '1.5rem 0 0 0',
      borderTop: `1px solid ${dark ? 'var(--color-surface-300)' : '#f1f5f9'}`,
      marginTop: '1.5rem'
    } : {
      background: dark ? 'var(--color-surface-100)' : 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: 'var(--shadow-card)',
      border: `1px solid ${dark ? 'var(--color-surface-300)' : '#f1f5f9'}`,
      marginTop: '2rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: dark ? '#ffffff' : '#1e293b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaMedal style={{ color: 'var(--color-primary-500)' }} /> Insignias y Logros
          </h2>
          <p style={{ color: dark ? '#cbd5e1' : '#64748b', fontSize: '0.88rem' }}>
            Desbloquea insignias logrando rachas de registro y personaliza el panel Mi Salud. Tu racha máxima es de <strong>{maxStreak} {maxStreak === 1 ? 'día' : 'días'}</strong>.
          </p>
        </div>

        {currentUser?.themeColor && (
          <button
            onClick={handleResetTheme}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: dark ? 'var(--color-surface-200)' : '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: dark ? '#f1f5f9' : '#475569',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.85rem',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = dark ? 'var(--color-surface-300)' : '#e2e8f0'}
            onMouseOut={(e) => e.currentTarget.style.background = dark ? 'var(--color-surface-200)' : '#f1f5f9'}
          >
            <FaUndo size={12} /> Restaurar Tema
          </button>
        )}
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaCheck /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Grid de insignias */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
        marginTop: '1rem'
      }}>
        {BADGES_CONFIG.map((badge) => {
          const isUnlocked = maxStreak >= badge.daysRequired
          const isActiveTheme = currentUser?.themeColor === badge.color
          const progress = Math.min((maxStreak / badge.daysRequired) * 100, 100)

          return (
            <div
              key={badge.id}
              style={{
                borderRadius: '12px',
                border: isActiveTheme 
                  ? `2px solid ${badge.color}` 
                  : `1px solid ${dark ? 'var(--color-surface-300)' : '#e2e8f0'}`,
                padding: '1.25rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: isUnlocked 
                  ? (dark ? 'var(--color-surface-200)' : '#ffffff') 
                  : (dark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
                opacity: isUnlocked ? 1 : 0.8,
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: isActiveTheme ? `0 0 12px ${badge.color}25` : 'none',
              }}
              onMouseOver={(e) => {
                if (isUnlocked) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = isActiveTheme 
                    ? `0 4px 15px ${badge.color}35` 
                    : '0 4px 12px rgba(0,0,0,0.05)'
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = isActiveTheme 
                  ? `0 0 12px ${badge.color}25` 
                  : 'none'
              }}
            >
              {/* Contenido Superior */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  {/* Contenedor del Icono con Gradiente */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: isUnlocked ? badge.gradient : (dark ? 'var(--color-surface-300)' : '#e2e8f0'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isUnlocked ? '#ffffff' : (dark ? 'rgba(255,255,255,0.3)' : '#94a3b8'),
                    boxShadow: isUnlocked ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                    flexShrink: 0
                  }}>
                    {isUnlocked ? (
                      <FaMedal size={24} />
                    ) : (
                      <FaLock size={20} />
                    )}
                  </div>

                  <div>
                    <h3 style={{
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      color: isUnlocked 
                        ? (dark ? '#ffffff' : '#1e293b') 
                        : (dark ? 'rgba(255,255,255,0.4)' : '#64748b')
                    }}>
                      {badge.name}
                    </h3>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: badge.color,
                      background: `${badge.color}15`,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px'
                    }}>
                      {badge.daysRequired} días
                    </span>
                  </div>
                </div>

                <p style={{
                  color: isUnlocked 
                    ? (dark ? '#cbd5e1' : '#475569') 
                    : (dark ? 'rgba(255,255,255,0.3)' : '#94a3b8'),
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  marginBottom: '1rem'
                }}>
                  {badge.description}
                </p>
              </div>

              {/* Contenido Inferior (Progreso y Acciones) */}
              <div style={{ marginTop: 'auto' }}>
                {!isUnlocked ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: dark ? '#cbd5e1' : '#64748b', marginBottom: '0.25rem' }}>
                      <span>Progreso</span>
                      <span>{maxStreak} / {badge.daysRequired} días</span>
                    </div>
                    {/* Barra de Progreso */}
                    <div style={{ width: '100%', height: '6px', background: dark ? 'var(--color-surface-300)' : '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: '#94a3b8', borderRadius: '3px', transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isActiveTheme ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        color: badge.color,
                        fontWeight: 'bold',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        background: `${badge.color}15`,
                        width: '100%',
                        justifyContent: 'center'
                      }}>
                        <FaCheck size={12} /> Color Activo
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApplyThemeColor(badge.color)}
                        disabled={saving}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8rem',
                          background: badge.color,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.4rem 0.75rem',
                          cursor: 'pointer',
                          fontWeight: '600',
                          width: '100%',
                          justifyContent: 'center',
                          transition: 'opacity 0.2s',
                          boxShadow: `0 2px 6px ${badge.color}40`
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <FaPalette size={12} /> Usar Color
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
