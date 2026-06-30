import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // Read persisted preference; default = false (light mode)
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('jcs_dark_mode') === 'true'
    } catch {
      return false
    }
  })

  // Apply / remove 'dark' class on <html> whenever state changes
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('jcs_dark_mode', String(dark))
    } catch { /* ignore */ }
  }, [dark])

  const toggleDark = useCallback(() => {
    setDark(d => {
      const nextDark = !d
      try {
        localStorage.setItem('jcs_dark_mode', String(nextDark))
      } catch (e) { /* ignore */ }

      // Check if page has been translated to trigger a reload to prevent React crash
      const isTranslated = document.documentElement.classList.contains('translated-ltr') ||
                           document.documentElement.classList.contains('translated-rtl') ||
                           (document.cookie.includes('googtrans') && !document.cookie.includes('googtrans=/es/es') && !document.cookie.includes('googtrans=/es/'));

      if (isTranslated) {
        window.location.reload()
      }
      return nextDark
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
