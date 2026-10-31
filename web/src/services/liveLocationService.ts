/**
 * Live Geo-Location Service
 * 
 * Provides real-time live GPS reading, tracking, caching, and reverse-inference
 * for South African metropolitan areas, provinces, and emergency coordinates.
 * Strictly avoids simulated/hardcoded coordinates in favor of authentic live device telemetry.
 */

export interface LiveLocation {
  lat: number;
  lng: number;
  accuracy: number;
  areaName: string;
  metro: string;
  province: string;
  timestamp: number;
}

const STORAGE_KEY_GPS = "umkhuseli_last_known_gps";

/**
 * Reverse-infers South African municipal area, primary metro, and province from live GPS coordinates.
 */
export function inferAreaAndProvince(
  lat: number,
  lng: number
): { areaName: string; metro: string; province: string } {
  // Western Cape (Cape Town & surrounds)
  if (lat <= -33.5 && lat >= -34.5 && lng >= 18.2 && lng <= 19.2) {
    return {
      areaName: "City of Cape Town / Western Cape Metro",
      metro: "Cape Town",
      province: "Western Cape",
    };
  }
  if (lat < -30.5 && lng < 24.2 && lat > -35.0 && lng > 17.5) {
    return {
      areaName: "Western Cape Municipal Safety Zone",
      metro: "Cape Town",
      province: "Western Cape",
    };
  }

  // KwaZulu-Natal (eThekwini / Durban Coastal)
  if (lat <= -29.6 && lat >= -30.2 && lng >= 30.6 && lng <= 31.3) {
    return {
      areaName: "eThekwini Metro / Durban Coastal",
      metro: "Durban/eThekwini",
      province: "KwaZulu-Natal",
    };
  }
  if (lat <= -26.8 && lat >= -31.2 && lng >= 28.8 && lng <= 33.0) {
    return {
      areaName: "KwaZulu-Natal Safety Zone",
      metro: "Durban/eThekwini",
      province: "KwaZulu-Natal",
    };
  }

  // Gauteng - City of Tshwane / Pretoria
  if (lat <= -25.4 && lat >= -25.9 && lng >= 28.0 && lng <= 28.5) {
    return {
      areaName: "City of Tshwane / Pretoria",
      metro: "Pretoria/Tshwane",
      province: "Gauteng",
    };
  }

  // Gauteng - Ekurhuleni / East Rand
  if (lat <= -25.9 && lat >= -26.4 && lng >= 28.2 && lng <= 28.6) {
    return {
      areaName: "Ekurhuleni Metro / East Rand",
      metro: "Ekurhuleni",
      province: "Gauteng",
    };
  }

  // Gauteng - City of Johannesburg / Central & Soweto
  if (lat <= -26.0 && lat >= -26.45 && lng >= 27.8 && lng <= 28.2) {
    return {
      areaName: "City of Johannesburg / Gauteng Central",
      metro: "Johannesburg",
      province: "Gauteng",
    };
  }
  if (lat <= -25.3 && lat >= -26.9 && lng >= 27.2 && lng <= 29.0) {
    return {
      areaName: "Gauteng Provincial Safety Zone",
      metro: "Johannesburg",
      province: "Gauteng",
    };
  }

  // Eastern Cape - Nelson Mandela Bay / Gqeberha
  if (lat <= -33.7 && lat >= -34.1 && lng >= 25.4 && lng <= 25.8) {
    return {
      areaName: "Nelson Mandela Bay / Gqeberha",
      metro: "Gqeberha",
      province: "Eastern Cape",
    };
  }
  if (lat <= -30.0 && lat >= -34.3 && lng >= 22.8 && lng <= 30.2) {
    return {
      areaName: "Eastern Cape Municipal Safety Zone",
      metro: "Gqeberha",
      province: "Eastern Cape",
    };
  }

  // Free State - Welkom / Goldfields / Lejweleputswa
  if (lat <= -27.8 && lat >= -28.2 && lng >= 26.5 && lng <= 27.0) {
    return {
      areaName: "Flamingo Park, Welkom / Free State Goldfields",
      metro: "Welkom",
      province: "Free State",
    };
  }

    // Free State - Mangaung / Bloemfontein
  if (lat <= -28.9 && lat >= -29.4 && lng >= 26.0 && lng <= 26.4) {
    return {
      areaName: "Mangaung Metro / Bloemfontein",
      metro: "Bloemfontein",
      province: "Free State",
    };
  }
  if (lat <= -26.6 && lat >= -30.7 && lng >= 24.3 && lng <= 29.8) {
    return {
      areaName: "Free State Safety Zone",
      metro: "Bloemfontein",
      province: "Free State",
    };
  }

  // Limpopo - Polokwane & surrounds
  if (lat <= -22.1 && lat >= -25.3 && lng >= 26.4 && lng <= 31.9) {
    return {
      areaName: "Limpopo Provincial Safety Zone",
      metro: "Johannesburg",
      province: "Limpopo",
    };
  }

  // Mpumalanga - Mbombela & surrounds
  if (lat <= -24.0 && lat >= -27.5 && lng >= 28.3 && lng <= 32.0) {
    return {
      areaName: "Mpumalanga Provincial Safety Zone",
      metro: "Johannesburg",
      province: "Mpumalanga",
    };
  }

  // North West - Klerksdorp / Rustenburg
  if (lat <= -24.6 && lat >= -28.1 && lng >= 22.6 && lng <= 28.3) {
    return {
      areaName: "North West Provincial Safety Zone",
      metro: "Johannesburg",
      province: "North West",
    };
  }

  // Northern Cape - Kimberley / Upington
  if (lat <= -24.8 && lat >= -32.9 && lng >= 16.4 && lng <= 25.5) {
    return {
      areaName: "Northern Cape Provincial Safety Zone",
      metro: "Bloemfontein",
      province: "Northern Cape",
    };
  }

  // Generic South African Territory
  return {
    areaName: "South Africa Municipal Safety Zone",
    metro: "Johannesburg",
    province: "Gauteng",
  };
}

/**
 * Retrieves the user's last recorded live GPS location from local storage cache.
 * Returns null if no live GPS fix was ever recorded.
 */
export function getCachedLiveLocation(): LiveLocation | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GPS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat === "number" && typeof parsed.lng === "number" && !isNaN(parsed.lat)) {
      return parsed;
    }
  } catch (e) {
    console.warn("Could not read cached live location:", e);
  }
  return null;
}

/**
 * Saves an authentic live GPS fix to local storage and syncs across beacon caches.
 */
export function saveLiveLocation(lat: number, lng: number, accuracy: number): LiveLocation {
  const meta = inferAreaAndProvince(lat, lng);
  const liveLocation: LiveLocation = {
    lat,
    lng,
    accuracy: Math.round(accuracy || 15),
    areaName: meta.areaName,
    metro: meta.metro,
    province: meta.province,
    timestamp: Date.now(),
  };

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY_GPS, JSON.stringify(liveLocation));
      // Cross-sync with last beacon telemetry cache
      const existingBeaconRaw = localStorage.getItem("pcalc_last_beacon");
      const existingBeacon = existingBeaconRaw ? JSON.parse(existingBeaconRaw) : {};
      localStorage.setItem(
        "pcalc_last_beacon",
        JSON.stringify({
          ...existingBeacon,
          latitude: lat,
          longitude: lng,
          accuracyMeters: Math.round(accuracy || 15),
          areaName: meta.areaName,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn("Could not save live location:", e);
    }
  }

  return liveLocation;
}

/**
 * Reads the user's live geo-location from the device's GPS hardware via navigator.geolocation.
 */
export async function getLiveLocation(options?: {
  timeoutMs?: number;
  highAccuracy?: boolean;
}): Promise<LiveLocation> {
  const timeoutMs = options?.timeoutMs ?? 10000;
  const highAccuracy = options?.highAccuracy ?? true;

  if (typeof navigator === "undefined" || !navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== "function") {
    const cached = getCachedLiveLocation();
    if (cached) return cached;
    throw new Error("Device does not support GPS hardware geolocation.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const liveLoc = saveLiveLocation(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy
        );
        resolve(liveLoc);
      },
      (err) => {
        const cached = getCachedLiveLocation();
        if (cached) {
          resolve(cached);
        } else {
          reject(err);
        }
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: 5000,
      }
    );
  });
}

/**
 * Continuous live GPS watcher. Streams real location updates as the user moves.
 */
export function watchLiveLocation(
  onSuccess: (loc: LiveLocation) => void,
  onError?: (err: GeolocationPositionError) => void
): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    const cached = getCachedLiveLocation();
    if (cached) onSuccess(cached);
    return () => {};
  }

  if (typeof navigator.geolocation.watchPosition !== "function") {
    if (typeof navigator.geolocation.getCurrentPosition === "function") {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const liveLoc = saveLiveLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy
          );
          onSuccess(liveLoc);
        },
        (err) => {
          if (onError) onError(err);
          const cached = getCachedLiveLocation();
          if (cached) onSuccess(cached);
        }
      );
    }
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const liveLoc = saveLiveLocation(
        pos.coords.latitude,
        pos.coords.longitude,
        pos.coords.accuracy
      );
      onSuccess(liveLoc);
    },
    (err) => {
      if (onError) onError(err);
      const cached = getCachedLiveLocation();
      if (cached) onSuccess(cached);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 12000,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
