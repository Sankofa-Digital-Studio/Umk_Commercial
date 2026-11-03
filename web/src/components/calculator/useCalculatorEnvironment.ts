import { useState, useEffect } from "react";
import {
  getInitialTheme,
  ThemeMode,
  THEME_CHANGE_EVENT,
} from "../../services/themeManager";
import {
  fetchLiveLoadshedding,
  LoadsheddingInfo,
} from "../../services/loadsheddingService";
import {
  getDeviceTelemetry,
  DeviceTelemetry,
} from "../../services/deviceTelemetry";
import {
  getUatProfile,
  UatProfile,
} from "../../services/uatProfileService";
import {
  getCachedLiveLocation,
  getLiveLocation,
  LiveLocation,
} from "../../services/liveLocationService";

export function useCalculatorEnvironment() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const [uatProfile, setUatProfileState] = useState<UatProfile>(getUatProfile);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(getCachedLiveLocation);
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "ready" | "unavailable">(
    getCachedLiveLocation() ? "ready" : "idle"
  );

  const [loadshedding, setLoadshedding] = useState<LoadsheddingInfo>({
    stage: 0,
    statusText: "Grid Normal · Loadshedding Suspended",
    source: "loadshedding.eskom.co.za",
    officialUrl: "https://loadshedding.eskom.co.za/",
    area: "National Grid / Metro Supply",
    nextSlot: "No Outages Scheduled",
    duration: "0h 00min",
    isOutageActive: false,
    timestamp: new Date().toISOString(),
  });

  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    connectionType: "Connected",
    batteryLevel: null,
    isCharging: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") setScrollDirection(window.scrollY > 280 ? "up" : "down");
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBoundary = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({
      top: scrollDirection === "down" ? document.documentElement.scrollHeight : 0,
      behavior: "smooth",
    });
  };

  const refreshLiveLocation = async () => {
    setLocationStatus("locating");
    try {
      const location = await getLiveLocation({ timeoutMs: 8000, highAccuracy: false });
      setLiveLocation(location);
      setLocationStatus("ready");
      return location;
    } catch {
      const cached = getCachedLiveLocation();
      if (cached) {
        setLiveLocation(cached);
        setLocationStatus("ready");
        return cached;
      }
      setLocationStatus("unavailable");
      return null;
    }
  };

  useEffect(() => {
    const handleTheme = (e: Event) => {
      const ce = e as CustomEvent<ThemeMode>;
      if (ce.detail) setTheme(ce.detail);
    };
    window.addEventListener(THEME_CHANGE_EVENT, handleTheme);

    const updateTelemetry = () => {
      getDeviceTelemetry().then(setTelemetry).catch(() => {});
    };
    updateTelemetry();
    refreshLiveLocation();

    fetchLiveLoadshedding().then(setLoadshedding).catch(() => {});
    const loadsheddingInterval = setInterval(() => {
      fetchLiveLoadshedding().then(setLoadshedding).catch(() => {});
    }, 60_000);

    const tick = setInterval(() => setCurrentTime(new Date()), 30_000);
    window.addEventListener("online", updateTelemetry);
    window.addEventListener("offline", updateTelemetry);

    const handleUatUpdate = () => setUatProfileState(getUatProfile());
    window.addEventListener("pcalc_uat_profile_updated", handleUatUpdate);
    window.addEventListener("umkhuseli_uat_profile_updated", handleUatUpdate);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleTheme);
      window.removeEventListener("pcalc_uat_profile_updated", handleUatUpdate);
      window.removeEventListener("umkhuseli_uat_profile_updated", handleUatUpdate);
      clearInterval(tick);
      clearInterval(loadsheddingInterval);
      window.removeEventListener("online", updateTelemetry);
      window.removeEventListener("offline", updateTelemetry);
    };
  }, []);

  return {
    currentTime,
    theme,
    scrollDirection,
    scrollToBoundary,
    loadshedding,
    telemetry,
    uatProfile,
    liveLocation,
    locationStatus,
    refreshLiveLocation,
  };
}
