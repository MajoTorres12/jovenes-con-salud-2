import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FaArrowLeft, FaFileMedical, FaUser, FaIdCard, FaTint, FaHeartbeat,
  FaExclamationTriangle, FaPlus, FaTimes, FaFileUpload, FaFilePdf,
  FaDownload, FaTrash, FaCheck, FaBuilding, FaNotesMedical, FaSearch,
  FaFileDownload, FaInfoCircle, FaLink, FaHospital, FaSync, FaCheckCircle,
  FaShieldAlt, FaMedkit, FaPills, FaSyringe, FaRunning, FaStethoscope,
  FaExternalLinkAlt, FaSmoking, FaWineGlass, FaAppleAlt
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api, { getApiBaseUrl } from '../services/api'
import { generateClinicalReportPDF } from '../utils/clinicalReportPdf'

const API_BASE = getApiBaseUrl()

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

const COMMON_VACCINES = [
  'BCG (Tuberculosis)',
  'Hepatitis B',
  'Hexavalente / Pentavalente',
  'DPT (Difteria, Tétanos, Tosferina)',
  'Rotavirus',
  'Neumocócica Conjugada',
  'SRP (Sarampión, Rubéola, Parotiditis)',
  'Influenza Estacional',
  'COVID-19',
  'VPH (Virus del Papiloma Humano)',
  'TD / Tetanico',
]

export default function UniversalMedicalHistory() {
  const { user } = useAuth()
  const { dark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Datos externos sincronizados del Dashboard de Salud
  const [healthRecords, setHealthRecords] = useState([])
  const [medications, setMedications] = useState([])

  // Expediente State
  const [history, setHistory] = useState({
    curp: '',
    nss: '',
    bloodType: 'O+',
    organDonor: false,
    allergies: [],
    hereditaryDiseases: [],
    personalPathologies: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    diagnoses: [],
    labReports: [],
    vaccines: [],
    nonPathologicalHistory: {
      smoking: 'Nunca',
      alcohol: 'Nunca',
      exercise: 'Ocasional',
      diet: 'Equilibrada',
      substances: 'Ninguna',
    },
    clinicalNotes: [],
  })

  // Inputs para agregar elementos
  const [newAllergy, setNewAllergy] = useState('')
  const [newHereditary, setNewHereditary] = useState('')
  const [newPathology, setNewPathology] = useState('')

  // Formulario nuevo diagnóstico CIE-10
  const [showDiagForm, setShowDiagForm] = useState(false)
  const [diagForm, setDiagForm] = useState({ code: '', name: '', status: 'En Tratamiento' })

  // Formulario subir PDF
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfForm, setPdfForm] = useState({
    title: '',
    labName: '',
    date: new Date().toISOString().slice(0, 10),
    file: null,
  })

  // Formulario nueva Vacuna
  const [showVaccineModal, setShowVaccineModal] = useState(false)
  const [vaccineForm, setVaccineForm] = useState({
    name: 'BCG (Tuberculosis)',
    customName: '',
    date: new Date().toISOString().slice(0, 10),
    lot: '',
    institution: 'IMSS / Centro de Salud',
    status: 'Aplicada',
  })

  // Formulario nueva Nota de Evolución (SOAP)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteForm, setNoteForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    doctor: '',
    subjective: '',
    objective: '',
    analysis: '',
    plan: '',
  })

  // Estado de instituciones vinculadas
  const institutionIcons = {
    'imss': <FaHospital size={22} />,
    'issste': <FaBuilding size={22} />,
    'imss-bienestar': <FaMedkit size={22} />,
    'seguro-privado': <FaShieldAlt size={22} />,
  }
  const [linkedInstitutions, setLinkedInstitutions] = useState([
    { id: 'imss', name: 'IMSS', fullName: 'Instituto Mexicano del Seguro Social', color: '#00723f', linked: false, code: '', lastSync: null },
    { id: 'issste', name: 'ISSSTE', fullName: 'Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado', color: '#1e3a5f', linked: false, code: '', lastSync: null },
    { id: 'imss-bienestar', name: 'IMSS-Bienestar', fullName: 'IMSS-Bienestar (antes INSABI)', color: '#6b8e23', linked: false, code: '', lastSync: null },
    { id: 'seguro-privado', name: 'Seguro Privado', fullName: 'Seguro de Gastos Médicos Mayores (Privado)', color: '#7c3aed', linked: false, code: '', lastSync: null },
  ])
  const [linkingId, setLinkingId] = useState(null)

  const handleLinkInstitution = (instId) => {
    setLinkedInstitutions(prev => prev.map(inst => {
      if (inst.id !== instId) return inst
      if (!inst.code.trim()) {
        alert('Ingresa tu número de beneficiario o póliza.')
        return inst
      }
      return { ...inst, linked: true, lastSync: new Date().toISOString() }
    }))
    setLinkingId(null)
    setSuccessMsg('Institución vinculada exitosamente. Los datos se sincronizarán en la próxima conexión disponible.')
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  const handleUnlinkInstitution = (instId) => {
    if (!window.confirm('¿Desvincular esta institución? Se mantendrán los datos previamente importados.')) return
    setLinkedInstitutions(prev => prev.map(inst =>
      inst.id === instId ? { ...inst, linked: false, code: '', lastSync: null } : inst
    ))
  }

  const handleSyncInstitution = (instId) => {
    setLinkedInstitutions(prev => prev.map(inst =>
      inst.id === instId ? { ...inst, lastSync: new Date().toISOString() } : inst
    ))
    setSuccessMsg(`Sincronización con ${linkedInstitutions.find(i => i.id === instId)?.name} solicitada. Los datos se actualizarán cuando la institución responda.`)
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  // Cargar expediente al montar
  useEffect(() => {
    fetchMedicalHistory()
  }, [])

  const fetchMedicalHistory = async () => {
    setLoading(true)
    try {
      const [historyRes, healthRes, medRes] = await Promise.allSettled([
        api.get('/profile/medical-history'),
        api.get('/health-tracking/records', { params: { limit: 50 } }),
        api.get('/medications'),
      ])

      if (historyRes.status === 'fulfilled' && historyRes.value.data?.medicalHistory) {
        const mh = historyRes.value.data.medicalHistory
        setHistory({
          curp: mh.curp || '',
          nss: mh.nss || '',
          bloodType: mh.bloodType || 'O+',
          organDonor: !!mh.organDonor,
          allergies: Array.isArray(mh.allergies) ? mh.allergies : [],
          hereditaryDiseases: Array.isArray(mh.hereditaryDiseases) ? mh.hereditaryDiseases : [],
          personalPathologies: Array.isArray(mh.personalPathologies) ? mh.personalPathologies : [],
          emergencyContactName: mh.emergencyContactName || '',
          emergencyContactPhone: mh.emergencyContactPhone || '',
          emergencyContactRelation: mh.emergencyContactRelation || '',
          diagnoses: Array.isArray(mh.diagnoses) ? mh.diagnoses : [],
          labReports: Array.isArray(mh.labReports) ? mh.labReports : [],
          vaccines: Array.isArray(mh.vaccines) ? mh.vaccines : [],
          nonPathologicalHistory: mh.nonPathologicalHistory || {
            smoking: 'Nunca',
            alcohol: 'Nunca',
            exercise: 'Ocasional',
            diet: 'Equilibrada',
            substances: 'Ninguna',
          },
          clinicalNotes: Array.isArray(mh.clinicalNotes) ? mh.clinicalNotes : [],
        })
      }

      if (healthRes.status === 'fulfilled' && healthRes.value.data) {
        const records = healthRes.value.data.records || healthRes.value.data || []
        setHealthRecords(Array.isArray(records) ? records : [])
      }

      if (medRes.status === 'fulfilled' && medRes.value.data) {
        const meds = medRes.value.data.medications || medRes.value.data || []
        setMedications(Array.isArray(meds) ? meds : [])
      }
    } catch (err) {
      console.error('Error cargando historial médico:', err)
      setErrorMsg('No se pudo cargar el expediente clínico. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveHistory = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const { data } = await api.put('/profile/medical-history', history)
      setSuccessMsg('Expediente clínico actualizado exitosamente.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.error('Error guardando expediente:', err)
      setErrorMsg(err.response?.data?.error || 'Error al guardar los datos del expediente.')
    } finally {
      setSaving(false)
    }
  }

  // Manejo de Vacunas
  const handleAddVaccine = (e) => {
    e.preventDefault()
    const vaccineName = vaccineForm.name === 'Otra...' ? vaccineForm.customName : vaccineForm.name
    if (!vaccineName.trim()) {
      alert('Ingresa el nombre de la vacuna.')
      return
    }
    const newVac = {
      id: Date.now().toString(),
      name: vaccineName.trim(),
      date: vaccineForm.date,
      lot: vaccineForm.lot,
      institution: vaccineForm.institution,
      status: vaccineForm.status,
    }
    setHistory(prev => ({ ...prev, vaccines: [newVac, ...prev.vaccines] }))
    setShowVaccineModal(false)
    setVaccineForm({
      name: 'BCG (Tuberculosis)',
      customName: '',
      date: new Date().toISOString().slice(0, 10),
      lot: '',
      institution: 'IMSS / Centro de Salud',
      status: 'Aplicada',
    })
  }

  const handleRemoveVaccine = (id) => {
    setHistory(prev => ({ ...prev, vaccines: prev.vaccines.filter(v => v.id !== id) }))
  }

  const handleAddDefaultVaccinesScheme = () => {
    if (!window.confirm('¿Agregar el esquema básico de vacunación nacional como pendientes/consultados?')) return
    const defaultScheme = COMMON_VACCINES.map((vName, idx) => ({
      id: `def-${Date.now()}-${idx}`,
      name: vName,
      date: new Date().toISOString().slice(0, 10),
      lot: '',
      institution: 'Cartilla Nacional',
      status: 'Aplicada',
    }))
    setHistory(prev => ({
      ...prev,
      vaccines: Array.from(new Set([...prev.vaccines.map(v => v.name), ...defaultScheme.map(s => s.name)]))
        .map(name => prev.vaccines.find(v => v.name === name) || defaultScheme.find(s => s.name === name))
    }))
  }

  // Manejo de Notas Clínicas SOAP
  const handleAddClinicalNote = (e) => {
    e.preventDefault()
    if (!noteForm.subjective.trim() && !noteForm.analysis.trim()) {
      alert('Ingresa al menos el resumen subjetivo o análisis médico.')
      return
    }
    const newNote = {
      id: Date.now().toString(),
      date: noteForm.date,
      doctor: noteForm.doctor.trim() || user?.name || 'Médico Tratante',
      subjective: noteForm.subjective,
      objective: noteForm.objective,
      analysis: noteForm.analysis,
      plan: noteForm.plan,
    }
    setHistory(prev => ({ ...prev, clinicalNotes: [newNote, ...prev.clinicalNotes] }))
    setShowNoteModal(false)
    setNoteForm({
      date: new Date().toISOString().slice(0, 10),
      doctor: '',
      subjective: '',
      objective: '',
      analysis: '',
      plan: '',
    })
  }

  const handleRemoveClinicalNote = (id) => {
    setHistory(prev => ({ ...prev, clinicalNotes: prev.clinicalNotes.filter(n => n.id !== id) }))
  }

  // Manejo de listas
  const addAllergy = () => {
    if (!newAllergy.trim()) return
    setHistory(prev => ({ ...prev, allergies: [...prev.allergies, newAllergy.trim()] }))
    setNewAllergy('')
  }
  const removeAllergy = (idx) => {
    setHistory(prev => ({ ...prev, allergies: prev.allergies.filter((_, i) => i !== idx) }))
  }

  const addHereditary = () => {
    if (!newHereditary.trim()) return
    setHistory(prev => ({ ...prev, hereditaryDiseases: [...prev.hereditaryDiseases, newHereditary.trim()] }))
    setNewHereditary('')
  }
  const removeHereditary = (idx) => {
    setHistory(prev => ({ ...prev, hereditaryDiseases: prev.hereditaryDiseases.filter((_, i) => i !== idx) }))
  }

  const addPathology = () => {
    if (!newPathology.trim()) return
    setHistory(prev => ({ ...prev, personalPathologies: [...prev.personalPathologies, newPathology.trim()] }))
    setNewPathology('')
  }
  const removePathology = (idx) => {
    setHistory(prev => ({ ...prev, personalPathologies: prev.personalPathologies.filter((_, i) => i !== idx) }))
  }

  const handleAddDiagnosis = (e) => {
    e.preventDefault()
    if (!diagForm.name.trim()) return
    const newDiag = {
      id: `diag_${Date.now()}`,
      code: diagForm.code.trim().toUpperCase() || 'CIE-10',
      name: diagForm.name.trim(),
      status: diagForm.status,
      date: new Date().toISOString().slice(0, 10),
    }
    setHistory(prev => ({ ...prev, diagnoses: [newDiag, ...prev.diagnoses] }))
    setDiagForm({ code: '', name: '', status: 'En Tratamiento' })
    setShowDiagForm(false)
  }

  const handleRemoveDiagnosis = (id) => {
    setHistory(prev => ({ ...prev, diagnoses: prev.diagnoses.filter(d => d.id !== id) }))
  }

  // Subir PDF de Análisis Clínico
  const handleUploadPdf = async (e) => {
    e.preventDefault()
    if (!pdfForm.file) {
      alert('Por favor selecciona un archivo PDF.')
      return
    }
    setUploadingPdf(true)
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('pdf', pdfForm.file)
      formData.append('title', pdfForm.title || 'Análisis Clínico')
      formData.append('labName', pdfForm.labName || 'Laboratorio Externo')
      formData.append('date', pdfForm.date)

      const { data } = await api.post('/profile/medical-history/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (data.medicalHistory) {
        setHistory(prev => ({ ...prev, labReports: data.medicalHistory.labReports || [] }))
      }
      setShowPdfModal(false)
      setPdfForm({ title: '', labName: '', date: new Date().toISOString().slice(0, 10), file: null })
      setSuccessMsg('Estudio médico en PDF subido exitosamente.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.error('Error subiendo PDF:', err)
      alert(err.response?.data?.error || 'Error al subir el estudio médico en PDF.')
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleDeletePdf = async (pdfId) => {
    if (!window.confirm('¿Eliminar este análisis médico en PDF?')) return
    try {
      const { data } = await api.delete(`/profile/medical-history/pdf/${pdfId}`)
      if (data.medicalHistory) {
        setHistory(prev => ({ ...prev, labReports: data.medicalHistory.labReports || [] }))
      }
    } catch (err) {
      console.error('Error eliminando PDF:', err)
    }
  }

  // Modal y estado para importación real de archivo FHIR / JSON
  const [showFhirModal, setShowFhirModal] = useState(false)
  const [fhirFile, setFhirFile] = useState(null)

  const handleProcessFhirFile = (e) => {
    e.preventDefault()
    if (!fhirFile) {
      alert('Por favor selecciona un archivo JSON / FHIR.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target.result
        const parsed = JSON.parse(content)

        let importedCurp = parsed.curp || ''
        let importedNss = parsed.nss || ''
        let importedBlood = parsed.bloodType || 'O+'
        let importedDonor = !!parsed.organDonor
        let importedAllergies = Array.isArray(parsed.allergies) ? parsed.allergies : []
        let importedHereditary = Array.isArray(parsed.hereditaryDiseases) ? parsed.hereditaryDiseases : []
        let importedPathologies = Array.isArray(parsed.personalPathologies) ? parsed.personalPathologies : []
        let importedEmergencyName = parsed.emergencyContactName || ''
        let importedEmergencyPhone = parsed.emergencyContactPhone || ''
        let importedEmergencyRelation = parsed.emergencyContactRelation || ''
        let importedDiagnoses = Array.isArray(parsed.diagnoses) ? parsed.diagnoses : []

        // Parse de recurso estándar HL7 FHIR Patient / Bundle si aplica
        if (parsed.resourceType === 'Bundle' || parsed.resourceType === 'Patient') {
          const patientRes = parsed.resourceType === 'Patient'
            ? parsed
            : parsed.entry?.find(e => e.resource?.resourceType === 'Patient')?.resource

          if (patientRes && patientRes.identifier) {
            const curpObj = patientRes.identifier.find(i => i.system?.toUpperCase().includes('CURP') || i.value?.length === 18)
            if (curpObj) importedCurp = curpObj.value
            const nssObj = patientRes.identifier.find(i => i.system?.toUpperCase().includes('NSS'))
            if (nssObj) importedNss = nssObj.value
          }
        }

        setHistory(prev => ({
          ...prev,
          curp: importedCurp || prev.curp,
          nss: importedNss || prev.nss,
          bloodType: importedBlood || prev.bloodType,
          organDonor: importedDonor || prev.organDonor,
          allergies: Array.from(new Set([...prev.allergies, ...importedAllergies])),
          hereditaryDiseases: Array.from(new Set([...prev.hereditaryDiseases, ...importedHereditary])),
          personalPathologies: Array.from(new Set([...prev.personalPathologies, ...importedPathologies])),
          emergencyContactName: importedEmergencyName || prev.emergencyContactName,
          emergencyContactPhone: importedEmergencyPhone || prev.emergencyContactPhone,
          emergencyContactRelation: importedEmergencyRelation || prev.emergencyContactRelation,
          diagnoses: [...importedDiagnoses, ...prev.diagnoses],
        }))

        setShowFhirModal(false)
        setFhirFile(null)
        setSuccessMsg('¡Archivo FHIR / JSON importado correctamente! Haz clic en "Guardar Expediente" para guardar.')
        setTimeout(() => setSuccessMsg(''), 5000)
      } catch (err) {
        console.error('Error procesando archivo FHIR:', err)
        alert('El archivo seleccionado no contiene un formato JSON / FHIR válido.')
      }
    }
    reader.readAsText(fhirFile)
  }

  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  }

  const cardStyle = {
    background: dark ? 'var(--color-surface-100)' : '#ffffff',
    borderRadius: 'var(--radius-2xl)',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--color-theme-accent-border)',
    marginBottom: '1.75rem',
  }

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: `2px solid ${dark ? '#334155' : '#f1f5f9'}`,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-50)' }}>
      <div style={containerStyle}>
        
        {/* Cabecera y Navegación */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div>
            <Link
              to="/perfil"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                color: 'var(--color-primary-500)', fontWeight: '700', fontSize: '0.88rem',
                textDecoration: 'none', marginBottom: '0.5rem'
              }}
            >
              <FaArrowLeft /> Volver a Mi Perfil
            </Link>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-surface-900)', margin: 0 }}>
              Historial Médico Universal 📋
            </h1>
            <p style={{ fontSize: '0.85rem', color: dark ? '#cbd5e1' : 'var(--color-surface-500)', margin: '0.2rem 0 0' }}>
              Expediente Clínico Electrónico (ECE) unificado, antecedentes e integración con instituciones de salud
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={() => setShowFhirModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.1rem', borderRadius: '10px',
                border: '1.5px solid #0369a1', background: 'transparent',
                color: '#0369a1', fontSize: '0.82rem', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              title="Importar archivo real de expediente desde tu dispositivo (HL7 FHIR / JSON)"
            >
              <FaFileDownload /> Importar FHIR / JSON
            </button>

            <button
              onClick={() => generateClinicalReportPDF({
                patient: user,
                medicalHistory: history,
                records: healthRecords,
                medications: medications,
                doctor: { name: 'Dr. Autorizado', professionalLicense: 'MÉDICO-REF' }
              })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.1rem', borderRadius: '10px',
                border: 'none', background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                color: 'white', fontSize: '0.82rem', fontWeight: '700',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(135,18,51,0.25)',
              }}
            >
              <FaFilePdf /> Exportar Expediente PDF
            </button>
          </div>
        </div>

        {/* Notificaciones */}
        {successMsg && (
          <div style={{
            padding: '0.85rem 1.25rem', borderRadius: '12px', background: '#ecfdf5',
            border: '1px solid #10b981', color: '#065f46', fontSize: '0.88rem',
            fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem'
          }}>
            <FaCheck style={{ color: '#10b981' }} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{
            padding: '0.85rem 1.25rem', borderRadius: '12px', background: '#fef2f2',
            border: '1px solid #ef4444', color: '#991b1b', fontSize: '0.88rem',
            fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem'
          }}>
            <FaExclamationTriangle style={{ color: '#ef4444' }} /> {errorMsg}
          </div>
        )}

        {/* Sección de Enlace con Instituciones de Salud */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FaHospital size={20} style={{ color: '#0369a1' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                Enlace con Instituciones de Salud
              </h2>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#e0f2fe', color: '#0369a1', fontWeight: '700' }}>
              Sincronización de Datos
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: dark ? '#94a3b8' : '#64748b', marginBottom: '1.25rem', lineHeight: '1.45' }}>
            Vincula tu cuenta con instituciones de salud públicas y privadas para sincronizar automáticamente tu expediente clínico, citas, recetas y análisis de laboratorio.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {linkedInstitutions.map(inst => (
              <div
                key={inst.id}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '14px',
                  background: dark ? '#1e1c25' : '#ffffff',
                  border: inst.linked
                    ? `2px solid ${inst.color}`
                    : `1.5px solid ${dark ? '#334155' : '#e2e8f0'}`,
                  boxShadow: inst.linked ? `0 2px 12px ${inst.color}20` : '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Cabecera de la institución */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.6rem', color: inst.color, display: 'flex', alignItems: 'center' }}>{institutionIcons[inst.id]}</span>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: dark ? '#fff' : '#0f172a', margin: 0 }}>{inst.name}</h4>
                      <p style={{ fontSize: '0.68rem', color: dark ? '#94a3b8' : '#94a3b8', margin: 0, maxWidth: '200px', lineHeight: '1.3' }}>{inst.fullName}</p>
                    </div>
                  </div>
                  {inst.linked && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.2rem 0.55rem', borderRadius: '20px',
                      background: `${inst.color}15`, color: inst.color,
                      fontSize: '0.7rem', fontWeight: '800',
                    }}>
                      <FaCheckCircle size={10} /> Vinculado
                    </span>
                  )}
                </div>

                {/* Estado: Vinculado */}
                {inst.linked ? (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: dark ? '#cbd5e1' : '#64748b', marginBottom: '0.6rem' }}>
                      <strong>Código de beneficiario:</strong> {inst.code}
                    </div>
                    {inst.lastSync && (
                      <div style={{ fontSize: '0.72rem', color: dark ? '#94a3b8' : '#94a3b8', marginBottom: '0.75rem' }}>
                        Última sincronización: {new Date(inst.lastSync).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleSyncInstitution(inst.id)}
                        style={{
                          flex: 1, padding: '0.45rem 0.7rem', borderRadius: '8px',
                          border: `1.5px solid ${inst.color}`, background: 'transparent',
                          color: inst.color, fontSize: '0.76rem', fontWeight: '700',
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                        }}
                      >
                        <FaSync size={10} /> Sincronizar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUnlinkInstitution(inst.id)}
                        style={{
                          padding: '0.45rem 0.7rem', borderRadius: '8px',
                          border: '1.5px solid #ef4444', background: 'transparent',
                          color: '#ef4444', fontSize: '0.76rem', fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Desvincular
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Estado: No vinculado */
                  <div>
                    {linkingId === inst.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder={inst.id === 'seguro-privado' ? 'Núm. de Póliza del Seguro' : inst.id === 'imss' ? 'NSS (11 dígitos)' : 'Núm. de Beneficiario'}
                          value={inst.code}
                          onChange={e => setLinkedInstitutions(prev => prev.map(i => i.id === inst.id ? { ...i, code: e.target.value } : i))}
                          style={{
                            width: '100%', padding: '0.5rem 0.7rem', borderRadius: '8px',
                            border: `1.5px solid ${inst.color}`, background: dark ? '#141319' : '#fff',
                            color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem', outline: 'none'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleLinkInstitution(inst.id)}
                            style={{
                              flex: 1, padding: '0.45rem', borderRadius: '8px', border: 'none',
                              background: inst.color, color: 'white', fontSize: '0.78rem', fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <FaLink size={10} /> Vincular
                          </button>
                          <button
                            type="button"
                            onClick={() => { setLinkingId(null); setLinkedInstitutions(prev => prev.map(i => i.id === inst.id ? { ...i, code: '' } : i)) }}
                            style={{ padding: '0.45rem 0.7rem', borderRadius: '8px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: 'transparent', color: dark ? '#cbd5e1' : '#64748b', fontSize: '0.78rem' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLinkingId(inst.id)}
                        style={{
                          width: '100%', padding: '0.55rem', borderRadius: '8px',
                          border: `1.5px dashed ${dark ? '#475569' : '#cbd5e1'}`, background: 'transparent',
                          color: dark ? '#cbd5e1' : '#64748b', fontSize: '0.82rem', fontWeight: '600',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = inst.color; e.currentTarget.style.color = inst.color }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#475569' : '#cbd5e1'; e.currentTarget.style.color = dark ? '#cbd5e1' : '#64748b' }}
                      >
                        <FaLink size={12} /> Vincular mi cuenta
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', background: dark ? '#1e1c2580' : '#f0f9ff', border: `1px solid ${dark ? '#334155' : '#bae6fd'}` }}>
            <p style={{ fontSize: '0.75rem', color: dark ? '#94a3b8' : '#0369a1', margin: 0, lineHeight: '1.45' }}>
              <FaInfoCircle style={{ marginRight: '0.3rem' }} />
              <strong>¿Cómo obtener tu código?</strong> El NSS del IMSS aparece en tu carnet o puedes consultarlo en <a href="https://serviciosdigitales.imss.gob.mx" target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1', fontWeight: '700' }}>serviciosdigitales.imss.gob.mx</a>. Para ISSSTE, consulta en <a href="https://www.gob.mx/issste" target="_blank" rel="noopener noreferrer" style={{ color: '#1e3a5f', fontWeight: '700' }}>gob.mx/issste</a>. Para tu seguro privado, consulta tu póliza vigente.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <form onSubmit={handleSaveHistory}>

            {/* 1. Ficha de Identificación del Paciente */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaIdCard size={20} style={{ color: 'var(--color-primary-500)' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    1. Ficha de Identificación del Paciente
                  </h2>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'var(--color-primary-500)15', color: 'var(--color-primary-500)', fontWeight: '700' }}>
                  NOM-024-SSA3-2012
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    CURP (Clave Única):
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    placeholder="ej. RAMV981106HTSRLN01"
                    value={history.curp}
                    onChange={e => setHistory({ ...history, curp: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                      border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`,
                      background: dark ? '#1e1c25' : '#ffffff', color: dark ? '#ffffff' : '#0f172a',
                      fontSize: '0.88rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    NSS / Núm. Afiliación (IMSS/ISSSTE/Privado):
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 12984712093"
                    value={history.nss}
                    onChange={e => setHistory({ ...history, nss: e.target.value })}
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                      border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`,
                      background: dark ? '#1e1c25' : '#ffffff', color: dark ? '#ffffff' : '#0f172a',
                      fontSize: '0.88rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    Tipo de Sangre y Rh:
                  </label>
                  <select
                    value={history.bloodType}
                    onChange={e => setHistory({ ...history, bloodType: e.target.value })}
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px',
                      border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`,
                      background: dark ? '#1e1c25' : '#ffffff', color: dark ? '#ffffff' : '#0f172a',
                      fontSize: '0.88rem', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    {BLOOD_TYPES.map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600', color: dark ? '#ffffff' : '#0f172a' }}>
                    <input
                      type="checkbox"
                      checked={history.organDonor}
                      onChange={e => setHistory({ ...history, organDonor: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-500)', cursor: 'pointer' }}
                    />
                    <span>Registro Activo de Donador de Órganos 🫀</span>
                  </label>
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: `1px dashed ${dark ? '#334155' : '#cbd5e1'}` }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#334155', marginBottom: '0.75rem' }}>
                  📞 Contacto de Emergencia Autorizado
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={history.emergencyContactName}
                    onChange={e => setHistory({ ...history, emergencyContactName: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.85rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Teléfono (10 dígitos)"
                    value={history.emergencyContactPhone}
                    onChange={e => setHistory({ ...history, emergencyContactPhone: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.85rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Parentesco / Relación"
                    value={history.emergencyContactRelation}
                    onChange={e => setHistory({ ...history, emergencyContactRelation: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Alergias y Reacciones Adversas (RAM) */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaExclamationTriangle size={20} style={{ color: '#ef4444' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    2. Alergias y Reacciones Adversas (RAM)
                  </h2>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '700' }}>Alerta Crítica</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {(!history.allergies || history.allergies.length === 0) ? (
                  <p style={{ fontSize: '0.85rem', color: dark ? '#cbd5e1' : '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Sin alergias a medicamentos ni alimentos registradas.
                  </p>
                ) : (
                  (history.allergies || []).map((allergy, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.35rem 0.75rem', borderRadius: '20px',
                        background: '#fef2f2', border: '1px solid #fca5a5',
                        color: '#991b1b', fontSize: '0.82rem', fontWeight: '700'
                      }}
                    >
                      ⚠️ {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: 0, marginLeft: '4px' }}
                      >
                        <FaTimes size={10} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
                <input
                  type="text"
                  placeholder="Agregar alergia (ej. Penicilina, Mariscos...)"
                  value={newAllergy}
                  onChange={e => setNewAllergy(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
                  style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '8px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  <FaPlus /> Agregar
                </button>
              </div>
            </div>

            {/* 3. Antecedentes Médicos (Anamnesis) */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaNotesMedical size={20} style={{ color: '#0369a1' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    3. Antecedentes Médicos (Anamnesis)
                  </h2>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                
                {/* Heredofamiliares */}
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#334155', marginBottom: '0.6rem' }}>
                    🧬 Antecedentes Heredofamiliares:
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {(history.hereditaryDiseases || []).map((item, idx) => (
                      <span key={idx} style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: dark ? '#334155' : '#f1f5f9', color: dark ? '#f8fafc' : '#334155', fontSize: '0.78rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        {item}
                        <button type="button" onClick={() => removeHereditary(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#cbd5e1' : '#64748b', padding: 0 }}><FaTimes size={9} /></button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="ej. Diabetes (Madre)"
                      value={newHereditary}
                      onChange={e => setNewHereditary(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHereditary(); } }}
                      style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.8rem' }}
                    />
                    <button type="button" onClick={addHereditary} style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: 'none', background: '#0369a1', color: 'white', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}>+ Add</button>
                  </div>
                </div>

                {/* Personales Patológicos */}
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#334155', marginBottom: '0.6rem' }}>
                    🏥 Personales Patológicos y Cirugías:
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    {(history.personalPathologies || []).map((item, idx) => (
                      <span key={idx} style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: dark ? '#334155' : '#f1f5f9', color: dark ? '#f8fafc' : '#334155', fontSize: '0.78rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        {item}
                        <button type="button" onClick={() => removePathology(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#cbd5e1' : '#64748b', padding: 0 }}><FaTimes size={9} /></button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="ej. Apendicectomía (2020)"
                      value={newPathology}
                      onChange={e => setNewPathology(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPathology(); } }}
                      style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.8rem' }}
                    />
                    <button type="button" onClick={addPathology} style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: 'none', background: '#0369a1', color: 'white', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}>+ Add</button>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Diagnósticos Clínicos (CIE-10) */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaBuilding size={20} style={{ color: 'var(--color-primary-500)' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    4. Diagnósticos Clínicos Codificados (CIE-10 / CIE-11)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiagForm(p => !p)}
                  style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary-500)', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  <FaPlus /> Nuevo Diagnóstico
                </button>
              </div>

              {showDiagForm && (
                <div style={{ padding: '1rem', borderRadius: '12px', background: dark ? '#1e1c25' : '#faf8f5', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`, marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0 0 0.75rem' }}>Registrar Diagnóstico CIE-10</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px auto', gap: '0.6rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="CIE-10 (ej. E11.9)"
                      value={diagForm.code}
                      onChange={e => setDiagForm({ ...diagForm, code: e.target.value })}
                      style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Nombre del diagnóstico (ej. Diabetes Mellitus Tipo 2)"
                      value={diagForm.name}
                      onChange={e => setDiagForm({ ...diagForm, name: e.target.value })}
                      style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                    <select
                      value={diagForm.status}
                      onChange={e => setDiagForm({ ...diagForm, status: e.target.value })}
                      style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    >
                      <option value="En Tratamiento">En Tratamiento</option>
                      <option value="Controlado">Controlado</option>
                      <option value="Crónico">Crónico</option>
                      <option value="Resuelto">Resuelto</option>
                    </select>
                    <button type="button" onClick={handleAddDiagnosis} style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: 'none', background: 'var(--color-primary-500)', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>Guardar</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(!history.diagnoses || history.diagnoses.length === 0) ? (
                  <p style={{ fontSize: '0.85rem', color: dark ? '#cbd5e1' : '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Sin diagnósticos clínicos registrados formalmente.
                  </p>
                ) : (
                  (history.diagnoses || []).map((d) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '8px', background: dark ? '#1e1c25' : '#f8fafc', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'var(--color-primary-500)20', color: 'var(--color-primary-500)', fontSize: '0.75rem', fontWeight: '800' }}>
                          {d.code}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: '600', color: dark ? '#fff' : '#0f172a' }}>
                          {d.name}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: dark ? '#cbd5e1' : '#64748b' }}>
                          ({d.date})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ padding: '0.15rem 0.55rem', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: '700' }}>
                          {d.status}
                        </span>
                        <button type="button" onClick={() => handleRemoveDiagnosis(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5. Módulo de Análisis Clínicos y Estudios en PDF */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaFileUpload size={20} style={{ color: '#10b981' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    5. Análisis Clínicos y Estudios Médicos en PDF
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(true)}
                  style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <FaPlus /> Subir Análisis (PDF)
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {(!history.labReports || history.labReports.length === 0) ? (
                  <div style={{ gridColumn: '1 / -1', padding: '1.5rem', textAlign: 'center', borderRadius: '12px', background: dark ? '#1e1c25' : '#f8fafc', border: `2px dashed ${dark ? '#334155' : '#e2e8f0'}` }}>
                    <FaFilePdf size={32} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.88rem', fontWeight: '600', color: dark ? '#cbd5e1' : '#64748b', margin: 0 }}>
                      No has adjuntado archivos PDF de análisis o pruebas clínicas.
                    </p>
                    <p style={{ fontSize: '0.78rem', color: dark ? '#94a3b8' : '#94a3b8', margin: '0.2rem 0 0' }}>
                      Sube estudios de laboratorios públicos o privados (Salud Digna, Chopo, IMSS, ISSSTE, etc.).
                    </p>
                  </div>
                ) : (
                  (history.labReports || []).map((report) => (
                    <div key={report.id} style={{ padding: '1rem', borderRadius: '12px', background: dark ? '#1e1c25' : '#ffffff', border: `1.5px solid ${dark ? '#334155' : '#e2e8f0'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaFilePdf size={22} style={{ color: '#ef4444' }} />
                            <div>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: dark ? '#fff' : '#0f172a', margin: 0 }}>
                                {report.title}
                              </h4>
                              <p style={{ fontSize: '0.75rem', color: dark ? '#cbd5e1' : '#64748b', margin: 0 }}>
                                {report.labName} • {report.date}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.5rem', borderTop: `1px solid ${dark ? '#334155' : '#f1f5f9'}` }}>
                        <a
                          href={`${API_BASE}/${report.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#0369a1', textDecoration: 'none' }}
                        >
                          <FaFilePdf /> Ver PDF
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeletePdf(report.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }}
                          title="Eliminar este archivo PDF"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 6. Signos Vitales y Somatometría (Sincronizado con Panel de Salud) */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaHeartbeat size={20} style={{ color: '#ef4444' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    6. Signos Vitales y Somatometría
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#fef2f2', color: '#ef4444', fontWeight: '700' }}>
                    Dashboard de Salud
                  </span>
                  <Link
                    to="/dashboard"
                    style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    Registrar Métricas <FaExternalLinkAlt size={10} />
                  </Link>
                </div>
              </div>

              {(!healthRecords || healthRecords.length === 0) ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', borderRadius: '12px', background: dark ? '#1e1c25' : '#f8fafc', border: `1px dashed ${dark ? '#334155' : '#e2e8f0'}` }}>
                  <p style={{ fontSize: '0.85rem', color: dark ? '#cbd5e1' : '#64748b', margin: 0 }}>
                    No se han registrado signos vitales recientemente. Registra tus mediciones desde el Dashboard de Salud.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {(() => {
                    const latestByType = {}
                    ;(healthRecords || []).forEach(r => {
                      if (r && r.type && (!latestByType[r.type] || (r.recordedAt && new Date(r.recordedAt) > new Date(latestByType[r.type].recordedAt)))) {
                        latestByType[r.type] = r
                      }
                    })
                    const typeNames = {
                      weight: 'Peso Corporal',
                      glucose: 'Glucosa en Sangre',
                      bloodPressure: 'Presión Arterial',
                      heartRate: 'Frecuencia Cardíaca',
                      cholesterol: 'Colesterol Total',
                      triglycerides: 'Triglicéridos',
                    }
                    const typeColors = {
                      weight: '#0369a1',
                      glucose: '#d97706',
                      bloodPressure: '#ef4444',
                      heartRate: '#10b981',
                      cholesterol: '#7c3aed',
                      triglycerides: '#ec4899',
                    }

                    return Object.entries(latestByType).map(([type, record]) => (
                      <div key={type} style={{ padding: '0.9rem', borderRadius: '10px', background: dark ? '#1e1c25' : '#ffffff', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: typeColors[type] || '#64748b', marginBottom: '0.3rem' }}>
                          {typeNames[type] || type}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: dark ? '#ffffff' : '#0f172a' }}>
                          {record.value} {record.value2 != null ? `/ ${record.value2}` : ''} <span style={{ fontSize: '0.78rem', fontWeight: '600', color: dark ? '#94a3b8' : '#64748b' }}>{record.unit}</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: dark ? '#94a3b8' : '#94a3b8', marginTop: '0.3rem' }}>
                          {record.recordedAt ? new Date(record.recordedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>

            {/* 7. Medicamentos Activos en Tratamiento */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaPills size={20} style={{ color: '#8b5cf6' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    7. Medicamentos Activos en Tratamiento
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#f3e8ff', color: '#8b5cf6', fontWeight: '700' }}>
                    Farmacoterapia Activa
                  </span>
                  <Link
                    to="/dashboard"
                    style={{ fontSize: '0.78rem', color: '#8b5cf6', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    Gestionar Medicamentos <FaExternalLinkAlt size={10} />
                  </Link>
                </div>
              </div>

              {(!medications || medications.length === 0) ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', borderRadius: '12px', background: dark ? '#1e1c25' : '#f8fafc', border: `1px dashed ${dark ? '#334155' : '#e2e8f0'}` }}>
                  <p style={{ fontSize: '0.85rem', color: dark ? '#cbd5e1' : '#64748b', margin: 0 }}>
                    No tienes medicamentos registrados actualmente. Administra tus recetas e indicaciones desde el Dashboard de Salud.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  {(medications || []).map(med => (
                    <div key={med.id} style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: dark ? '#1e1c25' : '#ffffff', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: dark ? '#ffffff' : '#0f172a', margin: 0 }}>
                          {med.name}
                        </h4>
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#f3e8ff', color: '#8b5cf6', fontSize: '0.68rem', fontWeight: '800' }}>
                          Activo
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: dark ? '#cbd5e1' : '#475569' }}>
                        <strong>Dosis:</strong> {med.dose} • <strong>Frecuencia:</strong> {med.frequency}
                      </div>
                      {med.instructions && (
                        <div style={{ fontSize: '0.73rem', color: dark ? '#94a3b8' : '#64748b', fontStyle: 'italic', marginTop: '0.3rem' }}>
                          "{med.instructions}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 8. Cartilla Nacional de Vacunación */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaSyringe size={20} style={{ color: '#0284c7' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    8. Cartilla Nacional de Vacunación
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleAddDefaultVaccinesScheme}
                    style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: 'transparent', color: dark ? '#cbd5e1' : '#0369a1', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    + Esquema Nacional
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVaccineModal(true)}
                    style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', background: '#0284c7', color: 'white', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <FaPlus /> Registrar Vacuna
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(!history.vaccines || history.vaccines.length === 0) ? (
                  <p style={{ fontSize: '0.85rem', color: dark ? '#cbd5e1' : '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Sin registro de vacunas. Agrega vacunas individuales o carga el Esquema Nacional Recomendado.
                  </p>
                ) : (
                  (history.vaccines || []).map(vac => (
                    <div key={vac.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '8px', background: dark ? '#1e1c25' : '#f8fafc', border: `1px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FaSyringe style={{ color: '#0284c7' }} />
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: dark ? '#fff' : '#0f172a' }}>
                            {vac.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: dark ? '#94a3b8' : '#64748b', marginLeft: '0.5rem' }}>
                            • {vac.date} {vac.institution ? `(${vac.institution})` : ''} {vac.lot ? `• Lote: ${vac.lot}` : ''}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ padding: '0.15rem 0.55rem', borderRadius: '12px', background: vac.status === 'Aplicada' ? '#dcfce7' : '#fef3c7', color: vac.status === 'Aplicada' ? '#15803d' : '#b45309', fontSize: '0.72rem', fontWeight: '800' }}>
                          {vac.status}
                        </span>
                        <button type="button" onClick={() => handleRemoveVaccine(vac.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 9. Antecedentes No Patológicos (Estilo de Vida) */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaRunning size={20} style={{ color: '#10b981' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    9. Antecedentes No Patológicos (Estilo de Vida)
                  </h2>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#d1fae5', color: '#047857', fontWeight: '700' }}>
                  NOM-004-SSA3-2012
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    <FaSmoking style={{ marginRight: '0.3rem' }} /> Tabaquismo:
                  </label>
                  <select
                    value={history.nonPathologicalHistory?.smoking || 'Nunca'}
                    onChange={e => setHistory({
                      ...history,
                      nonPathologicalHistory: { ...history.nonPathologicalHistory, smoking: e.target.value }
                    })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                  >
                    <option value="Nunca">Nunca</option>
                    <option value="Ex-fumador">Ex-fumador</option>
                    <option value="Ocasional (<5/día)">Ocasional (&lt;5/día)</option>
                    <option value="Moderado (5-15/día)">Moderado (5-15/día)</option>
                    <option value="Intenso (>15/día)">Intenso (&gt;15/día)</option>
                    <option value="Fumador Pasivo">Fumador Pasivo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    <FaWineGlass style={{ marginRight: '0.3rem' }} /> Alcoholismo:
                  </label>
                  <select
                    value={history.nonPathologicalHistory?.alcohol || 'Nunca'}
                    onChange={e => setHistory({
                      ...history,
                      nonPathologicalHistory: { ...history.nonPathologicalHistory, alcohol: e.target.value }
                    })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                  >
                    <option value="Nunca">Nunca</option>
                    <option value="Ex-alcoholismo">Ex-alcoholismo</option>
                    <option value="Ocasional / Social">Ocasional / Social</option>
                    <option value="Moderado (1-2 días/sem)">Moderado (1-2 días/sem)</option>
                    <option value="Frecuente (>3 días/sem)">Frecuente (&gt;3 días/sem)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    <FaRunning style={{ marginRight: '0.3rem' }} /> Actividad Física:
                  </label>
                  <select
                    value={history.nonPathologicalHistory?.exercise || 'Ocasional'}
                    onChange={e => setHistory({
                      ...history,
                      nonPathologicalHistory: { ...history.nonPathologicalHistory, exercise: e.target.value }
                    })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                  >
                    <option value="Sedentario">Sedentario</option>
                    <option value="Ligera (1-2 días/sem)">Ligera (1-2 días/sem)</option>
                    <option value="Moderada (3-4 días/sem)">Moderada (3-4 días/sem)</option>
                    <option value="Intensa (5+ días/sem)">Intensa (5+ días/sem)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    <FaAppleAlt style={{ marginRight: '0.3rem' }} /> Alimentación:
                  </label>
                  <select
                    value={history.nonPathologicalHistory?.diet || 'Equilibrada'}
                    onChange={e => setHistory({
                      ...history,
                      nonPathologicalHistory: { ...history.nonPathologicalHistory, diet: e.target.value }
                    })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                  >
                    <option value="Equilibrada">Equilibrada / Saludable</option>
                    <option value="Alta en Carbohidratos/Grasas">Alta en Carbohidratos/Grasas</option>
                    <option value="Hipocalórica">Hipocalórica</option>
                    <option value="Vegetariana / Vegana">Vegetariana / Vegana</option>
                    <option value="Irregular">Irregular</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 10. Notas de Evolución Clínica (SOAP) */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaStethoscope size={20} style={{ color: '#d97706' }} />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)', margin: 0 }}>
                    10. Notas de Evolución Clínica (SOAP)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(true)}
                  style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', background: '#d97706', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FaPlus /> Nueva Nota SOAP
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(!history.clinicalNotes || history.clinicalNotes.length === 0) ? (
                  <p style={{ fontSize: '0.85rem', color: dark ? '#cbd5e1' : '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Sin notas de evolución médica registradas.
                  </p>
                ) : (
                  (history.clinicalNotes || []).map(note => (
                    <div key={note.id} style={{ padding: '1rem', borderRadius: '12px', background: dark ? '#1e1c25' : '#ffffff', border: `1.5px solid ${dark ? '#334155' : '#e2e8f0'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: dark ? '#ffffff' : '#0f172a' }}>{note.doctor}</strong>
                          <span style={{ fontSize: '0.75rem', color: dark ? '#94a3b8' : '#64748b', marginLeft: '0.5rem' }}>({note.date})</span>
                        </div>
                        <button type="button" onClick={() => handleRemoveClinicalNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <FaTrash size={12} />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', fontSize: '0.8rem' }}>
                        {note.subjective && <div style={{ background: dark ? '#141319' : '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}><strong>S (Subjetivo):</strong> {note.subjective}</div>}
                        {note.objective && <div style={{ background: dark ? '#141319' : '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}><strong>O (Objetivo):</strong> {note.objective}</div>}
                        {note.analysis && <div style={{ background: dark ? '#141319' : '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}><strong>A (Análisis):</strong> {note.analysis}</div>}
                        {note.plan && <div style={{ background: dark ? '#141319' : '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}><strong>P (Plan):</strong> {note.plan}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Botón de Guardado General */}
            <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.85rem 2rem', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                  color: 'white', fontSize: '0.95rem', fontWeight: '700',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(135,18,51,0.3)', transition: 'all 0.2s'
                }}
              >
                {saving ? 'Guardando Expediente...' : '💾 Guardar Expediente Clínico'}
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Modal Subir PDF */}
      {showPdfModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            width: '100%', maxWidth: '440px', padding: '1.75rem',
            borderRadius: '16px', background: dark ? '#141319' : '#ffffff',
            border: `1px solid ${dark ? '#1e1c25' : '#e2e8f0'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: dark ? '#ffffff' : '#1e293b', margin: 0 }}>
                📤 Subir Análisis Clínico (PDF)
              </h3>
              <button onClick={() => setShowPdfModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)', fontSize: '1.1rem' }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUploadPdf}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    Título o Nombre del Estudio:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Química Sanguínea 6 Elementos"
                    value={pdfForm.title}
                    onChange={e => setPdfForm({ ...pdfForm, title: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    Laboratorio / Institución:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Salud Digna / Chopo / IMSS"
                    value={pdfForm.labName}
                    onChange={e => setPdfForm({ ...pdfForm, labName: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    Fecha de Realización:
                  </label>
                  <input
                    type="date"
                    required
                    value={pdfForm.date}
                    onChange={e => setPdfForm({ ...pdfForm, date: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    Archivo PDF del Estudio:
                  </label>
                  <input
                    type="file"
                    required
                    accept="application/pdf,.pdf"
                    onChange={e => setPdfForm({ ...pdfForm, file: e.target.files[0] })}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  disabled={uploadingPdf}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none',
                    background: '#10b981', color: 'white', fontWeight: '700', fontSize: '0.9rem',
                    cursor: uploadingPdf ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploadingPdf ? 'Subiendo PDF...' : 'Subir Archivo PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: 'transparent', color: dark ? '#fff' : '#475569', fontWeight: '600' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar Archivo FHIR / JSON Real */}
      {showFhirModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            width: '100%', maxWidth: '460px', padding: '1.75rem',
            borderRadius: '16px', background: dark ? '#141319' : '#ffffff',
            border: `1px solid ${dark ? '#1e1c25' : '#e2e8f0'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: dark ? '#ffffff' : '#1e293b', margin: 0 }}>
                📥 Importar Archivo FHIR / JSON
              </h3>
              <button onClick={() => setShowFhirModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)', fontSize: '1.1rem' }}>
                <FaTimes />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: dark ? '#cbd5e1' : '#64748b', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Selecciona un archivo de expediente clínico en formato <strong>HL7 FHIR (.json)</strong> exportado desde cualquier sistema de salud o laboratorio.
            </p>

            <form onSubmit={handleProcessFhirFile}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                  Seleccionar Archivo FHIR (.json):
                </label>
                <input
                  type="file"
                  required
                  accept=".json,.fhir,application/json"
                  onChange={e => setFhirFile(e.target.files[0])}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none',
                    background: '#0369a1', color: 'white', fontWeight: '700', fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Procesar e Importar
                </button>
                <button
                  type="button"
                  onClick={() => setShowFhirModal(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: 'transparent', color: dark ? '#fff' : '#475569', fontWeight: '600' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Vacuna */}
      {showVaccineModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            width: '100%', maxWidth: '440px', padding: '1.75rem',
            borderRadius: '16px', background: dark ? '#141319' : '#ffffff',
            border: `1px solid ${dark ? '#1e1c25' : '#e2e8f0'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: dark ? '#ffffff' : '#1e293b', margin: 0 }}>
                💉 Registrar Vacuna
              </h3>
              <button onClick={() => setShowVaccineModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)', fontSize: '1.1rem' }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddVaccine}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    Vacuna / Inmunización:
                  </label>
                  <select
                    value={vaccineForm.name}
                    onChange={e => setVaccineForm({ ...vaccineForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                  >
                    {COMMON_VACCINES.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                    <option value="Otra...">Otra...</option>
                  </select>
                </div>

                {vaccineForm.name === 'Otra...' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                      Nombre personalizado de la vacuna:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Varicela / Fiebre Amarilla"
                      value={vaccineForm.customName}
                      onChange={e => setVaccineForm({ ...vaccineForm, customName: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    Fecha de Aplicación:
                  </label>
                  <input
                    type="date"
                    required
                    value={vaccineForm.date}
                    onChange={e => setVaccineForm({ ...vaccineForm, date: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    Institución / Clínica:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. IMSS Clinica 22 / Centro de Salud"
                    value={vaccineForm.institution}
                    onChange={e => setVaccineForm({ ...vaccineForm, institution: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                      Número de Lote (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="ej. AB12345"
                      value={vaccineForm.lot}
                      onChange={e => setVaccineForm({ ...vaccineForm, lot: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                      Estatus:
                    </label>
                    <select
                      value={vaccineForm.status}
                      onChange={e => setVaccineForm({ ...vaccineForm, status: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                    >
                      <option value="Aplicada">Aplicada</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Refuerzo">Dosis de Refuerzo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none',
                    background: '#0284c7', color: 'white', fontWeight: '700', fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Guardar Vacuna
                </button>
                <button
                  type="button"
                  onClick={() => setShowVaccineModal(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: 'transparent', color: dark ? '#fff' : '#475569', fontWeight: '600' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Nota de Evolución (SOAP) */}
      {showNoteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            width: '100%', maxWidth: '560px', padding: '1.75rem',
            borderRadius: '16px', background: dark ? '#141319' : '#ffffff',
            border: `1px solid ${dark ? '#1e1c25' : '#e2e8f0'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: dark ? '#ffffff' : '#1e293b', margin: 0 }}>
                📋 Registrar Nota de Evolución Clínica (SOAP)
              </h3>
              <button onClick={() => setShowNoteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)', fontSize: '1.1rem' }}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddClinicalNote}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                      Médico / Especialista Tratante:
                    </label>
                    <input
                      type="text"
                      placeholder="Dr(a). Nombre Apellido"
                      value={noteForm.doctor}
                      onChange={e => setNoteForm({ ...noteForm, doctor: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                      Fecha:
                    </label>
                    <input
                      type="date"
                      required
                      value={noteForm.date}
                      onChange={e => setNoteForm({ ...noteForm, date: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    S - Subjetivo (Motivo de consulta y síntomas del paciente):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ej. Paciente refiere cefalea de 2 días de evolución..."
                    value={noteForm.subjective}
                    onChange={e => setNoteForm({ ...noteForm, subjective: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    O - Objetivo (Hallazgos físicos, signos vitales y estudios):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ej. TA 120/80, FC 72bpm. Abdomen blando, sin dolor..."
                    value={noteForm.objective}
                    onChange={e => setNoteForm({ ...noteForm, objective: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    A - Análisis / Diagnóstico (Impresión diagnóstica y evolución):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ej. Cefalea tensional. Buena respuesta a analgésicos..."
                    value={noteForm.analysis}
                    onChange={e => setNoteForm({ ...noteForm, analysis: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#cbd5e1' : '#475569', marginBottom: '0.35rem' }}>
                    P - Plan (Tratamiento, medicamentos e indicaciones):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ej. Paracetamol 500mg c/8h por 3 días. Cita de control en 1 mes..."
                    value={noteForm.plan}
                    onChange={e => setNoteForm({ ...noteForm, plan: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${dark ? '#334155' : '#cbd5e1'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#0f172a', fontSize: '0.84rem', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none',
                    background: '#d97706', color: 'white', fontWeight: '700', fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Guardar Nota SOAP
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: `1px solid ${dark ? '#334155' : '#cbd5e1'}`, background: 'transparent', color: dark ? '#fff' : '#475569', fontWeight: '600' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
