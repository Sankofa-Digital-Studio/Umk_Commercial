/**
 * Encrypted Vault IndexedDB Service
 *
 * Local-First, Zero-Knowledge Encrypted Incident Storage.
 *
 * Camouflage Identity:
 * Database Name: 'pcalc_local_cache'
 * Object Store:  'grid_metrics'
 *
 * CRITICAL ADVERSARY DEFENSE & LEGAL CHAIN-OF-CUSTODY:
 * 1. Incidents are stored exclusively as AES-256-GCM encrypted records with individual IVs
 *    and ECTA Section 15 SHA-256 integrity checksums.
 * 2. No plaintext names, perpetrators, statements, or locations ever touch persistent storage.
 * 3. Camouflage database and store names completely strip 'umkhuseli_' or GBV identifiers.
 * 4. 0ms panic camouflage scrub purges all in-memory decrypted incident caches synchronously.
 * 5. Automatic migration cleanly transfers legacy plaintext localStorage into encrypted IndexedDB
 *    and immediately removes the legacy keys.
 */

import {
  encryptData,
  decryptData,
  calculateSha256,
  clearCryptoKeyCache,
} from "./crypto";

export interface CourtIncidentRecord {
  id: string;
  type: string;
  severity: number;
  perpetrator: string;
  location: string;
  date: string;
  statement: string;
  injuriesOrImpact?: string;
  witnesses?: string;
  sapsObNumber?: string;
  isEncrypted: boolean;
  sha256Checksum?: string;
}

export interface EncryptedGridMetricRecord {
  id: string;
  iv: string;
  cipherText: string;
  checksum: string;
  createdAt: number;
  updatedAt: number;
}

// Camouflaged storage identifiers
const DB_NAME = "pcalc_local_cache";
const STORE_NAME = "grid_metrics";
const DB_VERSION = 1;
const FALLBACK_STORAGE_KEY = "pcalc_cache_v2";
const LEGACY_STORAGE_KEY = "umkhuseli_recorded_incidents";

// In-memory cache of decrypted records for active session
let inMemoryDecryptedCache: CourtIncidentRecord[] | null = null;
// In-memory fallback if IndexedDB is not supported
let inMemoryStoreFallback: Map<string, EncryptedGridMetricRecord> = new Map();

/**
 * 0ms Panic Camouflage Scrub:
 * Synchronously wipes in-memory decrypted incident caches and derived cryptographic keys.
 */
export function clearVaultMemory(): void {
  if (inMemoryDecryptedCache) {
    for (const record of inMemoryDecryptedCache) {
      record.statement = "";
      record.perpetrator = "";
      record.location = "";
      if (record.injuriesOrImpact) record.injuriesOrImpact = "";
      if (record.witnesses) record.witnesses = "";
    }
  }
  inMemoryDecryptedCache = null;
  clearCryptoKeyCache();
}

/**
 * Internal helper to obtain indexedDB factory
 */
function getIndexedDbFactory(): IDBFactory | null {
  if (typeof window !== "undefined" && window.indexedDB) {
    return window.indexedDB;
  }
  if (typeof globalThis !== "undefined" && globalThis.indexedDB) {
    return globalThis.indexedDB;
  }
  return null;
}

/**
 * Opens the camouflaged 'pcalc_local_cache' IndexedDB database.
 */
function openDatabase(): Promise<IDBDatabase | null> {
  const factory = getIndexedDbFactory();
  if (!factory) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = factory.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("IndexedDB open failed, using fallback encrypted store:", request.error);
        resolve(null);
      };
    } catch (e) {
      console.warn("IndexedDB initialization error:", e);
      resolve(null);
    }
  });
}

/**
 * Reads all encrypted records from storage (IndexedDB with fallback)
 */
async function getAllRawEncryptedRecords(): Promise<EncryptedGridMetricRecord[]> {
  const db = await openDatabase();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(Array.from(inMemoryStoreFallback.values()));
      } catch (err) {
        resolve(Array.from(inMemoryStoreFallback.values()));
      }
    });
  }

  // Fallback: obfuscated localStorage cache or in-memory map
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
  }

  return Array.from(inMemoryStoreFallback.values());
}

/**
 * Writes an encrypted record to storage
 */
async function putRawEncryptedRecord(record: EncryptedGridMetricRecord): Promise<void> {
  inMemoryStoreFallback.set(record.id, record);

  const db = await openDatabase();
  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback storage
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const records = Array.from(inMemoryStoreFallback.values());
      window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(records));
    } catch {}
  }
}

/**
 * Deletes an encrypted record from storage
 */
async function deleteRawEncryptedRecord(id: string): Promise<void> {
  inMemoryStoreFallback.delete(id);

  const db = await openDatabase();
  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const records = Array.from(inMemoryStoreFallback.values());
      window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(records));
    } catch {}
  }
}

/**
 * Automatically migrates legacy plaintext incidents from 'umkhuseli_recorded_incidents'
 * into encrypted records in 'pcalc_local_cache' and removes the legacy plaintext key.
 */
export async function migrateLegacyIncidents(pin?: string): Promise<number> {
  if (typeof window === "undefined" || !window.localStorage) {
    return 0;
  }

  let rawLegacy: string | null = null;
  try {
    rawLegacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {}

  if (!rawLegacy) {
    return 0;
  }

  try {
    const parsed: CourtIncidentRecord[] = JSON.parse(rawLegacy);
    if (Array.isArray(parsed) && parsed.length > 0) {
      for (const item of parsed) {
        await saveIncidentEncrypted(item, pin);
      }
      // Scrub legacy plaintext storage key
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return parsed.length;
    }
  } catch (err) {
    console.warn("Legacy incident migration error:", err);
  }

  // Clear plaintext key regardless to prevent forensic leakage
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {}

  return 0;
}

/**
 * Saves a CourtIncidentRecord encrypted at-rest using AES-256-GCM.
 * Extracts individual 12-byte IV and computes ECTA SHA-256 checksum.
 */
export async function saveIncidentEncrypted(
  record: CourtIncidentRecord,
  pin?: string
): Promise<void> {
  const plainJson = JSON.stringify(record);
  const checksum = record.sha256Checksum || (await calculateSha256(plainJson));
  const cipherText = await encryptData(plainJson, pin);

  // Extract the 12-byte IV from the "ENC:" envelope
  let iv = "";
  try {
    const rawBase64 = cipherText.replace("ENC:", "");
    const binary = atob(rawBase64);
    iv = btoa(binary.substring(0, 12));
  } catch {
    iv = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12))));
  }

  const encryptedRecord: EncryptedGridMetricRecord = {
    id: record.id,
    iv,
    cipherText,
    checksum,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await putRawEncryptedRecord(encryptedRecord);

  // Update in-memory decrypted cache if active
  if (inMemoryDecryptedCache) {
    const index = inMemoryDecryptedCache.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      inMemoryDecryptedCache[index] = { ...record, isEncrypted: false, sha256Checksum: checksum };
    } else {
      inMemoryDecryptedCache.unshift({ ...record, isEncrypted: false, sha256Checksum: checksum });
    }
  }
}

/**
 * Retrieves and decrypts all records from encrypted IndexedDB storage.
 * Automatically performs legacy migration and default initialization.
 */
export async function getIncidentsDecrypted(pin?: string): Promise<CourtIncidentRecord[]> {
  // If memory cache exists and has items, return it
  if (inMemoryDecryptedCache && inMemoryDecryptedCache.length > 0) {
    return inMemoryDecryptedCache;
  }

  // 1. Run migration if legacy plaintext exists
  await migrateLegacyIncidents(pin);

  // 2. Fetch all encrypted records
  const rawRecords = await getAllRawEncryptedRecords();

  // 3. Decrypt only survivor-created records. Empty storage remains empty.
  const decryptedList: CourtIncidentRecord[] = [];
  for (const raw of rawRecords) {
    try {
      const decryptedJson = await decryptData(raw.cipherText, pin);
      // If record is locked with a different PIN or decryption failed, leave as encrypted
      if (!decryptedJson || decryptedJson.startsWith("ENC:")) {
        continue;
      }
      const parsed: CourtIncidentRecord = JSON.parse(decryptedJson);
      decryptedList.push({
        ...parsed,
        isEncrypted: false,
        sha256Checksum: raw.checksum || parsed.sha256Checksum,
      });
    } catch (e) {
      console.warn(`Failed to decrypt record ${raw.id}:`, e);
    }
  }

  inMemoryDecryptedCache = decryptedList;
  return decryptedList;
}

/**
 * Deletes an incident record permanently from encrypted storage.
 */
export async function deleteIncident(id: string): Promise<void> {
  await deleteRawEncryptedRecord(id);
  if (inMemoryDecryptedCache) {
    inMemoryDecryptedCache = inMemoryDecryptedCache.filter((r) => r.id !== id);
  }
}
