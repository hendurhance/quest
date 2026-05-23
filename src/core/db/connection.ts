import { DB_NAME, DB_VERSION, applyUpgrade } from './schema'

export function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function openDatabase(name = DB_NAME, version = DB_VERSION): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version)
    request.onupgradeneeded = () => applyUpgrade(request.result)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Open an arbitrary database at its current version, without any upgrade hook.
 *  Returns null if it cannot be opened. Used to read the legacy db read-only. */
export function openExisting(name: string): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(name)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

export function txStore(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode = 'readonly',
): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store)
}
