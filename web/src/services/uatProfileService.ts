import { getOrCreateAnonymousSession, supabase } from "./supabase";

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

export type SurvivorDisguise =
  | "MUNICIPAL_PREPAID"
  | "MUSIC_PLAYER"
  | "DAILY_DEVOTIONAL"
  | "ANDROID_LAUNCHER";

export interface UatProfile {
  userId?: string;
  isUatMode: boolean;
  onboardingCompleted: boolean;
  preferredDisguise: SurvivorDisguise;
  contacts: IceContact[];
  personal: PersonalProfile;
  socials: EmergencySocials;
}

export type SurvivorSetupStep = "profile" | "ice" | "permissions";

const DEFAULT_PROFILE_VALUES = new Set(["", "survivor", "test user", "unknown", "n/a"]);
const DEFAULT_CONTACT_VALUES = new Set(["", "guardian", "ice contact", "test contact", "unknown"]);

export function isMeaningfulSurvivorProfile(profile: UatProfile): boolean {
  const name = profile.personal.fullName.trim().toLowerCase();
  const safeWord = (profile.personal.safeWord || "").trim().toLowerCase();
  return name.length >= 2 && !DEFAULT_PROFILE_VALUES.has(name) && safeWord.length >= 3 && !DEFAULT_PROFILE_VALUES.has(safeWord);
}

export function isMeaningfulIceContact(contact: IceContact): boolean {
  const name = contact.name.trim().toLowerCase();
  const digits = contact.phone.replace(/\D/g, "");
  return name.length >= 2 && !DEFAULT_CONTACT_VALUES.has(name) && digits.length >= 9 && !/^(0|1|2|9)\1+$/.test(digits);
}

export function getSurvivorSetupStep(profile: UatProfile): SurvivorSetupStep | null {
  if (!isMeaningfulSurvivorProfile(profile)) return "profile";
  if (!profile.contacts.some(isMeaningfulIceContact)) return "ice";
  if (!profile.onboardingCompleted) return "permissions";
  return null;
}

const LEGACY_PROFILE_KEYS = [
  "pcalc_uat_profile",
  "umkhuseli_uat_ice_profile",
  "umkhuseli_uat_profile",
  "pcalc_uat_ice_profile",
  "pcalc_survivor_onboarded",
];
const PROFILE_EVENT_NAME = "pcalc_uat_profile_updated";

export const EMPTY_UAT_PROFILE: UatProfile = {
  isUatMode: false,
  onboardingCompleted: false,
  preferredDisguise: "MUNICIPAL_PREPAID",
  contacts: [],
  personal: { fullName: "" },
  socials: {
    alertEmail: "",
    twitterHandle: "",
    instagramHandle: "",
    facebookProfile: "",
    tiktokHandle: "",
  },
};

let profileCache: UatProfile = cloneProfile(EMPTY_UAT_PROFILE);

function cloneProfile(profile: UatProfile): UatProfile {
  return {
    ...profile,
    contacts: profile.contacts.map((contact) => ({ ...contact })),
    personal: { ...profile.personal },
    socials: { ...profile.socials },
  };
}

function clearLegacyProfileStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_PROFILE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Private browsing can deny storage access. No profile data is retained locally.
    }
  }
}

function publishProfile(profile: UatProfile): UatProfile {
  profileCache = cloneProfile(profile);
  clearLegacyProfileStorage();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT_NAME, { detail: cloneProfile(profileCache) }));
  }
  return cloneProfile(profileCache);
}

export function getUatProfile(): UatProfile {
  return cloneProfile(profileCache);
}

export async function loadUatProfile(): Promise<UatProfile> {
  clearLegacyProfileStorage();
  const session = await getOrCreateAnonymousSession();
  const userId = session?.user.id;
  if (!userId) return getUatProfile();

  const [profileResult, guardiansResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("guardians").select("*").eq("user_id", userId).order("position", { ascending: true }),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (guardiansResult.error) throw guardiansResult.error;

  const row = profileResult.data;
  const contacts: IceContact[] = (guardiansResult.data || []).map((guardian) => ({
    id: guardian.id,
    name: [guardian.name, guardian.surname].filter(Boolean).join(" ").trim(),
    relationship: guardian.relationship || "Guardian",
    phone: guardian.mobile_number_1,
    secondaryPhone: guardian.mobile_number_2 || undefined,
    email: guardian.email_address_1 || "",
    isPrimary: Boolean(guardian.is_primary),
    instagramHandle: guardian.instagram_handle || undefined,
    tiktokHandle: guardian.tiktok_handle || undefined,
    facebookProfile: guardian.facebook_profile || undefined,
  }));

  return publishProfile({
    userId,
    isUatMode: Boolean(row?.is_uat_mode),
    onboardingCompleted: Boolean(row?.onboarding_completed_at),
    preferredDisguise: (row?.preferred_disguise || "MUNICIPAL_PREPAID") as SurvivorDisguise,
    contacts,
    personal: {
      fullName: row?.full_name || "",
      saIdNumber: row?.sa_id_number || "",
      safeWord: row?.safe_word || "",
      medicalConditions: row?.medical_conditions || "",
    },
    socials: {
      alertEmail: row?.alert_email || "",
      twitterHandle: row?.twitter_handle || "",
      instagramHandle: row?.instagram_handle || "",
      facebookProfile: row?.facebook_profile || "",
      tiktokHandle: "",
    },
  });
}

export async function saveUatProfile(profile: UatProfile): Promise<UatProfile> {
  const session = await getOrCreateAnonymousSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("A secure user session is required before saving survivor data.");

  const now = new Date().toISOString();
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: profile.personal.fullName.trim(),
      sa_id_number: profile.personal.saIdNumber?.trim() || "",
      safe_word: profile.personal.safeWord?.trim().toUpperCase() || "",
      medical_conditions: profile.personal.medicalConditions?.trim() || "",
      alert_email: profile.socials.alertEmail.trim(),
      twitter_handle: profile.socials.twitterHandle.trim(),
      instagram_handle: profile.socials.instagramHandle.trim(),
      facebook_profile: profile.socials.facebookProfile.trim(),
      preferred_disguise: profile.preferredDisguise,
      is_uat_mode: profile.isUatMode,
      onboarding_completed_at: profile.onboardingCompleted ? now : null,
      updated_at: now,
    },
    { onConflict: "id" }
  );
  if (profileError) throw profileError;

  const normalizedContacts = profile.contacts.slice(0, 5).map((contact, index) => ({
    ...contact,
    id: isUuid(contact.id) ? contact.id : crypto.randomUUID(),
    isPrimary: index === 0,
  }));

  const { data: existingRows, error: existingError } = await supabase
    .from("guardians")
    .select("id")
    .eq("user_id", userId);
  if (existingError) throw existingError;

  const retainedIds = new Set(normalizedContacts.map((contact) => contact.id));
  const removedIds = (existingRows || []).map((row) => row.id).filter((id) => !retainedIds.has(id));
  if (removedIds.length > 0) {
    const { error: deleteError } = await supabase.from("guardians").delete().in("id", removedIds);
    if (deleteError) throw deleteError;
  }

  if (normalizedContacts.length > 0) {
    const guardianRows = normalizedContacts.map((contact, index) => ({
      id: contact.id,
      user_id: userId,
      name: contact.name.trim(),
      surname: "",
      mobile_number_1: contact.phone.trim(),
      mobile_number_2: contact.secondaryPhone?.trim() || "",
      email_address_1: contact.email.trim(),
      email_address_2: "",
      relationship: contact.relationship.trim() || "Guardian",
      instagram_handle: contact.instagramHandle?.trim() || "",
      tiktok_handle: contact.tiktokHandle?.trim() || "",
      facebook_profile: contact.facebookProfile?.trim() || "",
      is_primary: index === 0,
      position: index + 1,
      updated_at: now,
    }));
    const { error: guardiansError } = await supabase.from("guardians").upsert(guardianRows, { onConflict: "id" });
    if (guardiansError) throw guardiansError;
  }

  return publishProfile({ ...profile, userId, contacts: normalizedContacts });
}

export async function setUatMode(enabled: boolean): Promise<UatProfile> {
  return saveUatProfile({ ...getUatProfile(), isUatMode: enabled });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function sanitizePhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
  else if (cleaned.startsWith("0")) cleaned = `27${cleaned.substring(1)}`;
  return cleaned;
}

export function generateWhatsAppBeaconUrl(
  contact: IceContact | string,
  beaconToken = "beacon_72h_active",
  coords?: { lat: number; lng: number }
): string {
  const phone = typeof contact === "string"
    ? sanitizePhoneForWhatsApp(contact)
    : sanitizePhoneForWhatsApp(contact.phone || contact.secondaryPhone || "");
  const contactName = typeof contact === "string" ? "Guardian" : contact.name;
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://ishekomberera.vercel.app";
  const beaconUrl = `${origin}?track=${encodeURIComponent(beaconToken)}`;
  const locPart = coords ? `\n📍 Last Known GPS: https://maps.google.com/?q=${coords.lat},${coords.lng}` : "";
  const text = encodeURIComponent(
    `🚨 [UMKHUSELI SAFE HAVEN DISTRESS ALERT]\nHello ${contactName}, this is an emergency alert. I need your assistance.\n\n` +
      `🛡️ 72-Hour Live Responder Link:\n${beaconUrl}${locPart}\n\n` +
      "Please monitor my location or dispatch SAPS (10111) if I do not check in."
  );
  return `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
}

export function generateDistressEmailUrl(
  contact: IceContact,
  coords?: { lat: number; lng: number }
): string {
  const subject = encodeURIComponent("🚨 URGENT: GBV Distress Beacon Dispatched via Umkhuseli");
  const locPart = coords
    ? `\nCoordinates: ${coords.lat}, ${coords.lng}\nLive Map: https://maps.google.com/?q=${coords.lat},${coords.lng}\n`
    : "";
  const body = encodeURIComponent(
    `EMERGENCY DISTRESS BEACON NOTIFICATION\nRecipient: ${contact.name} (${contact.relationship})\n` +
      `Timestamp: ${new Date().toISOString()}\n${locPart}\n` +
      "This alert was initiated from the Umkhuseli Safe Haven Protection System.\n" +
      "Please verify my safety or contact the National GBV Command Centre at 0800 428 428."
  );
  return `mailto:${contact.email || ""}?subject=${subject}&body=${body}`;
}
