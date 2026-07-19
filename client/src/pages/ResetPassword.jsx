import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import api from '../services/api'
import logo from '../assets/logo.png'

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [apiSuccess, setApiSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(3)

  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const passwordValue = watch('password')

  const onSubmit = async (data) => {
    if (!token) {
      setApiError('Falta el token de restablecimiento de contraseña.')
      return
    }
    setApiError('')
    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.password
      })
      setApiSuccess('Contraseña restablecida exitosamente. Redirigiendo...')
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al restablecer la contraseña. Intente solicitar un nuevo enlace.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (apiSuccess) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            navigate('/login')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [apiSuccess, navigate])

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
            Restablecer Contraseña
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>
            Ingresa tu nueva contraseña para ingresar a tu cuenta
          </p>
        </div>

        {/* Success Alert & Redirect */}
        {apiSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <FaCheckCircle style={{ color: '#10b981', fontSize: '3rem', marginBottom: '1rem' }} />
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#047857',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              {apiSuccess}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-surface-500)' }}>
              Redirigiendo al inicio de sesión en <strong>{countdown}</strong> segundos...
            </p>
          </div>
        ) : (
          <>
            {/* Missing Token Warning */}
            {!token && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                color: '#b45309',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: 1.4
              }}>
                <FaExclamationTriangle size={20} style={{ flexShrink: 0 }} />
                <span>No se ha proporcionado un token válido. Solicita un nuevo enlace desde la sección de recuperar cuenta.</span>
              </div>
            )}

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
              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                  Nueva Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <FaLock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)', fontSize: '0.85rem' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    disabled={!token}
                    {...register('password', { 
                      required: 'La contraseña es requerida',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                      }
                    })}
                    style={{
                      width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                      borderRadius: 'var(--radius-lg)', border: `2px solid ${errors.password ? 'var(--color-error)' : 'var(--color-surface-200)'}`,
                      fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!token}
                    style={{
                      position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-surface-400)', fontSize: '0.9rem',
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', marginTop: '0.25rem', display: 'block' }}>{errors.password.message}</span>}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                  Confirmar Nueva Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <FaLock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)', fontSize: '0.85rem' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    disabled={!token}
                    {...register('confirmPassword', { 
                      required: 'Confirma la contraseña',
                      validate: value => value === passwordValue || 'Las contraseñas no coinciden'
                    })}
                    style={{
                      width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                      borderRadius: 'var(--radius-lg)', border: `2px solid ${errors.confirmPassword ? 'var(--color-error)' : 'var(--color-surface-200)'}`,
                      fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={!token}
                    style={{
                      position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-surface-400)', fontSize: '0.9rem',
                    }}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', marginTop: '0.25rem', display: 'block' }}>{errors.confirmPassword.message}</span>}
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                style={{
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: isLoading || !token
                    ? 'var(--color-surface-300)'
                    : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: isLoading || !token ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading || !token ? 'none' : '0 2px 10px rgb(30 64 175 / 0.3)',
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
                    Restableciendo...
                  </>
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/login" style={{
                color: 'var(--color-surface-500)',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.88rem'
              }}>
                Ir al Inicio de Sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
