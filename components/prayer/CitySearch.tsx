"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
    country_code?: string;
  };
}

export interface CityPick {
  city: string;
  countryCode: string | null;
  country: string | null;
  lat: number;
  lng: number;
  displayName: string;
}

interface Props {
  onPick: (pick: CityPick) => void;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DEBOUNCE_MS = 500;

export function CitySearch({ onPick }: Props) {
  const t = useTranslations("prayer.settings");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      return;
    }

    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(false);
      try {
        const url = new URL(NOMINATIM_URL);
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "5");
        url.searchParams.set("q", trimmed);
        const res = await fetch(url.toString(), {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("nominatim error");
        const data = (await res.json()) as NominatimResult[];
        setResults(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(true);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [q]);

  const trimmed = q.trim();
  const showResults = trimmed.length >= 2 && results.length > 0;
  const showEmpty =
    trimmed.length >= 2 && !loading && !error && results.length === 0;

  const handlePick = (r: NominatimResult) => {
    const cityName =
      r.address?.city ??
      r.address?.town ??
      r.address?.village ??
      r.address?.municipality ??
      r.display_name.split(",")[0]?.trim() ??
      "";
    onPick({
      city: cityName,
      countryCode: r.address?.country_code?.toUpperCase() ?? null,
      country: r.address?.country ?? null,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: r.display_name,
    });
    setQ("");
    setResults([]);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={t("cityLabel")}
          placeholder={t("cityPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ps-9"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute end-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && trimmed.length >= 2 && (
        <p className="text-xs text-danger">{t("citySearchError")}</p>
      )}

      {showEmpty && (
        <p className="text-xs text-muted-foreground">{t("citySearchEmpty")}</p>
      )}

      {showResults && (
        <ul className="overflow-hidden rounded-md border border-border bg-card">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => handlePick(r)}
                className="block w-full px-3 py-2 text-start text-sm hover:bg-muted"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-muted-foreground">
        {t("citySearchAttribution")}
      </p>
    </div>
  );
}
