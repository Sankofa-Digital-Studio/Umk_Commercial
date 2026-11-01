/**
 * Chameleon Disguise Architecture - Disguise Manager
 * Manages active facade configuration between:
 * 1. PowerCalc SA (Municipal Prepaid Electricity Calculator)
 * 2. Coco Bongo Beats (Music Player / Streaming Camouflage)
 * 3. GraceShare Bible SA (Voice Note Sermons, Images & Devotionals)
 * 4. Ipkiss Minimalist Launcher (Native Android Home Screen & Dialpad)
 */

export type DisguiseType = 'MUNICIPAL_PREPAID' | 'MUSIC_PLAYER' | 'DAILY_DEVOTIONAL' | 'ANDROID_LAUNCHER';

export interface DisguiseMetadata {
  id: DisguiseType;
  name: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  themeColor: string;
}

export const PUBLIC_FACING_DOMAIN = 'ishekomberera.vercel.app';
export const DISGUISE_STORAGE_KEY = 'umkhuseli_active_disguise';
export const DISGUISE_EVENT_NAME = 'umkhuseli_disguise_change';
export const DISGUISE_SEQUENCE_MAP: Readonly<Record<string, DisguiseType>> = {
  '8421': 'MUNICIPAL_PREPAID',
  '8422': 'MUSIC_PLAYER',
  '8423': 'DAILY_DEVOTIONAL',
  '8424': 'ANDROID_LAUNCHER',
};

const FACE_QUERY_MAP: Readonly<Record<string, DisguiseType>> = {
  '1': 'MUNICIPAL_PREPAID',
  '2': 'MUSIC_PLAYER',
  '3': 'DAILY_DEVOTIONAL',
  '4': 'ANDROID_LAUNCHER',
};

export const DISGUISE_CATALOG: Record<DisguiseType, DisguiseMetadata> = {
  MUNICIPAL_PREPAID: {
    id: 'MUNICIPAL_PREPAID',
    name: 'PowerCalc SA',
    title: 'Prepaid Electricity Portal',
    subtitle: 'Municipal Utility Token Management & Tariff Calculator',
    icon: 'Zap',
    description: 'South African municipal prepaid electricity calculator & token manager.',
    themeColor: '#0F172A',
  },
  MUSIC_PLAYER: {
    id: 'MUSIC_PLAYER',
    name: 'Coco Bongo Beats',
    title: 'Edge City Audio & Music',
    subtitle: 'Streaming South African Amapiano, Afro House & Gospel',
    icon: 'Music',
    description: 'South African music player with playlists, offline playback, and audio waveforms.',
    themeColor: '#09090B',
  },
  DAILY_DEVOTIONAL: {
    id: 'DAILY_DEVOTIONAL',
    name: 'Daily Verse SA',
    title: 'Daily Scripture & Devotional',
    subtitle: 'Voice Note Sermons, Status Cards & Devotionals',
    icon: 'BookOpen',
    description: 'Faith-based Bible sharing app with voice note sermons, daily status cards, and reflections in English, isiZulu, and Sesotho.',
    themeColor: '#1E1B4B',
  },
  ANDROID_LAUNCHER: {
    id: 'ANDROID_LAUNCHER',
    name: 'Ipkiss Launcher',
    title: 'Minimalist Mobile Home',
    subtitle: 'Clean Android Home Screen with Dialer & Quick Apps',
    icon: 'LayoutGrid',
    description: 'Minimalist Android launcher disguise featuring native dialpad, weather widget, and search.',
    themeColor: '#18181B',
  },
};

const VALID_DISGUISES: ReadonlySet<string> = new Set([
  'MUNICIPAL_PREPAID',
  'MUSIC_PLAYER',
  'DAILY_DEVOTIONAL',
  'ANDROID_LAUNCHER',
]);

/**
 * Retrieves the currently active disguise facade from storage or returns default.
 */
export function getActiveDisguise(): DisguiseType {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const urlDisguise = getDisguiseFromUrl(window.location.href);
      if (urlDisguise) {
        window.localStorage.setItem(DISGUISE_STORAGE_KEY, urlDisguise);
        return urlDisguise;
      }
      const stored = window.localStorage.getItem(DISGUISE_STORAGE_KEY);
      if (stored && VALID_DISGUISES.has(stored)) {
        return stored as DisguiseType;
      }
    } catch {
      // Ignore private browsing / sandbox restrictions
    }
  }
  return 'MUNICIPAL_PREPAID';
}

/** Resolves a covert four-digit face sequence without opening Safe Haven. */
export function getDisguiseFromSequence(sequence: string): DisguiseType | null {
  return DISGUISE_SEQUENCE_MAP[sequence.replace(/\D/g, '').slice(-4)] || null;
}

/** Resolves ?face=1..4 or ?face=<disguise-id> on the public Vercel origin. */
export function getDisguiseFromUrl(url: string): DisguiseType | null {
  try {
    const value = new URL(url).searchParams.get('face');
    if (!value) return null;
    const normalized = value.trim().toUpperCase();
    if (FACE_QUERY_MAP[normalized]) return FACE_QUERY_MAP[normalized];
    if (VALID_DISGUISES.has(normalized)) return normalized as DisguiseType;
  } catch {
    // Invalid or unavailable URL.
  }
  return null;
}

/** Creates a stable same-origin URL for a selected public-facing facade. */
export function getDisguiseUrl(disguise: DisguiseType): string {
  const faceNumber = Object.entries(FACE_QUERY_MAP).find(([, id]) => id === disguise)?.[0] || '1';
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : `https://${PUBLIC_FACING_DOMAIN}`;
  return `${origin}/?face=${faceNumber}`;
}

/**
 * Persists and activates a new disguise facade, returning its metadata.
 */
export function setActiveDisguise(disguise: DisguiseType): DisguiseMetadata {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(DISGUISE_STORAGE_KEY, disguise);
      window.dispatchEvent(
        new CustomEvent(DISGUISE_EVENT_NAME, { detail: disguise })
      );
    } catch {
      // Ignore storage errors
    }
  }
  return getDisguiseMetadata(disguise);
}

/**
 * Returns metadata for the given disguise or the currently active disguise.
 */
export function getDisguiseMetadata(disguise?: DisguiseType): DisguiseMetadata {
  const target = disguise || getActiveDisguise();
  return DISGUISE_CATALOG[target] || DISGUISE_CATALOG.MUNICIPAL_PREPAID;
}

/**
 * Returns all supported disguise configurations.
 */
export function getAllDisguises(): DisguiseMetadata[] {
  return Object.values(DISGUISE_CATALOG);
}

/**
 * Resets the disguise back to the default municipal prepaid calculator facade.
 */
export function resetDisguise(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(DISGUISE_STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent(DISGUISE_EVENT_NAME, { detail: 'MUNICIPAL_PREPAID' })
      );
    } catch {
      // Ignore
    }
  }
}
