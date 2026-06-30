import { useState } from 'react'
import { FaCalculator, FaInfoCircle, FaChartBar } from 'react-icons/fa'
import { HiArrowRight } from 'react-icons/hi'
import { Link } from 'react-router-dom'

const categories = [
  { label: 'Bajo peso', range: '< 18.5', color: '#3b82f6', bg: '#3b82f615', emoji: '💙' },
  { label: 'Normal', range: '18.5 – 24.9', color: '#10b981', bg: '#10b98115', emoji: '💚' },
  { label: 'Sobrepeso', range: '25.0 – 29.9', color: '#c2a378', bg: '#c2a37815', emoji: '💛' },
  { label: 'Obesidad Grado I', range: '30.0 – 34.9', color: '#f59e0b', bg: '#f59e0b15', emoji: '🟠' },
  { label: 'Obesidad Grado II', range: '35.0 – 39.9', color: '#d65c7e', bg: '#d65c7e15', emoji: '🔴' },
  { label: 'Obesidad Grado III', range: '≥ 40.0', color: '#871233', bg: '#87123315', emoji: '🟣' },
]

function getCategory(bmi) {
  if (bmi < 18.5) return categories[0]
  if (bmi < 25) return categories[1]
  if (bmi < 30) return categories[2]
  if (bmi < 35) return categories[3]
  if (bmi < 40) return categories[4]
  return categories[5]
}

export default function BMICalculator() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [result, setResult] = useState(null)

  const calculate = (e) => {
    e.preventDefault()
    const w = parseFloat(weight)
    const h = parseFloat(height) / 100 // cm to m
    if (w > 0 && h > 0) {
      const bmi = w / (h * h)
      setResult({ bmi: bmi.toFixed(1), category: getCategory(bmi) })
    }
  }

  const reset = () => {
    setWeight('')
    setHeight('')
    setResult(null)
  }

  const inputStyle = {
    width: '100%', padding: '0.875rem 1rem',
    borderRadius: 'var(--radius-lg)',
    border: '2px solid var(--color-surface-200)',
    fontSize: '1rem', outline: 'none', fontFamily: 'inherit',
    background: 'white', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '1rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1rem', borderRadius: '9999px',
          background: 'var(--color-primary-50)', color: 'var(--color-primary-500)',
          fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem',
        }}>
          <FaCalculator /> Herramienta de Salud
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>
          Calculadora de IMC
        </h1>
        <p style={{ color: 'var(--color-surface-500)', maxWidth: '500px', margin: '0 auto' }}>
          El Índice de Masa Corporal te ayuda a evaluar si tu peso es adecuado para tu estatura.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Calculator */}
        <div className="animate-fade-in-up" style={{
          background: 'white', borderRadius: 'var(--radius-xl)',
          padding: '2rem', boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-surface-200)',
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-800)', marginBottom: '1.25rem' }}>
            Ingresa tus datos
          </h2>
          <form onSubmit={calculate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-600)', marginBottom: '0.4rem' }}>
                Peso (kg)
              </label>
              <input
                type="number" step="0.1" min="20" max="300"
                placeholder="Ej: 70" value={weight}
                onChange={e => setWeight(e.target.value)}
                required style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-600)', marginBottom: '0.4rem' }}>
                Estatura (cm)
              </label>
              <input
                type="number" step="0.1" min="100" max="250"
                placeholder="Ej: 175" value={height}
                onChange={e => setHeight(e.target.value)}
                required style={inputStyle}
              />
            </div>
            <button type="submit" style={{
              padding: '0.875rem', borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
              color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'all 0.2s',
            }}>
              <FaCalculator /> Calcular IMC
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className="animate-fade-in" style={{
              marginTop: '1.5rem', padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              background: result.category.bg,
              border: `2px solid ${result.category.color}30`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: result.category.color, marginBottom: '0.25rem' }}>
                {result.bmi}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 1rem', borderRadius: '9999px',
                background: `${result.category.color}20`, color: result.category.color,
                fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem',
              }}>
                {result.category.emoji} {result.category.label}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-surface-500)', lineHeight: 1.6 }}>
                {parseFloat(result.bmi) < 18.5 && 'Tu peso es inferior al recomendado. Consulta a un nutriólogo para un plan alimenticio adecuado.'}
                {parseFloat(result.bmi) >= 18.5 && parseFloat(result.bmi) < 25 && '¡Felicidades! Tu peso está en un rango saludable. Mantén tus hábitos de alimentación y ejercicio.'}
                {parseFloat(result.bmi) >= 25 && parseFloat(result.bmi) < 30 && 'Tu peso es superior al recomendado. Considera mejorar tu dieta y aumentar la actividad física.'}
                {parseFloat(result.bmi) >= 30 && 'Es importante que consultes a un médico para evaluación y orientación profesional.'}
              </p>
              <button onClick={reset} style={{
                marginTop: '0.75rem', padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-surface-200)',
                background: 'white', fontSize: '0.8rem', fontWeight: '600',
                color: 'var(--color-surface-500)', cursor: 'pointer',
              }}>
                Calcular de nuevo
              </button>
            </div>
          )}
        </div>

        {/* Reference table */}
        <div className="animate-fade-in-up stagger-2">
          <div style={{
            background: 'white', borderRadius: 'var(--radius-xl)',
            padding: '2rem', boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-surface-200)',
            marginBottom: '1.25rem',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-800)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaChartBar style={{ color: 'var(--color-primary-500)' }} /> Tabla de Referencia
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categories.map((cat, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.7rem 0.9rem', borderRadius: 'var(--radius-lg)',
                  background: result?.category?.label === cat.label ? cat.bg : 'var(--color-surface-50)',
                  border: result?.category?.label === cat.label ? `2px solid ${cat.color}40` : '2px solid transparent',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{cat.emoji}</span>
                    <span style={{
                      fontSize: '0.85rem', fontWeight: '600',
                      color: result?.category?.label === cat.label ? cat.color : 'var(--color-surface-700)',
                    }}>
                      {cat.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--color-surface-400)' }}>
                    {cat.range}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: '1.25rem', borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-accent-50))',
            border: '1px solid var(--color-primary-100)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <FaInfoCircle style={{ color: 'var(--color-primary-500)', marginTop: '0.15rem', flexShrink: 0 }} />
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-primary-700)', marginBottom: '0.3rem' }}>
                  Nota Importante
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-surface-600)', lineHeight: 1.7 }}>
                  El IMC es una medida general y no considera factores como masa muscular, distribución de grasa o composición corporal.
                  Siempre consulta a un profesional de salud para una evaluación completa.
                </p>
                <Link to="/enfermedades/obesidad" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  color: 'var(--color-primary-500)', fontWeight: '600', fontSize: '0.8rem',
                  textDecoration: 'none', marginTop: '0.5rem',
                }}>
                  Más sobre obesidad <HiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
