import { getOrCreateAnonymousSession, isSupabaseConfigured, supabase } from "./supabase";

export const BEACON_TTL_MS = 72 * 60 * 60 * 1000;
export const LOCATION_REFRESH_DISTANCE_METERS = 500;

export interface LiveSosBeacon {
  id: string;
  status: "PENDING" | "PROCESSING" | "DISPATCHED" | "RESOLVED" | "FALSE_ALARM";
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  areaName: string;
  batteryPercentage: number | null;
  isCharging: boolean;
  deviceModel: string;
  createdAt: string;
  dispatchedAt: string | null;
  responderToken: string;
  expiresAt: string;
}

type BeaconRow = {
  id: string;
  status: LiveSosBeacon["status"];
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  area_name: string | null;
  battery_percentage: number | null;
  is_charging: boolean | null;
  device_model: string | null;
  created_at: string;
  dispatched_at: string | null;
  responder_token: string;
  expires_at: string;
};

function mapBeacon(row: BeaconRow): LiveSosBeacon {
  return {
    id: row.id,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    areaName: row.area_name || "Location unavailable",
    batteryPercentage: row.battery_percentage,
    isCharging: Boolean(row.is_charging),
    deviceModel: row.device_model || "",
    createdAt: row.created_at,
    dispatchedAt: row.dispatched_at,
    responderToken: row.responder_token,
    expiresAt: row.expires_at,
  };
}

export function getBeaconStartedAt(beacon: Pick<LiveSosBeacon, "createdAt" | "dispatchedAt">): number | null {
  const value = beacon.dispatchedAt || beacon.createdAt;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isBeaconActive(beacon: LiveSosBeacon | null, now = Date.now()): boolean {
  if (!beacon || !["PROCESSING", "DISPATCHED"].includes(beacon.status)) return false;
  const startedAt = getBeaconStartedAt(beacon);
  const expiresAt = Date.parse(beacon.expiresAt);
  return startedAt !== null
    && startedAt <= now
    && Number.isFinite(expiresAt)
    && expiresAt > now
    && now - startedAt < BEACON_TTL_MS;
}

export function formatBeaconRelativeTime(iso: string | null | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (!Number.isFinite(then) || then > now) return null;
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function haversineDistanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusMeters = 6_371_000;
  const deltaLat = radians(to.latitude - from.latitude);
  const deltaLng = radians(to.longitude - from.longitude);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude))
    * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function loadActiveSosBeacon(beaconId?: string): Promise<LiveSosBeacon | null> {
  if (!isSupabaseConfigured) return null;

  if (beaconId) {
    const { data, error } = await supabase.functions.invoke("get-beacon", {
      body: { token: beaconId },
    });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 404) return null;
      throw new Error(`Unable to verify responder beacon: ${error.message}`);
    }
    return data?.beacon ? mapBeacon(data.beacon as BeaconRow) : null;
  }

  const session = await getOrCreateAnonymousSession();
  if (!session?.user.id) return null;

  const { data, error } = await supabase
    .from("sos_beacons")
    .select("id,status,latitude,longitude,accuracy,area_name,battery_percentage,is_charging,device_model,created_at,dispatched_at,responder_token,expires_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Unable to load live beacon: ${error.message}`);
  if (!data) return null;
  const beacon = mapBeacon(data as BeaconRow);
  return isBeaconActive(beacon) ? beacon : null;
}

export async function persistBeaconLocation(
  beaconId: string,
  location: { latitude: number; longitude: number; accuracy: number; areaName: string },
): Promise<LiveSosBeacon> {
  const session = await getOrCreateAnonymousSession();
  if (!session?.user.id) throw new Error("An authenticated survivor session is required.");
  const { data, error, status } = await supabase
    .from("sos_beacons")
    .update({
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      area_name: location.areaName,
    })
    .eq("id", beaconId)
    .eq("user_id", session.user.id)
    .select("id,status,latitude,longitude,accuracy,area_name,battery_percentage,is_charging,device_model,created_at,dispatched_at,responder_token,expires_at")
    .single();
  if (error || status < 200 || status >= 300 || !data) {
    throw new Error(`Location update failed${error?.message ? `: ${error.message}` : "."}`);
  }
  return mapBeacon(data as BeaconRow);
}

export function buildEphemeralResponderLink(beacon: LiveSosBeacon | null, origin: string, now = Date.now()): string | null {
  if (!isBeaconActive(beacon, now)) return null;
  return `${origin}/?track=${encodeURIComponent(beacon!.responderToken)}`;
}
