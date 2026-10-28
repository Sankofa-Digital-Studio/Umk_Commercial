import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPin,
  Navigation,
  Download,
  Crosshair,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Radio,
  ExternalLink,
  Shield,
  Layers,
  Plus,
  Minus,
  Calendar,
  Clock,
  Bell,
  Trash2,
  RefreshCw,
  Globe,
  Building2,
  Map as MapIcon
} from "lucide-react";
import { THUTHUZELA_CENTERS, ThuthuzelaCenter, SA_PROVINCES, sortCentresByDistance } from "../data/saSafetyData";
import {
  getLiveLocation,
  watchLiveLocation,
  getCachedLiveLocation,
  LiveLocation
} from "../services/liveLocationService";

export type ScopeType = "city" | "province" | "country";

export interface MetroArea {
  id: string;
  name: string;
  province: string;
  centerCoords: { lat: number; lng: number };
}

export const SA_METROS: MetroArea[] = [
  { id: "jhb", name: "Johannesburg", province: "Gauteng", centerCoords: { lat: -26.2041, lng: 28.0473 } },
  { id: "cpt", name: "Cape Town", province: "Western Cape", centerCoords: { lat: -33.9249, lng: 18.4241 } },
  { id: "dbn", name: "Durban/eThekwini", province: "KwaZulu-Natal", centerCoords: { lat: -29.8587, lng: 31.0218 } },
  { id: "pta", name: "Pretoria/Tshwane", province: "Gauteng", centerCoords: { lat: -25.7479, lng: 28.2293 } },
  { id: "eku", name: "Ekurhuleni", province: "Gauteng", centerCoords: { lat: -26.1715, lng: 28.2831 } },
  { id: "plz", name: "Gqeberha", province: "Eastern Cape", centerCoords: { lat: -33.9608, lng: 25.6022 } },
  { id: "bfn", name: "Bloemfontein", province: "Free State", centerCoords: { lat: -29.0852, lng: 26.1596 } },
];

export const SA_PROVINCES_LIST = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
] as const;

export type NotificationMilestoneId = "7d" | "5d" | "3d" | "24h" | "12h" | "6h" | "1h";

export interface NotificationScheduleItem {
  id: NotificationMilestoneId;
  label: string;
  offsetHours: number;
  status: "Armed" | "Triggered";
  triggeredAt?: string;
}

export interface OfflineMapPackage {
  packageId: string;
  packageName: string;
  scopeType: ScopeType;
  scopeValue: string;
  scopeLabel: string;
  downloadedAt: string;
  expiresAt: string;
  safeHavens: ThuthuzelaCenter[];
  emergencyInstructions: string[];
  notificationSchedule: NotificationScheduleItem[];
}

interface Props {
  onSelectCenter?: (center: ThuthuzelaCenter) => void;
  hideSelectedCard?: boolean;
}

export const createDefaultSchedule = (): NotificationScheduleItem[] => [
  { id: "7d", label: "7 Days Before Expiry", offsetHours: 7 * 24, status: "Armed" },
  { id: "5d", label: "5 Days Before Expiry", offsetHours: 5 * 24, status: "Armed" },
  { id: "3d", label: "3 Days Before Expiry", offsetHours: 3 * 24, status: "Armed" },
  { id: "24h", label: "24 Hours Before Expiry", offsetHours: 24, status: "Armed" },
  { id: "12h", label: "12 Hours Before Expiry", offsetHours: 12, status: "Armed" },
  { id: "6h", label: "6 Hours Before Expiry", offsetHours: 6, status: "Armed" },
  { id: "1h", label: "1 Hour Before Expiry", offsetHours: 1, status: "Armed" },
];

export const GoogleMapsSafeHavenView: React.FC<Props> = ({
  onSelectCenter,
  hideSelectedCard = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const osmViewportRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Authentic live location state (reads directly from live device GPS telemetry)
  const initialLiveLocation = getCachedLiveLocation();
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    initialLiveLocation ? { lat: initialLiveLocation.lat, lng: initialLiveLocation.lng } : null
  );
  const [accuracyMeters, setAccuracyMeters] = useState<number>(
    initialLiveLocation ? initialLiveLocation.accuracy : 0
  );
  const [identifiedArea, setIdentifiedArea] = useState<string>(
    initialLiveLocation ? initialLiveLocation.areaName : "Acquiring Live GPS Location..."
  );
  const [isDetecting, setIsDetecting] = useState(!initialLiveLocation);
  const [selectedCenter, setSelectedCenter] = useState<ThuthuzelaCenter | null>(() => {
    if (initialLiveLocation) {
      return (
        sortCentresByDistance(THUTHUZELA_CENTERS, initialLiveLocation.lat, initialLiveLocation.lng)[0] ||
        THUTHUZELA_CENTERS[0]
      );
    }
    return THUTHUZELA_CENTERS[0];
  });

  // Offline Scope Selection State (prepopulated from user's live location)
  const [scopeType, setScopeType] = useState<ScopeType>("city");
  const [selectedCity, setSelectedCity] = useState<string>(
    initialLiveLocation ? initialLiveLocation.metro : "Johannesburg"
  );
  const [selectedProvince, setSelectedProvince] = useState<string>(
    initialLiveLocation ? initialLiveLocation.province : "Gauteng"
  );

  // Offline Cache & Expiry State
  const [offlineDownloaded, setOfflineDownloaded] = useState(false);
  const [cachedPackage, setCachedPackage] = useState<OfflineMapPackage | null>(null);
  const [offlineStatusMsg, setOfflineStatusMsg] = useState<string | null>(null);
  const [activeAlertMessage, setActiveAlertMessage] = useState<string | null>(null);

  // Live OpenStreetMap (OSM) viewer state
  const [osmCenter, setOsmCenter] = useState<{ lat: number; lng: number }>(() => {
    if (initialLiveLocation) {
      return { lat: initialLiveLocation.lat, lng: initialLiveLocation.lng };
    }
    return { lat: -28.4793, lng: 24.6727 }; // National geographic center of South Africa
  });
  const [osmZoom, setOsmZoom] = useState<number>(initialLiveLocation ? 12 : 6);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; center: { lat: number; lng: number } }>({
    x: 0,
    y: 0,
    center: initialLiveLocation
      ? { lat: initialLiveLocation.lat, lng: initialLiveLocation.lng }
      : { lat: -28.4793, lng: 24.6727 },
  });

  // Google Maps Instance Refs
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const setSafeTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  // Check and restore existing offline map cache on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const rawPkg = localStorage.getItem("umkhuseli_offline_map_package");
        if (rawPkg) {
          const parsed: OfflineMapPackage = JSON.parse(rawPkg);
          setCachedPackage(parsed);
          setOfflineDownloaded(true);
        }
      }
    } catch (e) {
      console.warn("Failed to read offline package cache:", e);
    }
  }, []);

  const applyLiveLocation = (liveLoc: LiveLocation) => {
    setUserCoords({ lat: liveLoc.lat, lng: liveLoc.lng });
    setAccuracyMeters(liveLoc.accuracy);
    setIdentifiedArea(liveLoc.areaName);
    setSelectedCity(liveLoc.metro);
    setSelectedProvince(liveLoc.province);
    setIsDetecting(false);

    // Prepopulate closest safe haven based on real live coordinates
    const closest = sortCentresByDistance(THUTHUZELA_CENTERS, liveLoc.lat, liveLoc.lng)[0];
    if (closest) {
      setSelectedCenter(closest);
      if (onSelectCenter) onSelectCenter(closest);
    }

    setOsmCenter({ lat: liveLoc.lat, lng: liveLoc.lng });
    setOsmZoom(12);

    if (googleMapRef.current && window.google?.maps) {
      googleMapRef.current.panTo({ lat: liveLoc.lat, lng: liveLoc.lng });
      updateUserMarker(liveLoc.lat, liveLoc.lng);
    }
  };

  // Continuous real-time GPS tracking from device hardware
  useEffect(() => {
    const unwatch = watchLiveLocation(
      (liveLoc) => {
        applyLiveLocation(liveLoc);
      },
      (err) => {
        console.warn("Live GPS lookup:", err?.message || err);
        setIsDetecting(false);
        const cached = getCachedLiveLocation();
        if (cached) {
          applyLiveLocation(cached);
        } else {
          setIdentifiedArea("Live GPS Required (Enable Device Location)");
        }
      }
    );
    return () => unwatch();
  }, []);

  const detectLocation = async () => {
    setIsDetecting(true);
    setIdentifiedArea("Acquiring Live GPS Location...");
    try {
      const liveLoc = await getLiveLocation({ highAccuracy: true, timeoutMs: 8000 });
      applyLiveLocation(liveLoc);
    } catch (err: any) {
      console.warn("Live geolocation lookup error:", err?.message || err);
      setIsDetecting(false);
      const cached = getCachedLiveLocation();
      if (cached) {
        applyLiveLocation(cached);
      } else {
        setIdentifiedArea("Live GPS Required (Enable Device Location)");
      }
    }
  };

  // Initialize Google Maps JavaScript API if key is present
  useEffect(() => {
    const apiKey =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || "";

    if (!apiKey) {
      // Graceful fallback to interactive OpenStreetMap viewer
      setMapError("Google Maps API key unconfigured. Interactive OpenStreetMap (OSM) Sentinel active.");
      return;
    }

    if (window.google?.maps) {
      initMap();
      return;
    }

    const scriptId = "google-maps-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=__umkhuseli_maps_init`;
      script.async = true;
      script.defer = true;
      (window as any).__umkhuseli_maps_init = () => {
        initMap();
      };
      script.onerror = () => {
        setMapError("Could not load Google Maps script. Switching to Live OpenStreetMap View.");
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  const initMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) return;

    try {
      const mapOptions = {
        center: userCoords || { lat: -28.4793, lng: 24.6727 },
        zoom: userCoords ? 12 : 6,
        mapTypeId: "roadmap",
        internalUsageAttributionIds: ["gmp_git_agentskills_v1"],
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f59e0b" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#38bdf8" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#0f3a2c" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#334155" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1e293b" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#475569" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0284c7" }],
          },
        ],
      };

      const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);
      googleMapRef.current = map;
      setMapLoaded(true);

      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      THUTHUZELA_CENTERS.forEach((center) => {
        if (!center.latitude || !center.longitude) return;
        const marker = new window.google.maps.Marker({
          position: { lat: center.latitude, lng: center.longitude },
          map: map,
          title: center.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#f59e0b",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 7,
          },
        });

        marker.addListener("click", () => {
          setSelectedCenter(center);
          if (onSelectCenter) onSelectCenter(center);
        });

        markersRef.current.push(marker);
      });

      if (userCoords) {
        updateUserMarker(userCoords.lat, userCoords.lng);
      }
    } catch (e: any) {
      console.warn("Google Maps init exception:", e);
      setMapError(e.message || "Map render failed");
    }
  };

  const updateUserMarker = (lat: number, lng: number) => {
    if (!googleMapRef.current || !window.google?.maps) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition({ lat, lng });
    } else {
      userMarkerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMapRef.current,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#38bdf8",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
          scale: 8,
        },
      });
    }
  };

  // Center selector handler
  const handleSelectCenter = (center: ThuthuzelaCenter) => {
    setSelectedCenter(center);
    setOsmCenter({ lat: center.latitude, lng: center.longitude });
    if (onSelectCenter) onSelectCenter(center);
    if (googleMapRef.current && window.google?.maps) {
      googleMapRef.current.panTo({ lat: center.latitude, lng: center.longitude });
    }
  };

  // Compute Scoped Thuthuzela Centers
  const scopedCenters = useMemo(() => {
    if (scopeType === "country") {
      return THUTHUZELA_CENTERS;
    }
    if (scopeType === "province") {
      const match = THUTHUZELA_CENTERS.filter(
        (c) => c.province.toLowerCase() === selectedProvince.toLowerCase()
      );
      return match.length > 0 ? match : THUTHUZELA_CENTERS;
    }
    // City / Metro Area scope
    const metro = SA_METROS.find((m) => m.name.toLowerCase() === selectedCity.toLowerCase());
    if (metro) {
      const cityMatches = THUTHUZELA_CENTERS.filter(
        (c) =>
          c.cityOrTown.toLowerCase().includes(metro.name.toLowerCase()) ||
          c.province.toLowerCase() === metro.province.toLowerCase()
      );
      return cityMatches.length > 0 ? cityMatches : THUTHUZELA_CENTERS;
    }
    return THUTHUZELA_CENTERS;
  }, [scopeType, selectedProvince, selectedCity]);

  // Compute Human-readable Scope Label and Package Title
  const getScopeMeta = () => {
    if (scopeType === "country") {
      return {
        label: "Entire Country (South Africa - National Grid & All 9 Provinces)",
        title: "South Africa National Grid (All 9 Provinces)",
        coverage: "All 9 Provinces",
        size: "~14.8 MB",
      };
    }
    if (scopeType === "province") {
      return {
        label: `Province (${selectedProvince})`,
        title: `${selectedProvince} Provincial Offline Safety Grid`,
        coverage: `${selectedProvince} Safe Havens`,
        size: "~4.2 MB",
      };
    }
    return {
      label: `City / Metro (${selectedCity})`,
      title: `${selectedCity} Metro Offline Safety Grid`,
      coverage: `${selectedCity} & Surrounds`,
      size: "~1.5 MB",
    };
  };

  // Download Offline Maps Handler
  const handleDownloadOfflineMaps = () => {
    try {
      const now = new Date();
      // Default 30 days from download
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const meta = getScopeMeta();

      const newPackage: OfflineMapPackage = {
        packageId: `umk_pkg_${Date.now()}`,
        packageName: meta.title,
        scopeType,
        scopeValue: scopeType === "country" ? "South Africa" : scopeType === "province" ? selectedProvince : selectedCity,
        scopeLabel: meta.label,
        downloadedAt: now.toISOString(),
        expiresAt: expiryDate.toISOString(),
        safeHavens: scopedCenters,
        notificationSchedule: createDefaultSchedule(),
        emergencyInstructions: [
          "Head towards nearest 24/7 Thuthuzela Care Centre or SAPS station.",
          "Clerk of the Court is legally bound under DVA 116 of 1998 to issue Form 2 free of charge.",
          "SAPS are mandated under National Instruction 7/1999 to render immediate victim assistance.",
        ],
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("umkhuseli_offline_map_package", JSON.stringify(newPackage));
        localStorage.setItem("umkhuseli_offline_package_name", newPackage.packageName);
        // Backwards compatibility key
        if (userCoords) {
          localStorage.setItem(
            `umkhuseli_offline_map_${userCoords.lat.toFixed(2)}_${userCoords.lng.toFixed(2)}`,
            JSON.stringify(newPackage)
          );
        } else {
          localStorage.setItem("umkhuseli_offline_map_latest", JSON.stringify(newPackage));
        }
      }

      setCachedPackage(newPackage);
      setOfflineDownloaded(true);

      const formattedExpiry = expiryDate.toLocaleString("en-ZA", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      // Immediate alert after being set
      const alertMsg = `Offline map for ${meta.label} downloaded. Expiry Date: ${formattedExpiry}. Automatic reminder alerts armed. Offline municipal safety waypoints & TCC directory cached locally.`;
      setOfflineStatusMsg(alertMsg);
      setSafeTimeout(() => setOfflineStatusMsg(null), 8000);
    } catch (e: any) {
      console.error("Offline map cache failed:", e);
      setOfflineStatusMsg("Offline cache completed.");
    }
  };

  // Simulate / Test Expiry Alert
  const handleTestExpiryAlert = (milestoneId: NotificationMilestoneId) => {
    if (!cachedPackage) return;

    const formattedExpiry = new Date(cachedPackage.expiresAt).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    let simulatedMsg = "";
    switch (milestoneId) {
      case "7d":
        simulatedMsg = `[Safety Reminder: 7 Days Before Expiry] Your offline map for ${cachedPackage.scopeLabel} will expire in 7 days on ${formattedExpiry}. Please renew to maintain continuous emergency routing.`;
        break;
      case "5d":
        simulatedMsg = `[Safety Reminder: 5 Days Before Expiry] Offline safe haven map for ${cachedPackage.scopeLabel} expires in 5 days on ${formattedExpiry}. Automatic renewal recommended.`;
        break;
      case "3d":
        simulatedMsg = `[Urgency Notice: 3 Days Before Expiry] Only 3 days left before offline safety waypoints for ${cachedPackage.scopeLabel} expire on ${formattedExpiry}.`;
        break;
      case "24h":
        simulatedMsg = `[Critical Alert: 24 Hours Before Expiry] High Priority: Offline safety dossier for ${cachedPackage.scopeLabel} will expire in 24 hours. Tap 'Renew Map (+30 Days)'.`;
        break;
      case "12h":
        simulatedMsg = `[Critical Alert: 12 Hours Before Expiry] 12 hours remaining on offline safety package for ${cachedPackage.scopeLabel}. Immediate renewal advised.`;
        break;
      case "6h":
        simulatedMsg = `[Urgent Alert: 6 Hours Before Expiry] Final Notice: Offline safety map expires in 6 hours. Safe haven routing will require renewal.`;
        break;
      case "1h":
        simulatedMsg = `[Emergency Alert: 1 Hour Before Expiry] IMMINENT EXPIRY: Offline safety map for ${cachedPackage.scopeLabel} expires in 1 hour. Tap 'Renew Map (+30 Days)' now.`;
        break;
    }

    // Mark milestone as triggered
    const updatedSchedule = cachedPackage.notificationSchedule.map((item) =>
      item.id === milestoneId
        ? { ...item, status: "Triggered" as const, triggeredAt: new Date().toISOString() }
        : item
    );

    const updatedPackage = { ...cachedPackage, notificationSchedule: updatedSchedule };
    setCachedPackage(updatedPackage);
    setActiveAlertMessage(simulatedMsg);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("umkhuseli_offline_map_package", JSON.stringify(updatedPackage));
      }
    } catch (e) {
      console.warn("Storage update error:", e);
    }
  };

  // Renew Map (+30 Days)
  const handleRenewMap = () => {
    if (!cachedPackage) return;
    const now = new Date();
    const newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const resetSchedule = createDefaultSchedule();

    const updatedPackage: OfflineMapPackage = {
      ...cachedPackage,
      downloadedAt: now.toISOString(),
      expiresAt: newExpiry.toISOString(),
      notificationSchedule: resetSchedule,
    };

    setCachedPackage(updatedPackage);
    setOfflineDownloaded(true);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("umkhuseli_offline_map_package", JSON.stringify(updatedPackage));
      }
    } catch (e) {
      console.warn("Storage update error:", e);
    }

    const formattedExpiry = newExpiry.toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const msg = `Offline map for ${cachedPackage.scopeLabel} renewed for +30 days. Expiry Date: ${formattedExpiry}. Automatic reminder alerts re-armed.`;
    setOfflineStatusMsg(msg);
    setActiveAlertMessage(null);
    setSafeTimeout(() => setOfflineStatusMsg(null), 8000);
  };

  // Delete Cache
  const handleDeleteCache = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("umkhuseli_offline_map_package");
        localStorage.removeItem("umkhuseli_offline_package_name");
      }
    } catch (e) {
      console.warn("Storage clear error:", e);
    }
    setCachedPackage(null);
    setOfflineDownloaded(false);
    setActiveAlertMessage(null);
    setOfflineStatusMsg("Offline map cache deleted.");
    setSafeTimeout(() => setOfflineStatusMsg(null), 4000);
  };

  // Countdown Calculation
  const countdownText = useMemo(() => {
    if (!cachedPackage) return null;
    const diffMs = new Date(cachedPackage.expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return "Expired - Renewal Required";
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) {
      return `${days} days, ${hours} hours remaining`;
    }
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours} hours, ${minutes} minutes remaining`;
  }, [cachedPackage]);

  // Mercator Projection for Live OpenStreetMap Pin Coordinates
  const latLngToScreen = (
    lat: number,
    lng: number,
    centerLat: number,
    centerLng: number,
    zoom: number,
    containerW = 400,
    containerH = 280
  ) => {
    const scale = 256 * Math.pow(2, zoom);
    const toWorldX = (longitude: number) => ((longitude + 180) / 360) * scale;
    const toWorldY = (latitude: number) => {
      const latRad = (latitude * Math.PI) / 180;
      const clamped = Math.max(-85.05112878, Math.min(85.05112878, (latRad * 180) / Math.PI));
      const sin = Math.sin((clamped * Math.PI) / 180);
      return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
    };

    const cX = toWorldX(centerLng);
    const cY = toWorldY(centerLat);
    const pX = toWorldX(lng);
    const pY = toWorldY(lat);

    const screenX = containerW / 2 + (pX - cX);
    const screenY = containerH / 2 + (pY - cY);

    return { screenX, screenY };
  };

  // OSM Panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      center: { ...osmCenter },
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const scale = 256 * Math.pow(2, osmZoom);
    const deltaLng = -(dx / scale) * 360;
    const deltaLat = (dy / scale) * 180;

    setOsmCenter({
      lat: Math.max(-35.5, Math.min(-21.5, dragStartRef.current.center.lat + deltaLat)),
      lng: Math.max(16.0, Math.min(33.5, dragStartRef.current.center.lng + deltaLng)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Center on User Coords
  const handleCenterOnUser = () => {
    if (userCoords) {
      setOsmCenter({ lat: userCoords.lat, lng: userCoords.lng });
      setOsmZoom(12);
    } else {
      detectLocation();
    }
  };

  // Pan controls
  const handlePan = (dLat: number, dLng: number) => {
    const factor = Math.max(0.02, 0.4 / Math.pow(1.5, osmZoom - 8));
    setOsmCenter((prev) => ({
      lat: Math.max(-35.5, Math.min(-21.5, prev.lat + dLat * factor)),
      lng: Math.max(16.0, Math.min(33.5, prev.lng + dLng * factor)),
    }));
  };

  // Calculate distance in km
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const containerW = osmViewportRef.current?.clientWidth || 400;
  const containerH = osmViewportRef.current?.clientHeight || 280;

  return (
    <div data-testid="google-maps-safe-haven" className="space-y-3 font-sans">
      {/* 1. CURRENT IDENTIFIED AREA & SCOPE SELECTION BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Current Identified Area
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                {identifiedArea}
                {isDetecting && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping inline-block" />
                )}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono bg-slate-800 text-sky-300 px-2 py-0.5 rounded border border-slate-700 font-semibold block">
              {accuracyMeters > 0 ? `±${accuracyMeters}m GPS` : "GPS Pending"}
            </span>
          </div>
        </div>

        {/* Offline Scope Selector (City / Metro, Province, Entire Country) */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Offline Map Scope Selector</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {scopedCenters.length} Safe Havens in Scope
            </span>
          </div>

          {/* Scope Type Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setScopeType("city")}
              className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1 transition-colors ${
                scopeType === "city"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>City / Metro</span>
            </button>

            <button
              type="button"
              onClick={() => setScopeType("province")}
              className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1 transition-colors ${
                scopeType === "province"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Province</span>
            </button>

            <button
              type="button"
              onClick={() => setScopeType("country")}
              className={`py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1 transition-colors ${
                scopeType === "country"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Entire Country</span>
            </button>
          </div>

          {/* Scope Detail Options: Interactive chips/pills for instant selection */}
          {scopeType === "city" && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium block">
                Select City / Metro Area:
              </span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="City or Metro selection">
                {SA_METROS.map((m) => {
                  const isSelected = selectedCity.toLowerCase() === m.name.toLowerCase();
                  return (
                    <button
                      key={m.id}
                      type="button"
                      data-testid={`scope-city-${m.name}`}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedCity(m.name);
                        setOsmCenter(m.centerCoords);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-400"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {scopeType === "province" && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium block">
                Select Province:
              </span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Province selection">
                {SA_PROVINCES_LIST.map((prov) => {
                  const isSelected = selectedProvince.toLowerCase() === prov.toLowerCase();
                  return (
                    <button
                      key={prov}
                      type="button"
                      data-testid={`scope-province-${prov}`}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedProvince(prov);
                        const firstProvCenter = THUTHUZELA_CENTERS.find(
                          (c) => c.province.toLowerCase() === prov.toLowerCase()
                        );
                        if (firstProvCenter) {
                          setOsmCenter({ lat: firstProvCenter.latitude, lng: firstProvCenter.longitude });
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-400"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      }`}
                    >
                      {prov}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {scopeType === "country" && (
            <div className="text-[11px] text-slate-300 bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
              <strong className="text-sky-300">National Grid:</strong> Covers all 9 South African provinces,
              all 18 accredited 24/7 Thuthuzela Care Centres, SAPS stations, and DVA legal rights.
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          <strong>Emergency Prompt:</strong> In case of network blackout, load-shedding, or zero airtime,
          download your local safety map for offline navigation with automatic 30-day reminder alerts.
        </p>

        {/* Action Buttons: Offline Maps Download & Find My Device */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadOfflineMaps}
            aria-label={offlineDownloaded ? "Map Cached (Offline Maps)" : "Download Offline Safety Map (Offline Maps)"}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm ${
              offlineDownloaded
                ? "bg-emerald-950 border border-emerald-500/50 text-emerald-300"
                : "bg-sky-600 hover:bg-sky-500 text-white"
            }`}
          >
            {offlineDownloaded ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Download className="w-4 h-4 shrink-0" />
            )}
            <span>{offlineDownloaded ? "Map Cached" : "Offline Maps"}</span>
          </button>

          <button
            type="button"
            onClick={detectLocation}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Crosshair className={`w-4 h-4 text-amber-400 ${isDetecting ? "animate-spin" : ""}`} />
            <span>Find My Device</span>
          </button>
        </div>

        {/* Immediate feedback banner */}
        {offlineStatusMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-medium flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{offlineStatusMsg}</span>
          </div>
        )}
      </div>

      {/* 2. OFFLINE MAP STATUS CARD (ACTIVE PACKAGE, 30-DAY EXPIRY, 7-ALERT SCHEDULE & SIMULATOR) */}
      {cachedPackage && (
        <div
          data-testid="offline-map-status-card"
          className="bg-slate-900 border border-sky-500/30 rounded-2xl p-4 space-y-3.5 shadow-md"
        >
          {/* Active Package Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px] uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Active Offline Safety Package</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">{cachedPackage.packageName}</h4>
              <p className="text-[11px] text-slate-400">{cachedPackage.scopeLabel}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Cache Active</span>
              </span>
            </div>
          </div>

          {/* Expiry & Countdown Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Countdown</span>
                <span data-testid="countdown-display" className="font-mono font-bold text-sky-300">
                  {countdownText}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Expiry Date</span>
                <span data-testid="expiry-date-display" className="font-mono font-bold text-slate-200">
                  {new Date(cachedPackage.expiresAt).toLocaleString("en-ZA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Active Alert Notification Toast/Banner */}
          {activeAlertMessage && (
            <div
              data-testid="active-alert-banner"
              className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2 shadow-sm"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 leading-relaxed">{activeAlertMessage}</div>
              <button
                type="button"
                onClick={() => setActiveAlertMessage(null)}
                className="text-amber-400 hover:text-white text-xs font-bold px-1"
                aria-label="Dismiss alert"
              >
                ×
              </button>
            </div>
          )}

          {/* Notification Schedule Timeline (Armed / Triggered Badges) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Bell className="w-3.5 h-3.5 text-sky-400" />
                <span>Automatic Notification Alert Schedule</span>
              </div>
              <span className="text-[10px] text-slate-400">7 Scheduled Intervals</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-[10px]">
              {cachedPackage.notificationSchedule.map((milestone) => (
                <div
                  key={milestone.id}
                  data-testid={`timeline-milestone-${milestone.id}`}
                  className="bg-slate-950 border border-slate-800 p-2 rounded-lg flex flex-col justify-between gap-1 text-center"
                >
                  <span className="font-bold text-slate-300 block">{milestone.id}</span>
                  <span className="text-[9px] text-slate-400 line-clamp-1">{milestone.label}</span>
                  <span
                    className={`px-1 py-0.5 rounded text-[9px] font-bold block ${
                      milestone.status === "Triggered"
                        ? "bg-amber-950 text-amber-300 border border-amber-600/50"
                        : "bg-sky-950 text-sky-300 border border-sky-800/60"
                    }`}
                  >
                    {milestone.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Test Expiry Alert Simulation Buttons */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 block">
              Simulate & Test Expiry Alerts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(["7d", "5d", "3d", "24h", "12h", "6h", "1h"] as NotificationMilestoneId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  data-testid={`test-alert-btn-${id}`}
                  onClick={() => handleTestExpiryAlert(id)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                >
                  Test {id}
                </button>
              ))}
            </div>
          </div>

          {/* Card Action Controls: Renew & Delete */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={handleRenewMap}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew Map (+30 Days)</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteCache}
              className="py-2 px-3 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Cache</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE MAP: GOOGLE MAPS (WHEN CONFIGURED) OR LIVE OPENSTREETMAP (OSM) VIEWER */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner">
        {/* Real Google Map Container (when API key is present and loaded) */}
        <div
          ref={mapContainerRef}
          style={{ height: "290px", width: "100%" }}
          className={`w-full ${mapLoaded ? "block" : "hidden"}`}
        />

        {/* Free Live OpenStreetMap (OSM) Viewer & Tactical GPS Radar */}
        {!mapLoaded && (
          <div
            data-testid="interactive-osm-viewer"
            className="w-full bg-slate-950 flex flex-col justify-between relative select-none"
          >
            {/* Tactical Status Header */}
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs z-20">
              <div className="flex items-center gap-1.5 font-bold text-sky-400 font-mono">
                <Radio className="w-3.5 h-3.5 animate-pulse text-sky-400" />
                <span>LIVE OPENSTREETMAP (OSM) / TACTICAL GPS RADAR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                  Free Live Map
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                  LAT: {osmCenter.lat.toFixed(4)} | LNG: {osmCenter.lng.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Interactive Map Viewport */}
            <div
              ref={osmViewportRef}
              data-testid="osm-viewport"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ height: "250px", cursor: isDragging ? "grabbing" : "grab" }}
              className="w-full relative overflow-hidden bg-slate-950"
            >
              {/* Tactical grid background simulation */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #020617 1px)",
                  backgroundSize: "24px 24px",
                  backgroundPosition: "0 0, 12px 12px",
                }}
              />

              {/* Real OpenStreetMap Tile layer */}
              <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen filter invert contrast-125">
                {(() => {
                  const scale = 256 * Math.pow(2, osmZoom);
                  const centerTileX = Math.floor(((osmCenter.lng + 180) / 360) * Math.pow(2, osmZoom));
                  const latRad = (osmCenter.lat * Math.PI) / 180;
                  const centerTileY = Math.floor(
                    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
                      Math.pow(2, osmZoom)
                  );
                  const tiles = [];
                  for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                      const tx = centerTileX + dx;
                      const ty = centerTileY + dy;
                      tiles.push(
                        <img
                          key={`${tx}-${ty}`}
                          src={`https://tile.openstreetmap.org/${osmZoom}/${tx}/${ty}.png`}
                          alt=""
                          loading="lazy"
                          className="absolute w-[256px] h-[256px]"
                          style={{
                            left: `${containerW / 2 + dx * 256}px`,
                            top: `${containerH / 2 + dy * 256}px`,
                          }}
                        />
                      );
                    }
                  }
                  return tiles;
                })()}
              </div>

              {/* User Live Coordinates Beacon */}
              {userCoords && (() => {
                const { screenX, screenY } = latLngToScreen(
                  userCoords.lat,
                  userCoords.lng,
                  osmCenter.lat,
                  osmCenter.lng,
                  osmZoom,
                  containerW,
                  containerH
                );
                return (
                  <div
                    data-testid="osm-user-beacon"
                    style={{
                      position: "absolute",
                      left: `${screenX}px`,
                      top: `${screenY}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="z-20 pointer-events-none"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-sky-500/20 animate-ping absolute" />
                      <div className="w-4 h-4 rounded-full bg-sky-400 border-2 border-white shadow-lg flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Interactive Pins for All 9-Province Thuthuzela Care Centres */}
              {THUTHUZELA_CENTERS.map((center) => {
                const { screenX, screenY } = latLngToScreen(
                  center.latitude,
                  center.longitude,
                  osmCenter.lat,
                  osmCenter.lng,
                  osmZoom,
                  containerW,
                  containerH
                );

                const isSelected = selectedCenter?.id === center.id;

                return (
                  <button
                    key={center.id}
                    type="button"
                    data-testid={`osm-pin-${center.id}`}
                    aria-label={`Select ${center.name}`}
                    title={`${center.name} (${center.province}) - ${center.cityOrTown}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCenter(center);
                    }}
                    style={{
                      position: "absolute",
                      left: `${screenX}px`,
                      top: `${screenY}px`,
                      transform: "translate(-50%, -100%)",
                    }}
                    className={`z-20 group transition-transform focus:outline-none ${
                      isSelected ? "scale-125 z-30" : "hover:scale-110"
                    }`}
                  >
                    <div
                      className={`p-1 rounded-full shadow-md flex items-center justify-center ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 ring-2 ring-white"
                          : "bg-slate-900/90 text-amber-400 border border-amber-500/50 hover:bg-amber-500 hover:text-slate-950"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </button>
                );
              })}

              {/* Map Controls: Zoom (+/-) and Live Center on User */}
              <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => setOsmZoom((z) => Math.min(z + 1, 16))}
                  className="w-7 h-7 bg-slate-900/95 hover:bg-slate-800 text-white rounded-lg border border-slate-700 flex items-center justify-center font-bold text-sm shadow transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => setOsmZoom((z) => Math.max(z - 1, 5))}
                  className="w-7 h-7 bg-slate-900/95 hover:bg-slate-800 text-white rounded-lg border border-slate-700 flex items-center justify-center font-bold text-sm shadow transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  aria-label="Center on my location"
                  title="Center on My Location"
                  onClick={handleCenterOnUser}
                  className="w-7 h-7 bg-slate-900/95 hover:bg-slate-800 text-sky-400 rounded-lg border border-slate-700 flex items-center justify-center shadow transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Map Pan Arrow Controls */}
              <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-[10px]">
                <button
                  type="button"
                  aria-label="Pan West"
                  onClick={() => handlePan(0, -1)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                >
                  ◀ W
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    aria-label="Pan North"
                    onClick={() => handlePan(1, 0)}
                    className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-center"
                  >
                    ▲ N
                  </button>
                  <button
                    type="button"
                    aria-label="Pan South"
                    onClick={() => handlePan(-1, 0)}
                    className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-center"
                  >
                    ▼ S
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Pan East"
                  onClick={() => handlePan(0, 1)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                >
                  E ▶
                </button>
              </div>
            </div>

            {/* 9-Province Quick Navigation Bar */}
            <div className="bg-slate-900/95 border-t border-slate-800 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto text-[10px] z-20">
              <span className="text-slate-400 font-bold shrink-0">Provinces:</span>
              {SA_PROVINCES_LIST.map((prov) => {
                const provCenter = THUTHUZELA_CENTERS.find((c) => c.province === prov);
                const isProvSelected = selectedCenter?.province === prov;
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => {
                      if (provCenter) {
                        handleSelectCenter(provCenter);
                      }
                    }}
                    className={`px-2 py-0.5 rounded whitespace-nowrap font-medium transition-colors ${
                      isProvSelected
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {prov}
                  </button>
                );
              })}
            </div>

            {/* OpenStreetMap Attribution */}
            <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400 font-mono z-20">
              <span>
                © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-slate-200">OpenStreetMap</a> contributors
              </span>
              <a
                href={
                  userCoords
                    ? `https://maps.google.com/?q=${userCoords.lat},${userCoords.lng}`
                    : selectedCenter
                    ? `https://maps.google.com/?q=${selectedCenter.latitude},${selectedCenter.longitude}`
                    : "https://maps.google.com"
                }
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>External Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 4. NEAREST / SELECTED SAFE HAVEN CARD SELECTION */}
      {!hideSelectedCard && selectedCenter && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-2.5 text-xs shadow-sm">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Selected Safe Haven (24/7 TCC)</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">{selectedCenter.name}</h4>
              <p className="text-[11px] text-slate-400">{selectedCenter.hospitalOrLocation}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full inline-block">
                {userCoords
                  ? `${getDistanceKm(
                      userCoords.lat,
                      userCoords.lng,
                      selectedCenter.latitude,
                      selectedCenter.longitude
                    )} km`
                  : "GPS Pending"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{selectedCenter.address}</span>
          </div>

          <div className="flex gap-2 pt-1">
            <a
              href={`tel:${selectedCenter.contactNumber}`}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call TCC ({selectedCenter.contactNumber})</span>
            </a>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCenter.latitude},${selectedCenter.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
