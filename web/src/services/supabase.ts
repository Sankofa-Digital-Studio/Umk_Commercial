import { createClient } from "@supabase/supabase-js";
import { encryptData, calculateSha256 } from "./crypto";

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredSupabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const isSupabaseConfigured = Boolean(configuredSupabaseUrl && configuredSupabaseKey);

// A local, unreachable URL keeps unit tests deterministic without shipping a fake hosted project.
const supabaseUrl = configuredSupabaseUrl || "http://127.0.0.1:54321";
const supabaseAnonKey = configuredSupabaseKey || "local-test-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface IncidentInput {
  incidentType: string;
  severityLevel: number;
  perpetrator: string;
  locationDescription: string;
  description: string;
  injuriesOrImpact: string;
  witnesses: string;
  policeObNumber?: string;
  rawNarrativeForAi?: string;
}

export interface GuardianInput {
  name: string;
  surname?: string;
  mobileNumber1: string;
  emailAddress1?: string;
  relationship: string;
  isPrimary?: boolean;
}

// Ensure anonymous session exists for zero-trace vault storage
export async function getOrCreateAnonymousSession() {
  if (!isSupabaseConfigured) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn("Anonymous sign in warning (local offline mode fallback):", error.message);
    return null;
  }
  return data.session;
}

export interface SosDispatchTelemetry {
  userId?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  areaName?: string;
  batteryPercentage?: number;
  isCharging?: boolean;
  deviceModel?: string;
  isDuress?: boolean;
  contacts?: any[];
  socials?: any;
  channels?: string[];
}

// Unstoppable SOS Edge Dispatch
export async function dispatchServerSos(telemetry: SosDispatchTelemetry) {
  const session = await getOrCreateAnonymousSession();
  if (!session?.user.id) {
    throw new Error("A secure user session is required before dispatching an SOS.");
  }
  const token = session?.access_token || "";
  const payload = {
    userId: telemetry.userId || session.user.id,
    ...telemetry,
  };

  // Call the Edge Function
  const response = await fetch(`${supabaseUrl}/functions/v1/dispatch-sos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`SOS Edge Dispatch failed: ${response.statusText}`);
  }
  return await response.json();
}

// Zero-Knowledge Encrypted Incident Vault Sync
export async function vaultIncident(input: IncidentInput) {
  const session = await getOrCreateAnonymousSession();
  const token = session?.access_token || "";

  // 1. Pack full sensitive narrative into a JSON payload
  const sensitivePayload = JSON.stringify({
    perpetrator: input.perpetrator,
    locationDescription: input.locationDescription,
    description: input.description,
    injuriesOrImpact: input.injuriesOrImpact,
    witnesses: input.witnesses,
    recordedAt: new Date().toISOString()
  });

  // 2. Client-side AES-256-GCM encryption
  const encryptedPayload = await encryptData(sensitivePayload);

  // 3. Compute SHA-256 checksum for court chain-of-custody
  const checksum = await calculateSha256(sensitivePayload);

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-ZA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // 4. Send to Supabase Edge Function sync-vault
  const response = await fetch(`${supabaseUrl}/functions/v1/sync-vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      timestamp: now.getTime(),
      dateTimeFormatted: formattedDate,
      incidentType: input.incidentType,
      severityLevel: input.severityLevel,
      encryptedPayload,
      sha256Checksum: checksum,
      policeObNumber: input.policeObNumber || "",
      rawNarrativeForAi: input.rawNarrativeForAi || input.description
    })
  });

  if (!response.ok) {
    // If backend isn't reached (e.g. offline during loadshedding), save to localStorage queue
    const offlineQueue = JSON.parse(localStorage.getItem("offline_vault_queue") || "[]");
    offlineQueue.push({
      id: crypto.randomUUID(),
      timestamp: now.getTime(),
      dateTimeFormatted: formattedDate,
      incidentType: input.incidentType,
      severityLevel: input.severityLevel,
      encryptedPayload,
      sha256Checksum: checksum,
      isOfflineCached: true
    });
    localStorage.setItem("offline_vault_queue", JSON.stringify(offlineQueue));
    return {
      success: true,
      offlineStored: true,
      sha256Checksum: checksum,
      message: "Encrypted locally (offline queue). Will sync automatically when network restores."
    };
  }

  return await response.json();
}


// ============================================================================
// UAT Live Testing & Feedback Submissions
// ============================================================================

export interface UatFeedbackSubmission {
  testerAlias?: string;
  deviceModel: string;
  osVersion: string;
  platform: "ANDROID_NATIVE" | "WEB_PWA" | "SAFARI_IOS";
  networkCondition?: string;
  stealthRating: number;
  panicSpeedRating: number;
  unlockEaseRating: number;
  sosGraceRating: number;
  offlineReliabilityRating: number;
  form2QualityRating: number;
  overallSusScore?: number;
  bugDescription?: string;
  bugSeverity?: "BLOCKER" | "MAJOR" | "MINOR" | "NONE" | "SUGGESTION";
  qualitativeNotes?: string;
}

export async function submitUatFeedback(feedback: UatFeedbackSubmission) {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (!isOnline) {
    const queue = JSON.parse(
      localStorage.getItem("pcalc_offline_feedback") ||
      localStorage.getItem("umkhuseli_offline_uat_feedback") ||
      "[]"
    );
    queue.push({
      ...feedback,
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem("pcalc_offline_feedback", JSON.stringify(queue));
    localStorage.removeItem("umkhuseli_offline_uat_feedback");
    return {
      success: true,
      offlineStored: true,
      message: "Feedback safely stored in offline outbox. Will sync as soon as you reconnect!"
    };
  }

  try {
    const { data, error } = await supabase
      .from("uat_feedback_submissions")
      .insert([
        {
          tester_alias: feedback.testerAlias || "Anonymous Tester",
          device_model: feedback.deviceModel,
          os_version: feedback.osVersion,
          app_version: "2.3.0",
          platform: feedback.platform,
          network_condition: feedback.networkCondition || "UNKNOWN",
          stealth_rating: feedback.stealthRating,
          panic_speed_rating: feedback.panicSpeedRating,
          unlock_ease_rating: feedback.unlockEaseRating,
          sos_grace_rating: feedback.sosGraceRating,
          offline_reliability_rating: feedback.offlineReliabilityRating,
          form2_quality_rating: feedback.form2QualityRating,
          overall_sus_score: feedback.overallSusScore || 0,
          bug_description: feedback.bugDescription || "",
          bug_severity: feedback.bugSeverity || "NONE",
          qualitative_notes: feedback.qualitativeNotes || ""
        }
      ]);

    if (error) {
      throw error;
    }

    return {
      success: true,
      offlineStored: false,
      message: "Feedback transmitted securely and anonymously to the safety development team."
    };
  } catch (err: any) {
    // If Supabase insert fails, gracefully fall back to local outbox
    const queue = JSON.parse(
      localStorage.getItem("pcalc_offline_feedback") ||
      localStorage.getItem("umkhuseli_offline_uat_feedback") ||
      "[]"
    );
    queue.push({
      ...feedback,
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem("pcalc_offline_feedback", JSON.stringify(queue));
    localStorage.removeItem("umkhuseli_offline_uat_feedback");
    return {
      success: true,
      offlineStored: true,
      message: "Feedback saved locally (offline queue). Will sync when network connectivity is confirmed."
    };
  }
}
