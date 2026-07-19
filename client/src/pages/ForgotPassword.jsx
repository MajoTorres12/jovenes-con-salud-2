import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa'
import api from '../services/api'
import logo from '../assets/logo.png'

export default function ForgotPassword() {
  const [apiError, setApiError] = useState('')
  const [apiSuccess, setApiSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setApiError('')
    setApiSuccess('')
    setIsLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email })
      setApiSuccess(res.data.message || 'Si tu correo electrónico está registrado, recibirás un enlace de recuperación.')
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al procesar la solicitud. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      background: 'linear-gradient(135deg, var(--color-surface-50), var(--color-primary-50))',
    }}>
      <div className="animate-fade-in-up" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        borderRadius: 'var(--radius-2xl)',
        background: 'white',
        boxShadow: 'var(--shadow-elevated)',
        border: '1px solid var(--color-surface-200)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={logo} alt="Jóvenes con Salud" style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-xl)',
            margin: '0 auto 1rem',
            objectFit: 'cover'
          }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
            Recuperar Cuenta
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>
            Ingresa tu correo y te enviaremos un enlace de recuperación
          </p>
        </div>

        {/* Success Alert */}
        {apiSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <FaCheckCircle style={{ color: '#10b981', fontSize: '3rem', marginBottom: '1rem' }} />
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#047857',
              fontSize: '0.88rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
            }}>
              {apiSuccess}
            </div>
            <Link to="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-primary-500)',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}>
              <FaArrowLeft size={12} /> Volver al Inicio de Sesión
            </Link>
          </div>
        ) : (
          <>
            {/* API Error */}
            {apiError && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--color-error)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                textAlign: 'center',
              }}>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                  Correo electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <FaEnvelope style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)', fontSize: '0.85rem' }} />
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    {...register('email', { 
                      required: 'El correo es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Correo electrónico no válido'
                      }
                    })}
                    style={{
                      width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: 'var(--radius-lg)', border: `2px solid ${errors.email ? 'var(--color-error)' : 'var(--color-surface-200)'}`,
                      fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                    }}
                  />
                </div>
                {errors.email && <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', marginTop: '0.25rem', display: 'block' }}>{errors.email.message}</span>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: isLoading
                    ? 'var(--color-surface-300)'
                    : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading ? 'none' : '0 2px 10px rgb(30 64 175 / 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {isLoading ? (
                  <>
                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                    Enviando enlace...
                  </>
                ) : (
                  'Enviar Enlace'
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/login" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--color-surface-500)',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.88rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary-500)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-surface-500)'}
              >
                <FaArrowLeft size={10} /> Regresar al Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
