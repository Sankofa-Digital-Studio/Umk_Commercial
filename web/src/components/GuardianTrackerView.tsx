import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  ExternalLink,
  Battery,
  Clock,
  Radio,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { THUTHUZELA_CENTERS, sortCentresByDistance } from "../data/saSafetyData";
import {
  inferSouthAfricanLocationSync,
  readDeviceLocationWithDetails,
  SouthAfricanLocationDetails,
} from "../services/deviceLocationResolver";
import {
  formatBeaconRelativeTime,
  haversineDistanceMeters,
  LiveSosBeacon,
  loadActiveSosBeacon,
  persistBeaconLocation,
} from "../services/liveBeaconService";
import { HttpToastNotification } from "./common/HttpToastNotification";
import { useHttpToasts } from "../hooks/useHttpToasts";

interface Props {
  beaconToken?: string;
  onExit?: () => void;
}


export const GuardianTrackerView: React.FC<Props> = ({
  beaconToken,
  onExit
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [discreetMode, setDiscreetMode] = useState(false);
  const [beacon, setBeacon] = useState<LiveSosBeacon | null>(null);
  const [isLoadingBeacon, setIsLoadingBeacon] = useState(true);
  const [beaconError, setBeaconError] = useState("");
  const [currentCoords, setCurrentCoords] = useState({ latitude: 0, longitude: 0, accuracyMeters: 0 });
  const [currentAreaName, setCurrentAreaName] = useState("Location unavailable");
  const [locationDetails, setLocationDetails] = useState<SouthAfricanLocationDetails>(() =>
    inferSouthAfricanLocationSync(0, 0, 0, "CACHE")
  );
  const [isLocationCardOpen, setIsLocationCardOpen] = useState(false);
  const [pendingDeviceLocation, setPendingDeviceLocation] = useState<SouthAfricanLocationDetails | null>(null);
  const [isComparingLocation, setIsComparingLocation] = useState(false);
  const [isPersistingLocation, setIsPersistingLocation] = useState(false);
  const [showLocationRefreshPrompt, setShowLocationRefreshPrompt] = useState(false);
  const { toasts, showToast, removeToast } = useHttpToasts();

  const responderToken = useMemo(() => {
    const urlToken = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("track") || new URLSearchParams(window.location.search).get("token")
      : null;
    return urlToken || beaconToken || undefined;
  }, [beaconToken]);

  useEffect(() => {
    let active = true;
    setIsLoadingBeacon(true);
    loadActiveSosBeacon(responderToken)
      .then(async (record) => {
        if (!active) return;
        setBeacon(record);
        if (record?.latitude != null && record.longitude != null) {
          const accuracy = record.accuracy || 0;
          setCurrentCoords({ latitude: record.latitude, longitude: record.longitude, accuracyMeters: accuracy });
          setCurrentAreaName(record.areaName);
          setLocationDetails(inferSouthAfricanLocationSync(record.latitude, record.longitude, accuracy, "BEACON_TELEMETRY"));
        }

        // A responder link is deliberately read-only. Only the survivor's owner
        // session may compare device GPS and update its own persisted beacon.
        if (!responderToken && record?.latitude != null && record.longitude != null) {
          setIsComparingLocation(true);
          try {
            const deviceLocation = await readDeviceLocationWithDetails({ timeoutMs: 10000, highAccuracy: true });
            if (!active || deviceLocation.source === "CACHE") return;
            const distance = haversineDistanceMeters(
              { latitude: record.latitude, longitude: record.longitude },
              { latitude: deviceLocation.latitude, longitude: deviceLocation.longitude },
            );
            if (distance >= 500) {
              setPendingDeviceLocation(deviceLocation);
              setShowLocationRefreshPrompt(true);
            }
          } catch {
            // Permission denial or unavailable GPS must not block emergency actions.
          } finally {
            if (active) setIsComparingLocation(false);
          }
        }
      })
      .catch((error) => active && setBeaconError(error instanceof Error ? error.message : "Unable to verify beacon."))
      .finally(() => active && setIsLoadingBeacon(false));
    return () => { active = false; };
  }, [responderToken]);

  const handleRefreshPersistedLocation = async () => {
    if (!beacon || !pendingDeviceLocation || responderToken || isPersistingLocation) return;
    setIsLocationCardOpen(true);
    document.getElementById("guardian-beacon-location")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsPersistingLocation(true);
    try {
      const updated = await persistBeaconLocation(beacon.id, {
        latitude: pendingDeviceLocation.latitude,
        longitude: pendingDeviceLocation.longitude,
        accuracy: pendingDeviceLocation.accuracy,
        areaName: pendingDeviceLocation.formattedDisplay,
      });
      setBeacon(updated);
      setCurrentCoords({
        latitude: updated.latitude!,
        longitude: updated.longitude!,
        accuracyMeters: updated.accuracy || 0,
      });
      setCurrentAreaName(updated.areaName);
      setLocationDetails(pendingDeviceLocation);
      setPendingDeviceLocation(null);
      setShowLocationRefreshPrompt(false);
      showToast("success", "Coordinates refreshed", "Current survivor coordinates were saved successfully.", 200);
    } catch (error) {
      showToast(
        "failed",
        "Coordinate refresh failed",
        error instanceof Error ? error.message : "The current coordinates could not be saved.",
      );
    } finally {
      setIsPersistingLocation(false);
    }
  };

  // Dynamically calculate nearest TCC facility by distance based on active coordinates
  const nearestTcc = useMemo(() => {
    const sortedCentres = sortCentresByDistance(
      THUTHUZELA_CENTERS,
      currentCoords.latitude,
      currentCoords.longitude
    );
    return sortedCentres[0] || THUTHUZELA_CENTERS[0];
  }, [currentCoords.latitude, currentCoords.longitude]);

  const hasUsableLocation = beacon?.latitude != null && beacon.longitude != null;
  const googleMapsUrl = hasUsableLocation ? `https://maps.google.com/?q=${currentCoords.latitude},${currentCoords.longitude}` : null;

  const handleAcknowledge = () => {
    if (!beacon) return;
    setAcknowledged(true);
    const ackPayload = { token: beacon.id, timestamp: Date.now() };

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("pcalc_beacon_ack", JSON.stringify(ackPayload));
      } catch {
        /* storage write fallback */
      }
    }

    if (typeof window !== "undefined") {
      try {
        if ("BroadcastChannel" in window) {
          const channel = new BroadcastChannel("pcalc_emergency_channel");
          channel.postMessage({ type: "BEACON_ACKNOWLEDGED", token: beacon.id, timestamp: Date.now() });
          channel.close();
        }
      } catch {
        /* BroadcastChannel fallback */
      }

      try {
        window.dispatchEvent(
          new CustomEvent("pcalc_beacon_acknowledged", { detail: { token: beacon.id } })
        );
      } catch {
        /* custom event fallback */
      }
    }
  };

  if (discreetMode) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-300 p-6 max-w-md mx-auto flex flex-col justify-between select-none">
        <div className="text-center pt-8">
          <p className="text-sm font-mono text-slate-400">Navigation Assistant Active</p>
          <p className="text-xs text-slate-500 mt-2">Display dimmed for privacy in public transit.</p>
        </div>
        <button
          onClick={() => setDiscreetMode(false)}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs"
        >
          Restore Guardian Rescue Console
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto select-none border-x border-slate-800">
      <HttpToastNotification toasts={toasts} onDismiss={removeToast} />
      {/* Tactical Header */}
      <header className="bg-slate-900 border-b border-rose-900/40 p-4 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${beacon ? "bg-rose-500/20 border-rose-500/50 animate-pulse" : "bg-slate-800 border-slate-700"}`}>
            <Radio className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>GUARDIAN CONSOLE</span>
              <span className={`${beacon ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-slate-800 text-slate-400 border-slate-700"} text-[9px] font-bold px-1.5 py-0.2 rounded border`}>
                {isLoadingBeacon ? "CHECKING" : beacon ? "LIVE" : "INACTIVE"}
              </span>
            </h1>
            <span className="text-[10px] text-slate-400 block font-mono">
              {beacon ? "Verified 72-Hr Ephemeral Responder Link" : "No verified responder link"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDiscreetMode(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 text-xs"
            title="Dim screen"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Tracking Content */}
      <main className="p-4 flex-1 space-y-4 overflow-y-auto">
        {showLocationRefreshPrompt && pendingDeviceLocation && (
          <section className="rounded-2xl border border-amber-500/50 bg-amber-950/30 p-4" role="alert">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="flex-1">
                <h2 className="text-sm font-bold text-white">Current location differs from the saved beacon</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  The current device location is at least 500 metres from the last saved coordinates. Refresh before relying on navigation.
                </p>
                <button
                  type="button"
                  onClick={handleRefreshPersistedLocation}
                  disabled={isPersistingLocation}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${isPersistingLocation ? "animate-spin" : ""}`} />
                  {isPersistingLocation ? "Saving current coordinates…" : "Refresh saved coordinates"}
                </button>
                {isPersistingLocation && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Saving current coordinates">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-amber-400" />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
        {/* Urgent Distress Banner */}
        <div className={`rounded-2xl p-4 border shadow-2xl relative overflow-hidden ${beacon ? "bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border-rose-500/40" : "bg-slate-900 border-slate-800"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] uppercase font-mono font-bold tracking-widest flex items-center gap-1.5 ${beacon ? "text-rose-400" : "text-slate-400"}`}>
              <span className={`w-2 h-2 rounded-full ${beacon ? "bg-rose-500 animate-ping" : "bg-slate-600"}`} />
              {isLoadingBeacon ? "VERIFYING EMERGENCY BEACON" : beacon ? "EMERGENCY SOS BEACON ACTIVE" : "NO ACTIVE EMERGENCY BEACON"}
            </span>
            {beacon && <span className="text-[10px] font-mono text-slate-400">Ref: {beacon.id}</span>}
          </div>

          <h2 className="text-base font-bold text-white mb-1">
            {beacon ? "Immediate Physical Safety Threat Reported" : "Guardian monitoring is standing by"}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {beaconError || (beacon
              ? "A verified survivor has triggered an emergency lifeline and shared live telemetry with this authenticated guardian console."
              : "No persisted, active and unexpired SOS beacon could be verified. Live status and responder links remain disabled.")}
          </p>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">TRIGGERED</span>
                <span className="font-semibold text-white">{beacon ? formatBeaconRelativeTime(beacon.dispatchedAt || beacon.createdAt) || "Time unavailable" : "Not triggered"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">PHONE BATTERY</span>
                <span className="font-semibold text-emerald-400">{beacon?.batteryPercentage != null ? `${beacon.batteryPercentage}%` : "Unavailable"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Location & Navigation */}
        <div id="guardian-beacon-location" className="scroll-mt-20 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-between text-left"
            aria-expanded={isLocationCardOpen}
            disabled={isPersistingLocation}
            onClick={() => setIsLocationCardOpen((open) => !open)}
          >
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Verified beacon location
              {isComparingLocation && <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-400" aria-label="Checking current location" />}
            </span>
            {isLocationCardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {isLocationCardOpen && <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Persisted survivor beacon coordinates
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Accuracy: ±{currentCoords.accuracyMeters}m
            </span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-white mb-0.5">{currentAreaName}</div>
                <div className="text-xs font-mono text-slate-400">
                  {currentCoords.latitude.toFixed(4)}, {currentCoords.longitude.toFixed(4)}
                </div>
              </div>
              <span
                className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700"
              >
                Beacon fix
              </span>
            </div>

            {/* Structured Administrative Hierarchy Breakdown: District, Region, City, Town */}
            <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold tracking-wider">
                  District
                </span>
                <span
                  className="text-white font-semibold text-xs block leading-tight mt-0.5 truncate"
                  data-testid="location-district"
                  title={locationDetails.district}
                >
                  {locationDetails.district}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold tracking-wider">
                  Region
                </span>
                <span
                  className="text-white font-semibold text-xs block leading-tight mt-0.5 truncate"
                  data-testid="location-region"
                  title={locationDetails.region}
                >
                  {locationDetails.region}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold tracking-wider">
                  City
                </span>
                <span
                  className="text-white font-semibold text-xs block leading-tight mt-0.5 truncate"
                  data-testid="location-city"
                  title={locationDetails.city}
                >
                  {locationDetails.city}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold tracking-wider">
                  Town / Suburb
                </span>
                <span
                  className="text-white font-semibold text-xs block leading-tight mt-0.5 truncate"
                  data-testid="location-town"
                  title={`${locationDetails.town}${locationDetails.suburb && locationDetails.suburb !== locationDetails.town ? ` (${locationDetails.suburb})` : ""}`}
                >
                  {locationDetails.town}{locationDetails.suburb && locationDetails.suburb !== locationDetails.town ? ` (${locationDetails.suburb})` : ""}
                </span>
              </div>
            </div>
          </div>

          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 text-xs"
            >
              <Navigation className="w-4 h-4" />
              <span>Open in Google Maps / Live Route</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          </>}
        </div>

        {/* Emergency First-Responder Direct Actions */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Emergency Dispatch Actions
          </span>

          {/* SAPS Emergency Dial */}
          <a
            href="tel:10111"
            className="w-full bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between shadow-lg shadow-rose-900/40 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4" />
              <span>Call SAPS Emergency Flying Squad (10111)</span>
            </div>
            <span className="text-[10px] bg-rose-700 px-2 py-0.5 rounded font-mono">Direct</span>
          </a>

          {/* Nearest Thuthuzela Care Centre is only claimed after a real location is available. */}
          {hasUsableLocation ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div className="pr-2">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">
                  Nearest Care Facility ({nearestTcc.province})
                </span>
                <h4 className="text-xs font-bold text-white">{nearestTcc.name}</h4>
                <p className="text-[10px] text-slate-400">
                  {nearestTcc.hospitalOrLocation}
                  {nearestTcc.distanceKm !== undefined && (
                    <span> • {nearestTcc.distanceKm.toFixed(1)} km away</span>
                  )}
                </p>
              </div>
              <a
                href={`tel:${nearestTcc.contactNumber}`}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold p-2.5 rounded-lg flex items-center justify-center shrink-0"
                title="Call Care Centre"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Care facility lookup pending</span>
              <p className="text-xs text-slate-300 mt-1">
                Nearest care facility is an estimate until live coordinates are shared. Refresh device location to resolve it safely.
              </p>
            </div>
          )}
        </div>

        {/* Responder Acknowledgment */}
        <div className="pt-2">
          {acknowledged ? (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-3 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Response Acknowledged: En Route to Survivor</span>
            </div>
          ) : (
            <button
              onClick={handleAcknowledge}
              disabled={!beacon}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Acknowledge Distress: I Am Responding</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-900 text-center text-[10px] text-slate-500">
        Umkhuseli Safe Haven • Verified Guardian Protocol • Active links expire after 72 hours
      </footer>
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-5 right-5 z-50 rounded-full border border-slate-700 bg-slate-900 p-3 text-white shadow-xl"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
    </div>
  );
};
