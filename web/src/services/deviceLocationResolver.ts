/**
 * South African Device Location Resolver & Reverse-Geocoding Engine
 * 
 * Reads real-time device GPS telemetry and accurately infers or reverse-geocodes:
 * - District Municipality / Metropolitan Municipality
 * - Region / Provincial Sub-District
 * - City
 * - Town / Suburb / Township
 * - Province
 * 
 * Features an offline-ready high-precision South African geospatial centroid database
 * paired with asynchronous online OpenStreetMap (Nominatim) enrichment.
 */

export interface SouthAfricanLocationDetails {
  latitude: number;
  longitude: number;
  accuracy: number;
  district: string;
  region: string;
  city: string;
  town: string;
  suburb?: string;
  province: string;
  formattedDisplay: string;
  source: "GPS_DEVICE" | "BEACON_TELEMETRY" | "CACHE" | "NOMINATIM";
  timestamp: number;
}

export interface SouthAfricanGeoSettlement {
  town: string;
  city: string;
  district: string;
  region: string;
  province: string;
  lat: number;
  lng: number;
  suburb?: string;
}

/**
 * Dense South African Municipal, District, City & Town Geospatial Grid
 */
export const SA_SETTLEMENTS_DATABASE: SouthAfricanGeoSettlement[] = [
  // ── GAUTENG: CITY OF JOHANNESBURG METRO ──
  {
    town: "Johannesburg Central",
    city: "Johannesburg",
    district: "City of Johannesburg Metropolitan Municipality",
    region: "Gauteng Central (Region F)",
    province: "Gauteng",
    suburb: "CBD / Marshalltown",
    lat: -26.2041,
    lng: 28.0473,
  },
  {
    town: "Auckland Park",
    city: "Johannesburg",
    district: "City of Johannesburg Metropolitan Municipality",
    region: "Gauteng Central (Region B)",
    province: "Gauteng",
    suburb: "Westdene / Melville",
    lat: -26.1839,
    lng: 27.9998,
  },
  {
    town: "Soweto / Diepkloof",
    city: "Johannesburg",
    district: "City of Johannesburg Metropolitan Municipality",
    region: "Gauteng Central (Region D - Soweto)",
    province: "Gauteng",
    suburb: "Diepkloof Zone 6",
    lat: -26.2606,
    lng: 27.9429,
  },
  {
    town: "Soweto / Orlando",
    city: "Johannesburg",
    district: "City of Johannesburg Metropolitan Municipality",
    region: "Gauteng Central (Region D - Soweto)",
    province: "Gauteng",
    suburb: "Orlando West / Vilakazi",
    lat: -26.2361,
    lng: 27.9133,
  },
  {
    town: "Sandton",
    city: "Johannesburg",
    district: "City of Johannesburg Metropolitan Municipality",
    region: "Gauteng North (Region E - Sandton)",
    province: "Gauteng",
    suburb: "Sandton Central / Bryanston",
    lat: -26.1076,
    lng: 28.0567,
  },
  {
    town: "Randburg",
    city: "Johannesburg",
    district: "City of Johannesburg Metropolitan Municipality",
    region: "Gauteng North-West (Region B - Randburg)",
    province: "Gauteng",
    suburb: "Ferndale / Cresta",
    lat: -26.0936,
    lng: 27.9899,
  },
  {
    town: "Roodepoort",
    city: "Johannesburg",
    district: "City of Johannesburg Metropolitan Municipality",
    region: "Gauteng West (Region C - Roodepoort)",
    province: "Gauteng",
    suburb: "Florida / Constantia Kloof",
    lat: -26.1557,
    lng: 27.8728,
  },
  {
    town: "Midrand",
    city: "Johannesburg",
    district: "City of Johannesburg Metropolitan Municipality",
    region: "Gauteng North (Region A - Midrand)",
    province: "Gauteng",
    suburb: "Waterfall / Halfway House",
    lat: -25.9992,
    lng: 28.1263,
  },
  {
    town: "Lenasia",
    city: "Johannesburg",
    district: "City of Johannesburg Metropolitan Municipality",
    region: "Gauteng South (Region G - Lenasia)",
    province: "Gauteng",
    suburb: "Lenasia South",
    lat: -26.3186,
    lng: 27.8386,
  },

  // ── GAUTENG: CITY OF TSHWANE METRO (PRETORIA) ──
  {
    town: "Pretoria Central",
    city: "Pretoria",
    district: "City of Tshwane Metropolitan Municipality",
    region: "Pretoria Central (Region 3)",
    province: "Gauteng",
    suburb: "CBD / Arcadia",
    lat: -25.7479,
    lng: 28.2293,
  },
  {
    town: "Centurion",
    city: "Pretoria",
    district: "City of Tshwane Metropolitan Municipality",
    region: "Tshwane South (Region 4)",
    province: "Gauteng",
    suburb: "Lyttelton / Irene",
    lat: -25.8603,
    lng: 28.1895,
  },
  {
    town: "Atteridgeville",
    city: "Pretoria",
    district: "City of Tshwane Metropolitan Municipality",
    region: "Tshwane West (Region 3)",
    province: "Gauteng",
    suburb: "Kalafong / Saulsville",
    lat: -25.7667,
    lng: 28.0906,
  },
  {
    town: "Mamelodi",
    city: "Pretoria",
    district: "City of Tshwane Metropolitan Municipality",
    region: "Tshwane East (Region 6)",
    province: "Gauteng",
    suburb: "Mamelodi West",
    lat: -25.7145,
    lng: 28.3618,
  },
  {
    town: "Soshanguve",
    city: "Pretoria",
    district: "City of Tshwane Metropolitan Municipality",
    region: "Tshwane North (Region 1)",
    province: "Gauteng",
    suburb: "Soshanguve Block L",
    lat: -25.5226,
    lng: 28.1009,
  },

  // ── GAUTENG: CITY OF EKURHULENI METRO (EAST RAND) ──
  {
    town: "Boksburg",
    city: "Ekurhuleni",
    district: "City of Ekurhuleni Metropolitan Municipality",
    region: "East Rand Central",
    province: "Gauteng",
    suburb: "Boksburg Central",
    lat: -26.2167,
    lng: 28.2500,
  },
  {
    town: "Benoni",
    city: "Ekurhuleni",
    district: "City of Ekurhuleni Metropolitan Municipality",
    region: "East Rand East",
    province: "Gauteng",
    suburb: "Rynfield",
    lat: -26.1883,
    lng: 28.3206,
  },
  {
    town: "Springs",
    city: "Ekurhuleni",
    district: "City of Ekurhuleni Metropolitan Municipality",
    region: "Far East Rand",
    province: "Gauteng",
    suburb: "New State Areas",
    lat: -26.2575,
    lng: 28.4597,
  },
  {
    town: "Kempton Park",
    city: "Ekurhuleni",
    district: "City of Ekurhuleni Metropolitan Municipality",
    region: "East Rand North",
    province: "Gauteng",
    suburb: "OR Tambo Airport Precinct",
    lat: -26.1000,
    lng: 28.2333,
  },
  {
    town: "Tembisa",
    city: "Ekurhuleni",
    district: "City of Ekurhuleni Metropolitan Municipality",
    region: "East Rand North",
    province: "Gauteng",
    suburb: "Hospital View",
    lat: -25.9925,
    lng: 28.2272,
  },
  {
    town: "Germiston",
    city: "Ekurhuleni",
    district: "City of Ekurhuleni Metropolitan Municipality",
    region: "East Rand West",
    province: "Gauteng",
    suburb: "Bedfordview / Primrose",
    lat: -26.2250,
    lng: 28.1708,
  },

  // ── WESTERN CAPE: CITY OF CAPE TOWN METRO ──
  {
    town: "Cape Town CBD",
    city: "Cape Town",
    district: "City of Cape Town Metropolitan Municipality",
    region: "Table Bay / Atlantic Coast",
    province: "Western Cape",
    suburb: "Foreshore / City Bowl",
    lat: -33.9249,
    lng: 18.4241,
  },
  {
    town: "Bellville",
    city: "Cape Town",
    district: "City of Cape Town Metropolitan Municipality",
    region: "Northern Suburbs (Tygerberg)",
    province: "Western Cape",
    suburb: "Karl Bremer / Boston",
    lat: -33.8967,
    lng: 18.6258,
  },
  {
    town: "Athlone / Heideveld",
    city: "Cape Town",
    district: "City of Cape Town Metropolitan Municipality",
    region: "Cape Flats",
    province: "Western Cape",
    suburb: "Heideveld / Crawford",
    lat: -33.9667,
    lng: 18.5500,
  },
  {
    town: "Mitchells Plain",
    city: "Cape Town",
    district: "City of Cape Town Metropolitan Municipality",
    region: "Cape Flats South",
    province: "Western Cape",
    suburb: "Town Centre / Promenade",
    lat: -34.0484,
    lng: 18.6223,
  },
  {
    town: "Khayelitsha",
    city: "Cape Town",
    district: "City of Cape Town Metropolitan Municipality",
    region: "Cape Flats East",
    province: "Western Cape",
    suburb: "Harare / Site B",
    lat: -34.0383,
    lng: 18.6783,
  },
  {
    town: "Wynberg",
    city: "Cape Town",
    district: "City of Cape Town Metropolitan Municipality",
    region: "Southern Suburbs",
    province: "Western Cape",
    suburb: "Claremont / Wynberg",
    lat: -34.0044,
    lng: 18.4686,
  },
  {
    town: "Somerset West",
    city: "Cape Town",
    district: "City of Cape Town Metropolitan Municipality",
    region: "Helderberg Basin",
    province: "Western Cape",
    suburb: "Strand / Somerset West",
    lat: -34.0833,
    lng: 18.8500,
  },

  // ── KWAZULU-NATAL: ETHEKWINI METRO (DURBAN) ──
  {
    town: "Durban Central",
    city: "Durban",
    district: "eThekwini Metropolitan Municipality",
    region: "Durban Coastal Central",
    province: "KwaZulu-Natal",
    suburb: "CBD / South Beach",
    lat: -29.8587,
    lng: 31.0218,
  },
  {
    town: "Umhlanga",
    city: "Durban",
    district: "eThekwini Metropolitan Municipality",
    region: "Durban North Coast",
    province: "KwaZulu-Natal",
    suburb: "Umhlanga Rocks / Gateway",
    lat: -29.7289,
    lng: 31.0858,
  },
  {
    town: "Pinetown",
    city: "Durban",
    district: "eThekwini Metropolitan Municipality",
    region: "Durban Inner West",
    province: "KwaZulu-Natal",
    suburb: "New Germany / Westville",
    lat: -29.8242,
    lng: 30.8656,
  },
  {
    town: "Umlazi",
    city: "Durban",
    district: "eThekwini Metropolitan Municipality",
    region: "Durban South Basin",
    province: "KwaZulu-Natal",
    suburb: "Prince Mshiyeni Precinct",
    lat: -29.9678,
    lng: 30.8878,
  },

  // ── EASTERN CAPE: NELSON MANDELA BAY & BUFFALO CITY ──
  {
    town: "Gqeberha (Port Elizabeth)",
    city: "Gqeberha",
    district: "Nelson Mandela Bay Metropolitan Municipality",
    region: "Algoa Bay Coastal",
    province: "Eastern Cape",
    suburb: "Central / Summerstrand",
    lat: -33.9608,
    lng: 25.6022,
  },
  {
    town: "Kariega (Uitenhage)",
    city: "Gqeberha",
    district: "Nelson Mandela Bay Metropolitan Municipality",
    region: "Nelson Mandela Bay Inland",
    province: "Eastern Cape",
    suburb: "Kariega Central",
    lat: -33.7667,
    lng: 25.4000,
  },
  {
    town: "East London",
    city: "East London",
    district: "Buffalo City Metropolitan Municipality",
    region: "Amatole Coastal",
    province: "Eastern Cape",
    suburb: "Quigney / CBD",
    lat: -33.0153,
    lng: 27.9116,
  },

  // ── FREE STATE: MANGAUNG METRO ──
  {
    town: "Bloemfontein Central",
    city: "Bloemfontein",
    district: "Mangaung Metropolitan Municipality",
    region: "Mangaung Metro Central",
    province: "Free State",
    suburb: "Westdene / CBD",
    lat: -29.0852,
    lng: 26.1596,
  },
  {
    town: "Flamingo Park / Welkom",
    city: "Welkom",
    district: "Lejweleputswa District Municipality",
    region: "Free State Goldfields",
    province: "Free State",
    suburb: "Flamingo Park / Welkom Central",
    lat: -27.9471,
    lng: 26.7237,
  },
  {
    town: "Thabong",
    city: "Welkom",
    district: "Lejweleputswa District Municipality",
    region: "Free State Goldfields",
    province: "Free State",
    suburb: "Mothusi",
    lat: -27.9733,
    lng: 26.7419,
  },
  {
    town: "Botshabelo",
    city: "Bloemfontein",
    district: "Mangaung Metropolitan Municipality",
    region: "Mangaung East",
    province: "Free State",
    suburb: "Section E",
    lat: -29.2333,
    lng: 26.7167,
  },

  // ── LIMPOPO, MPUMALANGA, NORTH WEST, NORTHERN CAPE ──
  {
    town: "Polokwane",
    city: "Polokwane",
    district: "Capricorn District Municipality",
    region: "Capricorn Central",
    province: "Limpopo",
    suburb: "CBD / Bendor",
    lat: -23.9045,
    lng: 29.4688,
  },
  {
    town: "Mbombela (Nelspruit)",
    city: "Mbombela",
    district: "Ehlanzeni District Municipality",
    region: "Lowveld Central",
    province: "Mpumalanga",
    suburb: "Riverside Park",
    lat: -25.4753,
    lng: 30.9694,
  },
  {
    town: "Rustenburg",
    city: "Rustenburg",
    district: "Bojanala Platinum District Municipality",
    region: "Bojanala Central",
    province: "North West",
    suburb: "Cashan",
    lat: -25.6667,
    lng: 27.2417,
  },
  {
    town: "Potchefstroom",
    city: "Potchefstroom",
    district: "Dr Kenneth Kaunda District Municipality",
    region: "Southern North West",
    province: "North West",
    suburb: "Bult / Central",
    lat: -26.7145,
    lng: 27.0970,
  },
  {
    town: "Kimberley",
    city: "Kimberley",
    district: "Frances Baard District Municipality",
    region: "Diamond Fields",
    province: "Northern Cape",
    suburb: "Monument Heights / CBD",
    lat: -28.7282,
    lng: 24.7499,
  },
  {
    town: "George",
    city: "George",
    district: "Garden Route District Municipality",
    region: "Garden Route Coastal",
    province: "Western Cape",
    suburb: "Heatherlands / CBD",
    lat: -33.9631,
    lng: 22.4617,
  },
  {
    town: "Stellenbosch",
    city: "Stellenbosch",
    district: "Cape Winelands District Municipality",
    region: "Boland Winelands",
    province: "Western Cape",
    suburb: "Die Boord / Central",
    lat: -33.9321,
    lng: 18.8602,
  },
  {
    town: "Pietermaritzburg",
    city: "Pietermaritzburg",
    district: "uMgungundlovu District Municipality",
    region: "KZN Midlands",
    province: "KwaZulu-Natal",
    suburb: "Scottsville / CBD",
    lat: -29.6006,
    lng: 30.3794,
  },
];

/**
 * Calculates Haversine distance in km between two coordinate points
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return R * c;
}

/**
 * Synchronous local reverse-geocoder for South African coordinates.
 * Instantly resolves District, Region, City, Town, and Province without network dependency.
 */
export function inferSouthAfricanLocationSync(
  lat: number,
  lng: number,
  accuracy: number = 15,
  source: SouthAfricanLocationDetails["source"] = "BEACON_TELEMETRY"
): SouthAfricanLocationDetails {
  let closest = SA_SETTLEMENTS_DATABASE[0];
  let minDistance = Infinity;

  for (const item of SA_SETTLEMENTS_DATABASE) {
    const dist = haversineDistanceKm(lat, lng, item.lat, item.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = item;
    }
  }

  const formattedDisplay = `${closest.town}, ${closest.district}, ${closest.province}`;

  return {
    latitude: lat,
    longitude: lng,
    accuracy: Math.round(accuracy),
    district: closest.district,
    region: closest.region,
    city: closest.city,
    town: closest.town,
    suburb: closest.suburb,
    province: closest.province,
    formattedDisplay,
    source,
    timestamp: Date.now(),
  };
}

/**
 * Asynchronous reverse-geocoder that queries OpenStreetMap Nominatim when online,
 * with instantaneous offline fallback to the South African settlements database.
 */
export async function resolveSouthAfricanLocation(
  lat: number,
  lng: number,
  accuracy: number = 15
): Promise<SouthAfricanLocationDetails> {
  const localFallback = inferSouthAfricanLocationSync(lat, lng, accuracy, "GPS_DEVICE");

  if (typeof window === "undefined" || !navigator.onLine) {
    return localFallback;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data?.address || {};

      const town =
        addr.suburb ||
        addr.town ||
        addr.village ||
        addr.neighbourhood ||
        addr.city_district ||
        localFallback.town;

      const city = addr.city || addr.town || addr.municipality || localFallback.city;

      const district =
        addr.county ||
        addr.district ||
        addr.city_district ||
        localFallback.district;

      const region = addr.state_district || addr.region || localFallback.region;
      const province = addr.state || localFallback.province;
      const suburb = addr.suburb || addr.neighbourhood || localFallback.suburb;

      const formattedDisplay = `${town}, ${city !== town ? city + ", " : ""}${district}`;

      return {
        latitude: lat,
        longitude: lng,
        accuracy: Math.round(accuracy),
        district,
        region,
        city,
        town,
        suburb,
        province,
        formattedDisplay,
        source: "NOMINATIM",
        timestamp: Date.now(),
      };
    }
  } catch {
    // Silent fallback to local geospatial index on fetch error, timeout, or CORS restriction
  }

  return localFallback;
}

/**
 * Reads the actual physical device hardware location via navigator.geolocation
 * and resolves its district, region, city, and town.
 */
export async function readDeviceLocationWithDetails(options?: {
  timeoutMs?: number;
  highAccuracy?: boolean;
}): Promise<SouthAfricanLocationDetails> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const highAccuracy = options?.highAccuracy ?? true;

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem("umkhuseli_last_device_location");
        if (raw) {
          const parsed: SouthAfricanLocationDetails = JSON.parse(raw);
          return { ...parsed, source: "CACHE" };
        }
        const cachedRaw = localStorage.getItem("umkhuseli_cached_live_location");
        if (cachedRaw) {
          const c = JSON.parse(cachedRaw);
          return inferSouthAfricanLocationSync(c.lat, c.lng, c.accuracy || 20, "CACHE");
        }
      } catch {
        /* ignore storage read failure */
      }
    }
    throw new Error("Live device GPS hardware is unavailable and no cached GPS location is stored.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const details = await resolveSouthAfricanLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy || 15
          );

          // Cache in local storage
          if (typeof localStorage !== "undefined") {
            try {
              localStorage.setItem("umkhuseli_last_device_location", JSON.stringify(details));
            } catch {
              /* ignore storage write failures */
            }
          }

          resolve(details);
        } catch {
          resolve(
            inferSouthAfricanLocationSync(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy || 15,
              "GPS_DEVICE"
            )
          );
        }
      },
      (err) => {
        // Try reading cached location
        if (typeof localStorage !== "undefined") {
          try {
            const raw = localStorage.getItem("umkhuseli_last_device_location");
            if (raw) {
              const parsed: SouthAfricanLocationDetails = JSON.parse(raw);
              resolve({ ...parsed, source: "CACHE" });
              return;
            }
          } catch {
            /* ignore */
          }
        }
        reject(err);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: 10000,
      }
    );
  });
}


/**
 * Resolves South African coordinates and area information from a user-configured address string,
 * town, suburb or survivor profile text.
 */
export function resolveCoordinatesFromAddressOrProfile(
  address?: string
): { latitude: number; longitude: number; areaName: string; province: string } | null {
  if (!address || typeof address !== "string" || !address.trim()) return null;
  const lower = address.toLowerCase();

  // Direct keyword matching against known settlement centroids
  for (const s of SA_SETTLEMENTS_DATABASE) {
    if (
      lower.includes(s.town.toLowerCase()) ||
      lower.includes(s.city.toLowerCase()) ||
      (s.suburb && lower.includes(s.suburb.toLowerCase()))
    ) {
      return {
        latitude: s.lat,
        longitude: s.lng,
        areaName: `${s.suburb ? s.suburb + ", " : ""}${s.town}`,
        province: s.province,
      };
    }
  }

  if (lower.includes("welkom") || lower.includes("flamingo park") || lower.includes("thabong")) {
    return {
      latitude: -27.9471,
      longitude: 26.7237,
      areaName: "Flamingo Park, Welkom",
      province: "Free State",
    };
  }
  if (lower.includes("bloemfontein") || lower.includes("mangaung")) {
    return {
      latitude: -29.0852,
      longitude: 26.1596,
      areaName: "Bloemfontein Central",
      province: "Free State",
    };
  }
  if (lower.includes("soweto")) {
    return {
      latitude: -26.2606,
      longitude: 27.9429,
      areaName: "Soweto / Diepkloof",
      province: "Gauteng",
    };
  }
  if (lower.includes("sandton")) {
    return {
      latitude: -26.1076,
      longitude: 28.0567,
      areaName: "Sandton",
      province: "Gauteng",
    };
  }
  if (lower.includes("pretoria") || lower.includes("tshwane")) {
    return {
      latitude: -25.7479,
      longitude: 28.2293,
      areaName: "Pretoria Central",
      province: "Gauteng",
    };
  }
  if (lower.includes("cape town") || lower.includes("kaapstad")) {
    return {
      latitude: -33.9249,
      longitude: 18.4241,
      areaName: "Cape Town CBD",
      province: "Western Cape",
    };
  }
  if (lower.includes("durban") || lower.includes("ethekwini")) {
    return {
      latitude: -29.8587,
      longitude: 31.0218,
      areaName: "Durban Central",
      province: "KwaZulu-Natal",
    };
  }

  return null;
}
