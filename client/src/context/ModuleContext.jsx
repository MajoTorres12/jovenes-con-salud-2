import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const ModuleContext = createContext(null)

// Fallback defaults in case backend is offline/loading
const DEFAULT_MODULE_MAP = {
  diseases: true,
  hecho_en_tamaulipas: true,
  news: true,
  programs: true,
  contact: true,
  faq: true,
  bmi_calculator: true,
  health_tracking: true,
  virtual_appointments: true,
  universal_medical_history: true,
  chat_assistant: true,
  download_apk: true,
}

export function ModuleProvider({ children }) {
  const [modules, setModules] = useState(DEFAULT_MODULE_MAP)
  const [moduleList, setModuleList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchModules = useCallback(async () => {
    try {
      const res = await api.get('/settings/modules')
      if (res.data?.modules) {
        setModules(res.data.modules)
        setModuleList(res.data.list || [])
      }
    } catch (err) {
      console.warn('Could not fetch module settings:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  const isModuleEnabled = useCallback((key) => {
    if (modules[key] === undefined) return true
    return Boolean(modules[key])
  }, [modules])

  return (
    <ModuleContext.Provider value={{
      modules,
      moduleList,
      loading,
      isModuleEnabled,
      refreshModules: fetchModules,
    }}>
      {children}
    </ModuleContext.Provider>
  )
}

export function useModules() {
  const context = useContext(ModuleContext)
  if (!context) {
    // Return safe fallback if used outside provider
    return {
      modules: DEFAULT_MODULE_MAP,
      moduleList: [],
      loading: false,
      isModuleEnabled: (key) => DEFAULT_MODULE_MAP[key] !== false,
      refreshModules: () => {},
    }
  }
  return context
}
