import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FaHeartbeat, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const onSubmit = async (data) => {
    setApiError('')
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al iniciar sesión. Intenta de nuevo.')
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <FaHeartbeat style={{ fontSize: '1.5rem', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
            Iniciar Sesión
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>
            Accede a tu panel de salud personalizado
          </p>
        </div>

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
                {...register('email', { required: 'El correo es requerido' })}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius-lg)', border: `2px solid ${errors.email ? 'var(--color-error)' : 'var(--color-surface-200)'}`,
                  fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            </div>
            {errors.email && <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', marginTop: '0.25rem', display: 'block' }}>{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)', fontSize: '0.85rem' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', { required: 'La contraseña es requerida' })}
                style={{
                  width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius-lg)', border: `2px solid ${errors.password ? 'var(--color-error)' : 'var(--color-surface-200)'}`,
                  fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/recuperar" style={{ fontSize: '0.85rem', color: 'var(--color-primary-500)', textDecoration: 'none', fontWeight: '500' }}>
              ¿Olvidaste tu contraseña?
            </Link>
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
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-surface-500)', marginTop: '1.5rem' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" style={{ color: 'var(--color-primary-500)', fontWeight: '600', textDecoration: 'none' }}>
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
