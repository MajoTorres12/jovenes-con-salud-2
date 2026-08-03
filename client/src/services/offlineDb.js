// Servicio de Almacenamiento IndexedDB para Caché Offline y Cola de Resincronización
const DB_NAME = 'JovenesConSaludOfflineDB'
const DB_VERSION = 1

let dbInstance = null

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // 1. Tienda de caché para datos de solo lectura offline (GET)
      if (!db.objectStoreNames.contains('cached_data')) {
        db.createObjectStore('cached_data', { keyPath: 'key' })
      }

      // 2. Tienda de cola para operaciones pendientes por sincronizar (POST, PUT, DELETE)
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' })
        queueStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      dbInstance = event.target.result
      resolve(dbInstance)
    }

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB:', event.target.error)
      reject(event.target.error)
    }
  })
}

// ── CACHE METHODS ─────────────────────────────────────────────────────────────

export async function setCachedData(key, data) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_data', 'readwrite')
      const store = tx.objectStore('cached_data')
      const record = { key, data, updatedAt: new Date().toISOString() }
      const req = store.put(record)
      req.onsuccess = () => resolve(true)
      req.onerror = (err) => reject(err)
    })
  } catch (err) {
    console.error(`[IndexedDB] Error guardando caché para key '${key}':`, err)
  }
}

export async function getCachedData(key) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_data', 'readonly')
      const store = tx.objectStore('cached_data')
      const req = store.get(key)
      req.onsuccess = () => {
        resolve(req.result ? req.result.data : null)
      }
      req.onerror = (err) => reject(err)
    })
  } catch (err) {
    console.error(`[IndexedDB] Error leyendo caché para key '${key}':`, err)
    return null
  }
}

// ── SYNC QUEUE METHODS ────────────────────────────────────────────────────────

export async function addToSyncQueue(item) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite')
      const store = tx.objectStore('sync_queue')
      const queueItem = {
        id: item.id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: item.type || 'health_record',
        method: item.method || 'POST',
        url: item.url,
        payload: item.payload,
        createdAt: new Date().toISOString(),
        status: 'pending',
      }
      const req = store.put(queueItem)
      req.onsuccess = () => {
        console.log('[IndexedDB] Operación guardada en la cola offline:', queueItem)
        resolve(queueItem)
      }
      req.onerror = (err) => reject(err)
    })
  } catch (err) {
    console.error('[IndexedDB] Error agregando a la cola de sincronización:', err)
  }
}

export async function getSyncQueue() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly')
      const store = tx.objectStore('sync_queue')
      const req = store.getAll()
      req.onsuccess = () => {
        const items = req.result || []
        // Ordenar por fecha de creación (FIFO)
        items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        resolve(items)
      }
      req.onerror = (err) => reject(err)
    })
  } catch (err) {
    console.error('[IndexedDB] Error obteniendo la cola de sincronización:', err)
    return []
  }
}

export async function removeFromSyncQueue(id) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite')
      const store = tx.objectStore('sync_queue')
      const req = store.delete(id)
      req.onsuccess = () => resolve(true)
      req.onerror = (err) => reject(err)
    })
  } catch (err) {
    console.error(`[IndexedDB] Error eliminando de la cola ID '${id}':`, err)
  }
}

export async function clearSyncQueue() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite')
      const store = tx.objectStore('sync_queue')
      const req = store.clear()
      req.onsuccess = () => resolve(true)
      req.onerror = (err) => reject(err)
    })
  } catch (err) {
    console.error('[IndexedDB] Error limpiando la cola de sincronización:', err)
  }
}
