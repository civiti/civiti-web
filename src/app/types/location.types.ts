/**
 * Location data returned by the Location Picker Modal
 */
export interface LocationData {
  /** Full formatted address string */
  address: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** City name (e.g., "București", "Cluj-Napoca") */
  city: string;
  /** District/Sector name (e.g., "Sector 5") - null for cities without districts */
  district: string | null;
  /** Optional street name extracted from address */
  streetName?: string;
  /** Optional street number */
  streetNumber?: string;
}

/**
 * Configuration for the location picker modal
 */
export interface LocationPickerConfig {
  /** Initial location to center the map on */
  initialLocation?: {
    lat: number;
    lng: number;
  };
  /** Initial address to display */
  initialAddress?: string;
  /** Initial city to preserve when user confirms without changes */
  initialCity?: string;
  /** Initial district to preserve when user confirms without changes */
  initialDistrict?: string;
}

/**
 * Location bias configuration for Google Places Autocomplete
 * Used to prefer results from a specific area
 */
export interface LocationBiasConfig {
  /** Center point for the location bias */
  center: {
    lat: number;
    lng: number;
  };
  /** Radius in meters */
  radius: number;
}

/**
 * Location bias for București (all sectors)
 * 15km radius from city center covers all 6 sectors
 */
export const BUCHAREST_LOCATION_BIAS: LocationBiasConfig = {
  center: {
    lat: 44.4268,
    lng: 26.1025
  },
  radius: 15000 // 15km radius covers all sectors
};

/**
 * Default map center for București
 */
export const BUCHAREST_CENTER = {
  lat: 44.4268,
  lng: 26.1025
};

// Backward compatibility aliases
export const SECTOR_5_LOCATION_BIAS = BUCHAREST_LOCATION_BIAS;
export const SECTOR_5_CENTER = BUCHAREST_CENTER;
