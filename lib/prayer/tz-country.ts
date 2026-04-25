// Static IANA timezone -> approximate country/city/coords map.
// Used as a no-network heuristic when IP geolocation fails.
// Coordinates point at a representative city, not the exact user location;
// they only need to be accurate enough to pick a reasonable default method.

export interface TzCity {
  city: string;
  countryCode: string;
  lat: number;
  lng: number;
}

const TZ_MAP: Record<string, TzCity> = {
  // Middle East
  "Asia/Riyadh": { city: "Riyadh", countryCode: "SA", lat: 24.7136, lng: 46.6753 },
  "Asia/Mecca": { city: "Mecca", countryCode: "SA", lat: 21.4225, lng: 39.8262 },
  "Asia/Dubai": { city: "Dubai", countryCode: "AE", lat: 25.2048, lng: 55.2708 },
  "Asia/Qatar": { city: "Doha", countryCode: "QA", lat: 25.2854, lng: 51.531 },
  "Asia/Kuwait": { city: "Kuwait City", countryCode: "KW", lat: 29.3759, lng: 47.9774 },
  "Asia/Bahrain": { city: "Manama", countryCode: "BH", lat: 26.2235, lng: 50.5876 },
  "Asia/Muscat": { city: "Muscat", countryCode: "OM", lat: 23.588, lng: 58.3829 },
  "Asia/Baghdad": { city: "Baghdad", countryCode: "IQ", lat: 33.3152, lng: 44.3661 },
  "Asia/Damascus": { city: "Damascus", countryCode: "SY", lat: 33.5138, lng: 36.2765 },
  "Asia/Beirut": { city: "Beirut", countryCode: "LB", lat: 33.8938, lng: 35.5018 },
  "Asia/Amman": { city: "Amman", countryCode: "JO", lat: 31.9454, lng: 35.9284 },
  "Asia/Jerusalem": { city: "Jerusalem", countryCode: "IL", lat: 31.7683, lng: 35.2137 },
  "Asia/Hebron": { city: "Hebron", countryCode: "PS", lat: 31.5326, lng: 35.0998 },
  "Asia/Gaza": { city: "Gaza", countryCode: "PS", lat: 31.5018, lng: 34.4668 },
  "Asia/Tehran": { city: "Tehran", countryCode: "IR", lat: 35.6892, lng: 51.389 },
  "Asia/Aden": { city: "Aden", countryCode: "YE", lat: 12.7855, lng: 45.0187 },

  // North Africa
  "Africa/Cairo": { city: "Cairo", countryCode: "EG", lat: 30.0444, lng: 31.2357 },
  "Africa/Khartoum": { city: "Khartoum", countryCode: "SD", lat: 15.5007, lng: 32.5599 },
  "Africa/Tripoli": { city: "Tripoli", countryCode: "LY", lat: 32.8872, lng: 13.1913 },
  "Africa/Tunis": { city: "Tunis", countryCode: "TN", lat: 36.8065, lng: 10.1815 },
  "Africa/Algiers": { city: "Algiers", countryCode: "DZ", lat: 36.7538, lng: 3.0588 },
  "Africa/Casablanca": { city: "Casablanca", countryCode: "MA", lat: 33.5731, lng: -7.5898 },
  "Africa/Mogadishu": { city: "Mogadishu", countryCode: "SO", lat: 2.0469, lng: 45.3182 },
  "Africa/Lagos": { city: "Lagos", countryCode: "NG", lat: 6.5244, lng: 3.3792 },
  "Africa/Nairobi": { city: "Nairobi", countryCode: "KE", lat: -1.2921, lng: 36.8219 },

  // South & Central Asia
  "Asia/Karachi": { city: "Karachi", countryCode: "PK", lat: 24.8607, lng: 67.0011 },
  "Asia/Kolkata": { city: "Delhi", countryCode: "IN", lat: 28.7041, lng: 77.1025 },
  "Asia/Dhaka": { city: "Dhaka", countryCode: "BD", lat: 23.8103, lng: 90.4125 },
  "Asia/Kabul": { city: "Kabul", countryCode: "AF", lat: 34.5553, lng: 69.2075 },
  "Asia/Tashkent": { city: "Tashkent", countryCode: "UZ", lat: 41.2995, lng: 69.2401 },
  "Asia/Almaty": { city: "Almaty", countryCode: "KZ", lat: 43.222, lng: 76.8512 },
  "Asia/Bishkek": { city: "Bishkek", countryCode: "KG", lat: 42.8746, lng: 74.5698 },
  "Asia/Dushanbe": { city: "Dushanbe", countryCode: "TJ", lat: 38.5598, lng: 68.787 },
  "Asia/Ashgabat": { city: "Ashgabat", countryCode: "TM", lat: 37.9601, lng: 58.3261 },
  "Asia/Baku": { city: "Baku", countryCode: "AZ", lat: 40.4093, lng: 49.8671 },
  "Asia/Yerevan": { city: "Yerevan", countryCode: "AM", lat: 40.1792, lng: 44.4991 },
  "Asia/Tbilisi": { city: "Tbilisi", countryCode: "GE", lat: 41.7151, lng: 44.8271 },

  // SE Asia
  "Asia/Jakarta": { city: "Jakarta", countryCode: "ID", lat: -6.2088, lng: 106.8456 },
  "Asia/Makassar": { city: "Makassar", countryCode: "ID", lat: -5.1477, lng: 119.4327 },
  "Asia/Pontianak": { city: "Pontianak", countryCode: "ID", lat: -0.0263, lng: 109.3425 },
  "Asia/Jayapura": { city: "Jayapura", countryCode: "ID", lat: -2.5337, lng: 140.7181 },
  "Asia/Kuala_Lumpur": { city: "Kuala Lumpur", countryCode: "MY", lat: 3.139, lng: 101.6869 },
  "Asia/Kuching": { city: "Kuching", countryCode: "MY", lat: 1.5533, lng: 110.3592 },
  "Asia/Singapore": { city: "Singapore", countryCode: "SG", lat: 1.3521, lng: 103.8198 },
  "Asia/Brunei": { city: "Bandar Seri Begawan", countryCode: "BN", lat: 4.9031, lng: 114.9398 },
  "Asia/Manila": { city: "Manila", countryCode: "PH", lat: 14.5995, lng: 120.9842 },
  "Asia/Bangkok": { city: "Bangkok", countryCode: "TH", lat: 13.7563, lng: 100.5018 },

  // Turkey & Europe
  "Europe/Istanbul": { city: "Istanbul", countryCode: "TR", lat: 41.0082, lng: 28.9784 },
  "Europe/Moscow": { city: "Moscow", countryCode: "RU", lat: 55.7558, lng: 37.6173 },
  "Europe/Samara": { city: "Samara", countryCode: "RU", lat: 53.2415, lng: 50.2212 },
  "Europe/Kaliningrad": { city: "Kaliningrad", countryCode: "RU", lat: 54.7104, lng: 20.4522 },
  "Europe/London": { city: "London", countryCode: "GB", lat: 51.5074, lng: -0.1278 },
  "Europe/Paris": { city: "Paris", countryCode: "FR", lat: 48.8566, lng: 2.3522 },
  "Europe/Berlin": { city: "Berlin", countryCode: "DE", lat: 52.52, lng: 13.405 },
  "Europe/Madrid": { city: "Madrid", countryCode: "ES", lat: 40.4168, lng: -3.7038 },
  "Europe/Rome": { city: "Rome", countryCode: "IT", lat: 41.9028, lng: 12.4964 },
  "Europe/Amsterdam": { city: "Amsterdam", countryCode: "NL", lat: 52.3676, lng: 4.9041 },
  "Europe/Brussels": { city: "Brussels", countryCode: "BE", lat: 50.8503, lng: 4.3517 },
  "Europe/Vienna": { city: "Vienna", countryCode: "AT", lat: 48.2082, lng: 16.3738 },
  "Europe/Stockholm": { city: "Stockholm", countryCode: "SE", lat: 59.3293, lng: 18.0686 },
  "Europe/Oslo": { city: "Oslo", countryCode: "NO", lat: 59.9139, lng: 10.7522 },
  "Europe/Helsinki": { city: "Helsinki", countryCode: "FI", lat: 60.1699, lng: 24.9384 },
  "Europe/Copenhagen": { city: "Copenhagen", countryCode: "DK", lat: 55.6761, lng: 12.5683 },
  "Europe/Warsaw": { city: "Warsaw", countryCode: "PL", lat: 52.2297, lng: 21.0122 },
  "Atlantic/Reykjavik": { city: "Reykjavik", countryCode: "IS", lat: 64.1466, lng: -21.9426 },
  "Europe/Sarajevo": { city: "Sarajevo", countryCode: "BA", lat: 43.8563, lng: 18.4131 },
  "Europe/Tirane": { city: "Tirana", countryCode: "AL", lat: 41.3275, lng: 19.8187 },
  "Europe/Pristina": { city: "Pristina", countryCode: "XK", lat: 42.6629, lng: 21.1655 },

  // North America
  "America/New_York": { city: "New York", countryCode: "US", lat: 40.7128, lng: -74.006 },
  "America/Chicago": { city: "Chicago", countryCode: "US", lat: 41.8781, lng: -87.6298 },
  "America/Denver": { city: "Denver", countryCode: "US", lat: 39.7392, lng: -104.9903 },
  "America/Los_Angeles": { city: "Los Angeles", countryCode: "US", lat: 34.0522, lng: -118.2437 },
  "America/Phoenix": { city: "Phoenix", countryCode: "US", lat: 33.4484, lng: -112.074 },
  "America/Anchorage": { city: "Anchorage", countryCode: "US", lat: 61.2181, lng: -149.9003 },
  "America/Toronto": { city: "Toronto", countryCode: "CA", lat: 43.6532, lng: -79.3832 },
  "America/Vancouver": { city: "Vancouver", countryCode: "CA", lat: 49.2827, lng: -123.1207 },
  "America/Edmonton": { city: "Edmonton", countryCode: "CA", lat: 53.5461, lng: -113.4938 },
  "America/Mexico_City": { city: "Mexico City", countryCode: "MX", lat: 19.4326, lng: -99.1332 },

  // Oceania
  "Australia/Sydney": { city: "Sydney", countryCode: "AU", lat: -33.8688, lng: 151.2093 },
  "Australia/Melbourne": { city: "Melbourne", countryCode: "AU", lat: -37.8136, lng: 144.9631 },
  "Australia/Perth": { city: "Perth", countryCode: "AU", lat: -31.9505, lng: 115.8605 },
  "Pacific/Auckland": { city: "Auckland", countryCode: "NZ", lat: -36.8485, lng: 174.7633 },
};

export function tzToCity(tz: string): TzCity | null {
  return TZ_MAP[tz] ?? null;
}
