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
  RefreshCw,
} from "lucide-react";
import { THUTHUZELA_CENTERS, sortCentresByDistance } from "../data/saSafetyData";
import { getCachedLiveLocation } from "../services/liveLocationService";
import {
  readDeviceLocationWithDetails,
  inferSouthAfricanLocationSync,
  SouthAfricanLocationDetails
} from "../services/deviceLocationResolver";

interface Props {
  beaconToken?: string;
  onExit?: () => void;
}


export function formatTriggeredTime(dispatchedAtIso: string): string {
  try {
    const diffMs = Date.now() - new Date(dispatchedAtIso).getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMinutes === 0) return "Just now (< 1 min ago)";
    if (diffMinutes === 1) return "1 minute ago";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } catch {
    return "Recent";
  }
}

export const GuardianTrackerView: React.FC<Props> = ({
  beaconToken = "demo-ephemeral-beacon-72h",
  onExit
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [discreetMode, setDiscreetMode] = useState(false);
  const [isReadingLocation, setIsReadingLocation] = useState(false);
  const [isLiveDeviceGps, setIsLiveDeviceGps] = useState(false);

  // Read live beacon parameters on load from URL query params or localStorage
  const initialBeacon = useMemo(() => {
    let lat: number | undefined;
    let lng: number | undefined;
    let acc: number | undefined;
    let bat: number | undefined;
    let tokenVal = beaconToken;
    let dispatchedAt = new Date(Date.now() - 4 * 60 * 1000).toISOString();
    let areaName = "Johannesburg Central / Gauteng";
    let isCharging = false;
    let hasExplicitBeaconCoordinates = false;

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlLat = searchParams.get("lat");
      const urlLng = searchParams.get("lng");
      const urlAcc = searchParams.get("acc");
      const urlBat = searchParams.get("bat");
      const urlToken = searchParams.get("token") || searchParams.get("track");

      if (urlLat && urlLng) {
        lat = parseFloat(urlLat);
        lng = parseFloat(urlLng);
        hasExplicitBeaconCoordinates = true;
      }
      if (urlAcc) acc = parseFloat(urlAcc);
      if (urlBat) bat = parseInt(urlBat, 10);
      if (urlToken) tokenVal = urlToken;

      // Fallback to localStorage.getItem("pcalc_last_beacon")
      if (lat === undefined || lng === undefined) {
        try {
          const raw = localStorage.getItem("pcalc_last_beacon");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.latitude !== undefined && parsed.longitude !== undefined) {
              lat = parsed.latitude;
              lng = parsed.longitude;
              hasExplicitBeaconCoordinates = true;
            }
            if (parsed.accuracyMeters !== undefined) acc = parsed.accuracyMeters;
            else if (parsed.accuracy !== undefined) acc = parsed.accuracy;
            if (parsed.batteryPercentage !== undefined) bat = parsed.batteryPercentage;
            if (parsed.token || parsed.id) tokenVal = parsed.token || parsed.id;
            if (parsed.dispatchedAt) dispatchedAt = parsed.dispatchedAt;
            if (parsed.areaName) areaName = parsed.areaName;
            if (parsed.isCharging !== undefined) isCharging = parsed.isCharging;
          }
        } catch {
          /* ignore json parse errors */
        }
      }
    }

    // Prioritize: 1) explicit beacon/URL coords, 2) live cached device GPS, 3) survivor profile address/area
    const cachedLiveGps = getCachedLiveLocation();
    let profileAreaCoords: { latitude: number; longitude: number; areaName: string; province: string } | null = null;
    try {
      const uatProf = getUatProfile();
      if (uatProf?.personal?.address) {
        profileAreaCoords = resolveCoordinatesFromAddressOrProfile(uatProf.personal.address);
      }
    } catch {
      /* ignore */
    }

    let resolvedLat = -26.2041;
    let resolvedLng = 28.0473;
    let resolvedArea = "Johannesburg Central / Gauteng";

    if (cachedLiveGps) {
      resolvedLat = cachedLiveGps.lat;
      resolvedLng = cachedLiveGps.lng;
      resolvedArea = cachedLiveGps.areaName || resolvedArea;
    } else if (profileAreaCoords) {
      resolvedLat = profileAreaCoords.latitude;
      resolvedLng = profileAreaCoords.longitude;
      resolvedArea = profileAreaCoords.areaName;
    }

    const finalLat = lat !== undefined && !isNaN(lat) ? lat : resolvedLat;
    const finalLng = lng !== undefined && !isNaN(lng) ? lng : resolvedLng;
    const finalAcc = acc !== undefined && !isNaN(acc) ? acc : (cachedLiveGps?.accuracy ?? 14);
    const finalBat = bat !== undefined && !isNaN(bat) ? bat : 78;
    const finalArea = hasExplicitBeaconCoordinates && areaName ? areaName : (cachedLiveGps?.areaName || (profileAreaCoords ? profileAreaCoords.areaName : areaName));

    return {
      id: tokenVal,
      dispatchedAt,
      latitude: finalLat,
      longitude: finalLng,
      accuracyMeters: finalAcc,
      areaName: finalArea,
      batteryPercentage: finalBat,
      isCharging,
      hasExplicitBeaconCoordinates
    };
  }, [beaconToken]);

  // Active coordinates & telemetry
  const [currentCoords, setCurrentCoords] = useState({
    latitude: initialBeacon.latitude,
    longitude: initialBeacon.longitude,
    accuracyMeters: initialBeacon.accuracyMeters,
  });

  const [currentAreaName, setCurrentAreaName] = useState(initialBeacon.areaName);

  // Resolved structured South African location (District, Region, City, Town)
  const [locationDetails, setLocationDetails] = useState<SouthAfricanLocationDetails>(() =>
    inferSouthAfricanLocationSync(
      initialBeacon.latitude,
      initialBeacon.longitude,
      initialBeacon.accuracyMeters,
      initialBeacon.hasExplicitBeaconCoordinates ? "BEACON_TELEMETRY" : "CACHE"
    )
  );

  // Synchronize state if initialBeacon changes
  useEffect(() => {
    setCurrentCoords({
      latitude: initialBeacon.latitude,
      longitude: initialBeacon.longitude,
      accuracyMeters: initialBeacon.accuracyMeters,
    });
    setCurrentAreaName(initialBeacon.areaName);
    setLocationDetails(
      inferSouthAfricanLocationSync(
        initialBeacon.latitude,
        initialBeacon.longitude,
        initialBeacon.accuracyMeters,
        initialBeacon.hasExplicitBeaconCoordinates ? "BEACON_TELEMETRY" : "CACHE"
      )
    );
  }, [initialBeacon]);

  // Read actual device location on mount if no explicit fixed beacon was supplied
  useEffect(() => {
    let isMounted = true;

    if (!initialBeacon.hasExplicitBeaconCoordinates && typeof navigator !== "undefined" && navigator.geolocation) {
      setIsReadingLocation(true);
      readDeviceLocationWithDetails({ timeoutMs: 8000, highAccuracy: true })
        .then((details) => {
          if (isMounted) {
            setCurrentCoords({
              latitude: details.latitude,
              longitude: details.longitude,
              accuracyMeters: details.accuracy
            });
            setLocationDetails(details);
            setIsLiveDeviceGps(true);
            if (details.town) {
              setCurrentAreaName(`${details.town} / ${details.province}`);
            }
          }
        })
        .catch(() => {
          // Graceful silent fallback to default coordinates
        })
        .finally(() => {
          if (isMounted) setIsReadingLocation(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [initialBeacon.hasExplicitBeaconCoordinates]);

  // Manual GPS refresh handler
  const handleRefreshLocation = async () => {
    setIsReadingLocation(true);
    try {
      const details = await readDeviceLocationWithDetails({ timeoutMs: 10000, highAccuracy: true });
      setCurrentCoords({
        latitude: details.latitude,
        longitude: details.longitude,
        accuracyMeters: details.accuracy
      });
      setLocationDetails(details);
      setIsLiveDeviceGps(true);
      if (details.town) {
        setCurrentAreaName(`${details.town} / ${details.province}`);
      }
    } catch (err) {
      console.warn("Manual GPS location refresh failed:", err);
    } finally {
      setIsReadingLocation(false);
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

  const googleMapsUrl = `https://maps.google.com/?q=${currentCoords.latitude},${currentCoords.longitude}`;

  const handleAcknowledge = () => {
    setAcknowledged(true);
    const ackPayload = { token: initialBeacon.id, timestamp: Date.now() };

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
          channel.postMessage({ type: "BEACON_ACKNOWLEDGED", token: initialBeacon.id, timestamp: Date.now() });
          channel.close();
        }
      } catch {
        /* BroadcastChannel fallback */
      }

      try {
        window.dispatchEvent(
          new CustomEvent("pcalc_beacon_acknowledged", { detail: { token: initialBeacon.id } })
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
      {/* Tactical Header */}
      <header className="bg-slate-900 border-b border-rose-900/40 p-4 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center animate-pulse">
            <Radio className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>GUARDIAN CONSOLE</span>
              <span className="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.2 rounded border border-rose-500/30">
                LIVE
              </span>
            </h1>
            <span className="text-[10px] text-slate-400 block font-mono">
              72-Hr Ephemeral Responder Link
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
        {/* Urgent Distress Banner */}
        <div className="bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 rounded-2xl p-4 border border-rose-500/40 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              EMERGENCY SOS BEACON ACTIVE
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Ref: {initialBeacon.id.substring(0, 8)}
            </span>
          </div>

          <h2 className="text-base font-bold text-white mb-1">
            Immediate Physical Safety Threat Reported
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            A verified survivor has triggered an emergency lifeline and shared their live telemetry with you as an authorized emergency guardian.
          </p>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">TRIGGERED</span>
                <span className="font-semibold text-white">4 minutes ago</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">PHONE BATTERY</span>
                <span className="font-semibold text-emerald-400">{initialBeacon.batteryPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Location & Navigation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {isLiveDeviceGps ? "Live Device Coordinates" : "Last Known Coordinates"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-mono">
                Accuracy: ±{currentCoords.accuracyMeters}m
              </span>
              <button
                type="button"
                onClick={handleRefreshLocation}
                disabled={isReadingLocation}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                title="Refresh device location"
                aria-label="Refresh device location"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReadingLocation ? "animate-spin text-sky-400" : ""}`} />
              </button>
            </div>
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
                className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                  isLiveDeviceGps
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {isLiveDeviceGps ? "Live GPS" : "Beacon Fix"}
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

          {/* Nearest Thuthuzela Care Centre */}
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
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Acknowledge Distress: I Am Responding</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-900 text-center text-[10px] text-slate-500">
        Umkhuseli Safe Haven • Zero-Install Ephemeral Guardian Protocol • Auto-expires in 72 hours
      </footer>
    </div>
  );
};
