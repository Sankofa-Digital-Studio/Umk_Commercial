/**
 * UAT Profile & ICE Guardians Service
 *
 * Manages 5 In Case of Emergency (ICE) contacts, survivor personal profile details,
 * emergency alert emails, and social media accounts for verification.
 *
 * When UAT Mode is active, all distress calls and SOS beacons are safely simulated
 * and verified in-app without dialing live South African emergency authorities.
 */

export interface IceContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  isPrimary: boolean;
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookProfile?: string;
}

export interface PersonalProfile {
  fullName: string;
  nationalId?: string;
  saIdNumber?: string;
  address?: string;
  medicalNotes?: string;
  medicalConditions?: string;
  safeWord?: string;
}

export interface EmergencySocials {
  alertEmail: string;
  twitterHandle: string;
  instagramHandle: string;
  facebookProfile: string;
  tiktokHandle?: string;
}

export interface UatProfile {
  userId?: string;
  isUatMode: boolean;
  contacts: IceContact[];
  personal: PersonalProfile;
  socials: EmergencySocials;
}

const STORAGE_KEY = "pcalc_uat_profile";
const LEGACY_STORAGE_KEYS = ["umkhuseli_uat_ice_profile", "umkhuseli_uat_profile", "pcalc_uat_ice_profile"];
const UAT_ACTIVE_KEY = "pcalc_uat_active";
const LEGACY_UAT_ACTIVE_KEY = "umkhuseli_uat_mode_active";

export const DEFAULT_UAT_PROFILE: UatProfile = {
  userId: "bebd4ef7-3f99-48d7-9e82-a1d85bfaaecd",
  isUatMode: false,
  contacts: [
    {
      id: "ice-1",
      name: "Lerato Khubeka",
      relationship: "Sister",
      phone: "0820000001",
      secondaryPhone: "0710000001",
      email: "lerato.ice@example.com",
      isPrimary: true,
      instagramHandle: "lerato_safeguard",
      tiktokHandle: "lerato_k",
      facebookProfile: "lerato.khubeka.sa",
    },
    {
      id: "ice-2",
      name: "Dr. Bongiwe Ndlovu",
      relationship: "Family Doctor / Medical ICE",
      phone: "+27 83 555 0102",
      secondaryPhone: "+27 82 555 0199",
      email: "dr.bongiwe@example.co.za",
      isPrimary: false,
      instagramHandle: "dr_bongiwe",
      tiktokHandle: "dr_bongiwe",
      facebookProfile: "dr.bongiwe.ndlovu",
    },
    {
      id: "ice-3",
      name: "Adv. Sipho Mthembu",
      relationship: "Legal Counsel / Advocate",
      phone: "+27 71 555 0103",
      email: "sipho.legal@example.co.za",
      isPrimary: false,
      instagramHandle: "adv_mthembu",
      tiktokHandle: "adv_sipho",
      facebookProfile: "sipho.mthembu.legal",
    },
    {
      id: "ice-4",
      name: "Nomsa Dlamini",
      relationship: "Trusted Neighbor",
      phone: "+27 76 555 0104",
      email: "nomsa.d@example.co.za",
      isPrimary: false,
      instagramHandle: "nomsa_dlamini",
      tiktokHandle: "nomsa_d",
      facebookProfile: "nomsa.dlamini.ice",
    },
    {
      id: "ice-5",
      name: "Sindi Khumalo",
      relationship: "Close Friend / Safe Haven Co-Holder",
      phone: "+27 84 555 0105",
      email: "sindi.k@example.co.za",
      isPrimary: false,
      instagramHandle: "sindi_khumalo",
      tiktokHandle: "sindi_k",
      facebookProfile: "sindi.khumalo.sa",
    },
  ],
  personal: {
    fullName: "Thandeka Nkosi",
    nationalId: "940815 0000 081",
    address: "Berea / Yeoville Safe Haven Corridor, Johannesburg",
    medicalNotes: "Type O+ Blood, Asthma Inhaler in Handbag, 2 Minor Dependents",
  },
  socials: {
    alertEmail: "thandeka.sos.backup@proton.me",
    twitterHandle: "@thandeka_sa",
    instagramHandle: "@thandeka_jhb",
    facebookProfile: "facebook.com/thandeka.nkosi.backup",
    tiktokHandle: "@thandeka_sa",
  },
};

/**
 * Normalizes phone number into international dialing format for WhatsApp
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith("0")) {
    cleaned = "27" + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Generates an active 72-Hour Live Location WhatsApp Link to dispatch to an ICE contact.
 */
export function generateWhatsAppBeaconUrl(
  contact: IceContact | string,
  beaconToken: string = "beacon_72h_active",
  coords?: { lat: number; lng: number }
): string {
  const phone = typeof contact === "string"
    ? sanitizePhoneForWhatsApp(contact)
    : sanitizePhoneForWhatsApp(contact.phone || contact.secondaryPhone || "");
  const contactName = typeof contact === "string" ? "Guardian" : contact.name;
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://umkhuseli.app";
  const beaconUrl = `${origin}?track=${encodeURIComponent(beaconToken)}`;

  const locPart = coords
    ? `\n📍 Last Known GPS: https://maps.google.com/?q=${coords.lat},${coords.lng}`
    : "";

  const text = encodeURIComponent(
    `🚨 [UMKHUSELI SAFE HAVEN DISTRESS ALERT]\n` +
    `Hello ${contactName}, this is an emergency alert. I am currently facing an urgent situation and need your assistance.\n\n` +
    `🛡️ 72-Hour Live Responder Link:\n${beaconUrl}${locPart}\n\n` +
    `Please monitor my location or dispatch SAPS (10111) if I do not check in.`
  );

  return `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
}

/**
 * Generates an emergency mailto link with distress telemetry to an ICE contact.
 */
export function generateDistressEmailUrl(
  contact: IceContact,
  coords?: { lat: number; lng: number }
): string {
  const recipient = contact.email || "";
  const subject = encodeURIComponent("🚨 URGENT: GBV Distress Beacon Dispatched via Umkhuseli");
  const locPart = coords
    ? `\nCoordinates: ${coords.lat}, ${coords.lng}\nLive Map: https://maps.google.com/?q=${coords.lat},${coords.lng}\n`
    : "";

  const body = encodeURIComponent(
    `EMERGENCY DISTRESS BEACON NOTIFICATION\n` +
    `Recipient: ${contact.name} (${contact.relationship})\n` +
    `Timestamp: ${new Date().toISOString()}\n` +
    `${locPart}\n` +
    `This alert was initiated from the Umkhuseli Safe Haven Protection System.\n` +
    `Please attempt to verify my safety or contact the National GBV Command Centre at 0800 428 428.`
  );

  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}

export function getUatProfile(): UatProfile {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_UAT_PROFILE,
      contacts: [...DEFAULT_UAT_PROFILE.contacts],
      personal: { ...DEFAULT_UAT_PROFILE.personal },
      socials: { ...DEFAULT_UAT_PROFILE.socials },
    };
  }
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        raw = localStorage.getItem(legacyKey);
        if (raw) break;
      }
    }
    if (raw) {
      const parsed: UatProfile = JSON.parse(raw);
      // Fallback check for uat active flag
      const uatActive = localStorage.getItem(UAT_ACTIVE_KEY) ?? localStorage.getItem(LEGACY_UAT_ACTIVE_KEY);
      if (uatActive !== null) {
        parsed.isUatMode = uatActive === "true";
      }
      parsed.userId = parsed.userId || DEFAULT_UAT_PROFILE.userId;
      return parsed;
    }
  } catch {
    /* fallback */
  }
  return {
    ...DEFAULT_UAT_PROFILE,
    contacts: [...DEFAULT_UAT_PROFILE.contacts],
    personal: { ...DEFAULT_UAT_PROFILE.personal },
    socials: { ...DEFAULT_UAT_PROFILE.socials },
  };
}

export function saveUatProfile(profile: UatProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem(UAT_ACTIVE_KEY, String(profile.isUatMode));
    // Clean up legacy keys
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(legacyKey);
    }
    localStorage.removeItem(LEGACY_UAT_ACTIVE_KEY);

    // Dispatch primary de-identified event and legacy event for compatibility
    window.dispatchEvent(new CustomEvent("pcalc_uat_profile_updated", { detail: profile }));
    window.dispatchEvent(new CustomEvent("umkhuseli_uat_profile_updated", { detail: profile }));
  } catch {
    /* fallback */
  }
}

export function setUatMode(enabled: boolean): void {
  const current = getUatProfile();
  current.isUatMode = enabled;
  saveUatProfile(current);
}
