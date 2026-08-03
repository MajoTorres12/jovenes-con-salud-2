import { useCallback } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import api from '../services/api'

export function useOnboardingTour({ onTourComplete } = {}) {
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(15, 23, 42, 0.75)',
      stagePadding: 8,
      stageRadius: 12,
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '¡Entendido!',
      progressText: 'Paso {{current}} de {{total}}',
      onDestroyStarted: () => {
        driverObj.destroy()
      },
      onDrives: () => {
        // Al terminar todos los pasos
        try {
          api.put('/profile/onboarding-complete')
        } catch (err) {
          console.error('Error al guardar estado de onboarding:', err)
        }
        localStorage.setItem('jcs_tour_completed', 'true')
        onTourComplete?.()
      },
      steps: [
        {
          element: '#tour-welcome-title',
          popover: {
            title: '¡Bienvenido a Jóvenes con Salud! 👋',
            description: 'Este es tu panel personalizado para monitorear tu estado de salud, medicamentos y hábitos diarios.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-carousel-metrics',
          popover: {
            title: 'Indicadores Clínicos 📊',
            description: 'Haz clic en cada tarjeta para consultar tu historial de Peso, Glucosa, Presión Arterial, Ritmo Cardíaco y Lípidos.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-new-record-btn',
          popover: {
            title: '+ Nuevo Registro ✍️',
            description: 'Agrega fácilmente tus mediciones diarias. ¡Los datos también se guardan en modo sin conexión!',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-wearables-btn',
          popover: {
            title: 'Reloj Inteligente / Wearable ⌚',
            description: 'Conecta tu smartwatch o pulsera inteligente (Fitbit, Apple Watch, Samsung, Xiaomi, etc.) para importar métricas automáticamente.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-streak-btn',
          popover: {
            title: 'Rachas y Logros 🏆',
            description: 'Acumula días consecutivos registrando tus datos para desbloquear insignias y colores de personalización para tu panel.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-treatments-section',
          popover: {
            title: 'Tratamientos y Recordatorios 💊',
            description: 'Organiza tus medicamentos y suplementos para recibir notificaciones locales y mantener al día tus tomas.',
            side: 'top',
            align: 'center',
          },
        },
      ],
    })

    driverObj.drive()
  }, [onTourComplete])

  return { startTour }
}
