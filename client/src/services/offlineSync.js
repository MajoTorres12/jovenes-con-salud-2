import { getSyncQueue, removeFromSyncQueue } from './offlineDb'

let isSyncing = false

export async function processOfflineQueue(api) {
  if (isSyncing || !navigator.onLine) return 0
  isSyncing = true

  let syncedCount = 0
  try {
    const queue = await getSyncQueue()
    if (queue.length === 0) {
      isSyncing = false
      return 0
    }

    console.log(`[OfflineSync] Procesando cola con ${queue.length} operación(es) pendiente(s)...`)

    for (const item of queue) {
      try {
        if (item.method === 'POST') {
          await api.post(item.url, item.payload)
        } else if (item.method === 'PUT') {
          await api.put(item.url, item.payload)
        } else if (item.method === 'DELETE') {
          await api.delete(item.url)
        }
        await removeFromSyncQueue(item.id)
        syncedCount++
      } catch (err) {
        console.error(`[OfflineSync] Error al resincronizar ítem ID '${item.id}':`, err)
        // Si es error de red, abortamos para intentar en el siguiente ciclo online
        if (!navigator.onLine || !err.response) break
        // Si fue error 4xx (ej. ya eliminado o inválido), eliminamos de la cola para no atascar
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          await removeFromSyncQueue(item.id)
        }
      }
    }

    const remaining = await getSyncQueue()
    window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: remaining.length } }))

    if (syncedCount > 0) {
      console.log(`[OfflineSync] Exitosamente sincronizado ${syncedCount} registro(s).`)
      window.dispatchEvent(new CustomEvent('offline-sync-completed', { detail: { count: syncedCount } }))
      window.dispatchEvent(new Event('health-records-updated'))
    }
  } catch (err) {
    console.error('[OfflineSync] Error general en proceso de sincronización:', err)
  } finally {
    isSyncing = false
  }

  return syncedCount
}

export function initOfflineSyncListeners(api) {
  // Escuchar cuando regresa la conexión
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Conexión a internet restablecida. Iniciando sincronización...')
    processOfflineQueue(api)
  })

  // Verificar cola inicial al cargar
  setTimeout(() => {
    if (navigator.onLine) {
      processOfflineQueue(api)
    }
  }, 3000)
}
