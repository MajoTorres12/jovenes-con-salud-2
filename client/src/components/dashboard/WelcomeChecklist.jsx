import { useState, useEffect } from 'react'
import { FaCheckCircle, FaRegCircle, FaRocket, FaTimes, FaCompass, FaHeart, FaPills } from 'react-icons/fa'
import { MdWatch } from 'react-icons/md'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

export default function WelcomeChecklist({ stats, records, user, onStartTour, onDismiss }) {
  const { dark } = useTheme()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('jcs_checklist_dismissed') === 'true' || user?.hasCompletedOnboarding) {
      setDismissed(true)
    }
  }, [user?.hasCompletedOnboarding])

  const tourDone = localStorage.getItem('jcs_tour_completed') === 'true'
  const recordDone = (records && records.length > 0) || (stats?.latest && Object.values(stats.latest).some(Boolean))
  const treatmentDone = localStorage.getItem('jcs_treatment_added') === 'true'
  const wearableDone = !!user?.wearableConnected

  const tasks = [
    {
      id: 'tour',
      label: 'Realiza el tour guiado por la plataforma',
      icon: FaCompass,
      done: tourDone,
      action: onStartTour,
      actionText: 'Iniciar Tour',
    },
    {
      id: 'record',
      label: 'Registra tu primera medición de salud (Peso, Glucosa, etc.)',
      icon: FaHeart,
      done: recordDone,
    },
    {
      id: 'treatment',
      label: 'Agrega un medicamento o suplemento en tu historial',
      icon: FaPills,
      done: treatmentDone,
    },
    {
      id: 'wearable',
      label: 'Conecta o simula la sincronización con tu reloj inteligente',
      icon: MdWatch,
      done: wearableDone,
    },
  ]

  const completedCount = tasks.filter(t => t.done).length
  const progressPercent = Math.round((completedCount / tasks.length) * 100)

  useEffect(() => {
    if (progressPercent === 100 && !user?.hasCompletedOnboarding) {
      try {
        api.put('/profile/onboarding-complete')
      } catch (err) {
        console.error('Error completando onboarding:', err)
      }
    }
  }, [progressPercent, user?.hasCompletedOnboarding])

  const handleDismiss = () => {
    localStorage.setItem('jcs_checklist_dismissed', 'true')
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <div style={{
      background: dark ? 'var(--color-surface-100)' : 'white',
      borderRadius: 'var(--radius-xl)',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      boxShadow: 'var(--shadow-card)',
      border: '1px solid var(--color-theme-accent-border)',
      position: 'relative',
      animation: 'fadeInUp 0.3s ease-out',
    }}>
      {/* Botón de cerrar */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-surface-400)', fontSize: '0.9rem',
          padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', transition: 'all 0.2s',
        }}
        title="Ocultar checklist"
      >
        <FaTimes />
      </button>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          boxShadow: '0 4px 10px rgba(135, 18, 51, 0.2)', flexShrink: 0,
        }}>
          <FaRocket size={18} />
        </div>
        <div style={{ flex: 1, paddingRight: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
              Tus Primeros Pasos en Jóvenes con Salud 🚀
            </h3>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-primary-500)' }}>
              {progressPercent}% completado
            </span>
          </div>
          {/* Barra de progreso */}
          <div style={{ width: '100%', height: '7px', background: dark ? 'var(--color-surface-300)' : '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-accent-500))',
              borderRadius: '9999px', transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem', marginTop: '0.85rem' }}>
        {tasks.map(task => {
          const TaskIcon = task.icon
          return (
            <div
              key={task.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem',
                padding: '0.65rem 0.85rem', borderRadius: '10px',
                background: task.done 
                  ? (dark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4')
                  : (dark ? 'var(--color-surface-200)' : '#f8fafc'),
                border: task.done 
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid var(--color-surface-200)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                {task.done ? (
                  <FaCheckCircle style={{ color: '#10b981', fontSize: '1rem', flexShrink: 0 }} />
                ) : (
                  <FaRegCircle style={{ color: 'var(--color-surface-400)', fontSize: '1rem', flexShrink: 0 }} />
                )}
                <span style={{
                  fontSize: '0.82rem', fontWeight: '500',
                  color: task.done ? (dark ? '#a7f3d0' : '#065f46') : 'var(--color-surface-700)',
                  textDecoration: task.done ? 'line-through' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {task.label}
                </span>
              </div>
              {task.action && !task.done && (
                <button
                  onClick={task.action}
                  style={{
                    padding: '0.2rem 0.55rem', borderRadius: '6px',
                    background: 'var(--color-primary-500)', color: 'white',
                    border: 'none', fontSize: '0.72rem', fontWeight: '600',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {task.actionText}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
