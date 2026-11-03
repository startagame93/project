import type { AppState } from '@/types';
import { mergeState } from '@/lib/stateNormalize';

const DB_NAME = 'nutriplan-offline';
const STORE_NAME = 'records';

const LEGACY_STATE_KEY = 'nutriplan-state-v1';
const LEGACY_PENDING_KEY = 'nutriplan-pending-sync';
const LEGACY_OWNER_KEY = 'nutriplan-state-owner';

/** Per-account copy kept on this device. `base` is the last state confirmed by the server, `dirty` means local edits are not yet synced. */
export interface OfflineRecord {
  owner: string;
  local: AppState;
  base: AppState | null;
  dirty: boolean;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = action(tx.objectStore(STORE_NAME));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

const recordKey = (userId: string) => `record:${userId}`;

export async function loadOfflineRecord(userId: string): Promise<OfflineRecord | null> {
  const stored = await run<OfflineRecord | undefined>('readonly', (store) => store.get(recordKey(userId)));
  return stored ?? importLegacyRecord(userId);
}

export async function saveOfflineRecord(record: OfflineRecord): Promise<void> {
  await run('readwrite', (store) => store.put(record, recordKey(record.owner)));
}

/** Removes the account's copy only when nothing is waiting to reach the server. */
export async function discardSyncedRecord(userId: string): Promise<void> {
  const stored = await run<OfflineRecord | undefined>('readonly', (store) => store.get(recordKey(userId)));
  if (stored && !stored.dirty) {
    await run('readwrite', (store) => store.delete(recordKey(userId)));
  }
}

export async function deleteOfflineDatabase(): Promise<void> {
  try {
    const db = await openDatabase();
    db.close();
  } catch {
    // nothing open to close
  }
  dbPromise = null;
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

async function importLegacyRecord(userId: string): Promise<OfflineRecord | null> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_STATE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  const legacy = parseLegacyRecord(raw, userId);
  clearLegacyKeys();
  if (!legacy) return null;
  await saveOfflineRecord(legacy);
  return legacy;
}

function parseLegacyRecord(raw: string, userId: string): OfflineRecord | null {
  try {
    const owner = localStorage.getItem(LEGACY_OWNER_KEY);
    if (owner !== null && owner !== userId) return null;
    return {
      owner: userId,
      local: mergeState(JSON.parse(raw)),
      base: null,
      dirty: localStorage.getItem(LEGACY_PENDING_KEY) === '1',
    };
  } catch {
    return null;
  }
}

function clearLegacyKeys() {
  try {
    [LEGACY_STATE_KEY, LEGACY_PENDING_KEY, LEGACY_OWNER_KEY].forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage unavailable
  }
}
