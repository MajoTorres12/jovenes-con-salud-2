import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FaHeartbeat, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCalendar, FaCheck, FaTimes } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register: formRegister, handleSubmit, formState: { errors }, watch } = useForm()
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()

  const passwordValue = watch('password') || ''
  const isMinLength = passwordValue.length >= 8
  const hasUppercase = /[A-Z]/.test(passwordValue)
  const hasNumber = /\d/.test(passwordValue)

  let score = 0
  if (passwordValue) {
    if (isMinLength) score++
    if (hasUppercase) score++
    if (hasNumber) score++
  }

  const getStrengthProperties = () => {
    if (!passwordValue) return { width: '0%', color: 'transparent', label: '' }
    if (score <= 1) return { width: '33%', color: '#ef4444', label: 'Débil' }
    if (score === 2) return { width: '66%', color: '#f59e0b', label: 'Media' }
    return { width: '100%', color: '#10b981', label: 'Fuerte' }
  }

  const strength = getStrengthProperties()

  const onSubmit = async (data) => {
    setApiError('')
    setIsLoading(true)
    try {
      await authRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        birthDate: data.birthDate,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al crear la cuenta. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
    borderRadius: 'var(--radius-lg)', border: `2px solid ${hasError ? 'var(--color-error)' : 'var(--color-surface-200)'}`,
    fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
  })

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      background: 'linear-gradient(135deg, var(--color-surface-50), var(--color-accent-50))',
    }}>
      <div className="animate-fade-in-up" style={{
        width: '100%', maxWidth: '460px', padding: '2.5rem',
        borderRadius: 'var(--radius-2xl)', background: 'white',
        boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--color-surface-200)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={logo} alt="Jóvenes con Salud" style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-xl)',
            margin: '0 auto 1rem',
            objectFit: 'cover'
          }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
            Crear Cuenta
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>
            Únete y comienza tu seguimiento de salud
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
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
              Nombre completo
            </label>
            <div style={{ position: 'relative' }}>
              <FaUser style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)', fontSize: '0.85rem' }} />
              <input
                type="text"
                placeholder="Juan Pérez García"
                {...formRegister('name', { required: 'El nombre es requerido' })}
                style={inputStyle(errors.name)}
              />
            </div>
            {errors.name && <span style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>{errors.name.message}</span>}
          </div>

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
                {...formRegister('email', { required: 'El correo es requerido', pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' } })}
                style={inputStyle(errors.email)}
              />
            </div>
            {errors.email && <span style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>{errors.email.message}</span>}
          </div>

          {/* Date of Birth */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
              Fecha de nacimiento
            </label>
            <div style={{ position: 'relative' }}>
              <FaCalendar style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)', fontSize: '0.85rem' }} />
              <input
                type="date"
                {...formRegister('birthDate', { required: 'La fecha es requerida' })}
                style={inputStyle(errors.birthDate)}
              />
            </div>
            {errors.birthDate && <span style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>{errors.birthDate.message}</span>}
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
                placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                {...formRegister('password', { 
                  required: 'La contraseña es requerida', 
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                  validate: {
                    hasUppercase: value => /[A-Z]/.test(value) || 'Debe incluir al menos una letra mayúscula.',
                    hasNumber: value => /\d/.test(value) || 'Debe incluir al menos un número.'
                  }
                })}
                style={{ ...inputStyle(errors.password), paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)',
              }}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', marginTop: '0.25rem', display: 'block' }}>{errors.password.message}</span>}

            {/* Password Strength Indicator */}
            {passwordValue && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '8px', background: 'var(--color-surface-50)', border: '1px solid var(--color-surface-200)' }}>
                {/* Bar */}
                <div style={{
                  height: '4px', width: '100%', backgroundColor: 'var(--color-surface-200)',
                  borderRadius: '2px', overflow: 'hidden', position: 'relative'
                }}>
                  <div style={{
                    height: '100%', width: strength.width, backgroundColor: strength.color,
                    transition: 'all 0.3s ease', borderRadius: '2px'
                  }} />
                </div>
                {/* Label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-surface-500)' }}>Fortaleza de contraseña</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: strength.color }}>{strength.label}</span>
                </div>
                {/* Requirements Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: isMinLength ? '#10b981' : 'var(--color-surface-400)' }}>
                    {isMinLength ? <FaCheck size={8} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-surface-300)' }} />}
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: hasUppercase ? '#10b981' : 'var(--color-surface-400)' }}>
                    {hasUppercase ? <FaCheck size={8} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-surface-300)' }} />}
                    <span>Al menos una letra mayúscula</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: hasNumber ? '#10b981' : 'var(--color-surface-400)' }}>
                    {hasNumber ? <FaCheck size={8} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-surface-300)' }} />}
                    <span>Al menos un número</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
              Confirmar contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)', fontSize: '0.85rem' }} />
              <input
                type="password"
                placeholder="Repite tu contraseña"
                {...formRegister('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: value => value === passwordValue || 'Las contraseñas no coinciden'
                })}
                style={inputStyle(errors.confirmPassword)}
              />
            </div>
            {errors.confirmPassword && <span style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>{errors.confirmPassword.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.5rem', padding: '0.875rem',
              borderRadius: 'var(--radius-lg)', border: 'none',
              background: isLoading
                ? 'var(--color-surface-300)'
                : 'linear-gradient(135deg, var(--color-accent-500), var(--color-primary-500))',
              color: 'white', fontSize: '0.95rem', fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 2px 10px rgb(5 150 105 / 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px' }} />
                Creando cuenta...
              </>
            ) : (
              'Crear Mi Cuenta'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-surface-500)', marginTop: '1.5rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary-500)', fontWeight: '600', textDecoration: 'none' }}>
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
