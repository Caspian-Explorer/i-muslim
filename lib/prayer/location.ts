import type { Coords } from "./engine";

export interface LocationHint {
  coords: Coords;
  city: string | null;
  countryCode: string | null;
  tz: string;
  source: "fallback" | "ip" | "tz-heuristic" | "browser" | "manual";
}

export const MECCA_FALLBACK: LocationHint = {
  coords: { lat: 21.4225, lng: 39.8262 },
  city: "Mecca",
  countryCode: "SA",
  tz: "Asia/Riyadh",
  source: "fallback",
};

interface IpApiCoResponse {
  latitude?: number;
  longitude?: number;
  city?: string;
  country_code?: string;
  timezone?: string;
}

export async function fetchIpLocation(
  signal?: AbortSignal,
): Promise<LocationHint | null> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const composite = signal
      ? mergeSignals(signal, ctrl.signal)
      : ctrl.signal;

    const res = await fetch("https://ipapi.co/json/", {
      signal: composite,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = (await res.json()) as IpApiCoResponse;
    if (
      typeof json.latitude !== "number" ||
      typeof json.longitude !== "number"
    ) {
      return null;
    }
    return {
      coords: { lat: json.latitude, lng: json.longitude },
      city: json.city ?? null,
      countryCode: json.country_code ?? null,
      tz: json.timezone || "UTC",
      source: "ip",
    };
  } catch {
    return null;
  }
}

function mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (a.aborted) return a;
  if (b.aborted) return b;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });
  return ctrl.signal;
}

export function requestBrowserLocation(
  options?: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 60_000,
      ...options,
    });
  });
}

export async function geolocationPermissionState(): Promise<
  "granted" | "denied" | "prompt" | "unknown"
> {
  if (
    typeof navigator === "undefined" ||
    !navigator.permissions ||
    !("query" in navigator.permissions)
  ) {
    return "unknown";
  }
  try {
    const status = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return status.state as "granted" | "denied" | "prompt";
  } catch {
    return "unknown";
  }
}

export function detectClientTimeZone(): string {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || MECCA_FALLBACK.tz
    );
  } catch {
    return MECCA_FALLBACK.tz;
  }
}
