"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MapPin, Settings as SettingsIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ALL_METHODS,
  pickDefaultMadhab,
  pickDefaultMethod,
} from "@/lib/prayer/methods";
import {
  type Coords,
  type HighLatRuleKey,
  type MadhabKey,
  type MethodKey,
} from "@/lib/prayer/engine";
import {
  clearPrefs,
  type PrayerPrefs,
  writePrefs,
} from "@/lib/prayer/storage";
import {
  detectClientTimeZone,
  requestBrowserLocation,
} from "@/lib/prayer/location";
import { CitySearch, type CityPick } from "./CitySearch";

interface Props {
  current: PrayerPrefs;
  onChange?: () => void;
}

const HIGH_LAT_RULES: HighLatRuleKey[] = [
  "middleofthenight",
  "seventhofthenight",
  "twilightangle",
];

async function resolveTzFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const mod = await import("tz-lookup");
    const fn = (mod.default ?? mod) as (a: number, b: number) => string;
    return fn(lat, lng);
  } catch {
    return detectClientTimeZone();
  }
}

export function PrayerTimesSettings({ current, onChange }: Props) {
  const t = useTranslations("prayer");
  const tCommon = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<MethodKey>(current.method);
  const [madhab, setMadhab] = useState<MadhabKey>(current.madhab);
  const [highLat, setHighLat] = useState<HighLatRuleKey | "auto">(
    current.highLatitudeRule ?? "auto",
  );
  const [coords, setCoords] = useState<Coords>(current.coords);
  const [city, setCity] = useState<string | null>(current.city);
  const [countryCode, setCountryCode] = useState<string | null>(
    current.countryCode,
  );
  const [tz, setTz] = useState<string>(current.tz);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<"denied" | "failed" | null>(
    null,
  );

  void tCommon; // reserved for future copy

  const handleUseLocation = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const pos = await requestBrowserLocation({ enableHighAccuracy: true });
      const newCoords: Coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setCoords(newCoords);
      setCity(null);
      setCountryCode(null);
      setTz(await resolveTzFromCoords(newCoords.lat, newCoords.lng));
    } catch (err) {
      const code = (err as GeolocationPositionError | (Error & { code?: number }))
        .code;
      setLocationError(code === 1 ? "denied" : "failed");
    } finally {
      setLocating(false);
    }
  };

  const handleCityPick = async (pick: CityPick) => {
    setCoords({ lat: pick.lat, lng: pick.lng });
    setCity(pick.city || pick.displayName.split(",")[0]?.trim() || null);
    setCountryCode(pick.countryCode);
    setTz(await resolveTzFromCoords(pick.lat, pick.lng));
    if (pick.countryCode) {
      setMethod(pickDefaultMethod(pick.countryCode));
      setMadhab(pickDefaultMadhab(pick.countryCode));
    }
  };

  const handleSave = () => {
    writePrefs({
      method,
      madhab,
      highLatitudeRule: highLat === "auto" ? undefined : highLat,
      coords,
      city,
      countryCode,
      tz,
      source: "manual",
    });
    onChange?.();
    setOpen(false);
  };

  const handleReset = () => {
    clearPrefs();
    onChange?.();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <SettingsIcon className="size-4" />
          {t("settings.open")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>{t("settings.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="prayer-method">{t("settings.method")}</Label>
            <select
              id="prayer-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as MethodKey)}
              className="block w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              {ALL_METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(`method.${m}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>{t("settings.madhab")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={madhab === "shafi" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setMadhab("shafi")}
              >
                {t("settings.madhabShafi")}
              </Button>
              <Button
                type="button"
                variant={madhab === "hanafi" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setMadhab("hanafi")}
              >
                {t("settings.madhabHanafi")}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="prayer-highlat">
              {t("settings.highLatRule")}
            </Label>
            <select
              id="prayer-highlat"
              value={highLat}
              onChange={(e) =>
                setHighLat(e.target.value as HighLatRuleKey | "auto")
              }
              className="block w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="auto">{t("settings.highLatAuto")}</option>
              {HIGH_LAT_RULES.map((r) => (
                <option key={r} value={r}>
                  {t(`highLatRule.${r}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t("settings.location")}</Label>
            <p className="text-xs text-muted-foreground">
              {city
                ? t("settings.locationCurrent", { city })
                : t("settings.locationCurrentNoCity", {
                    lat: coords.lat.toFixed(3),
                    lng: coords.lng.toFixed(3),
                  })}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleUseLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MapPin className="size-4" />
              )}
              {locating ? t("locating") : t("useMyLocation")}
            </Button>
            {locationError === "denied" && (
              <p className="text-xs text-danger">{t("locationDenied")}</p>
            )}
            {locationError === "failed" && (
              <p className="text-xs text-danger">{t("locationFailed")}</p>
            )}
            <CitySearch onPick={handleCityPick} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            {t("settings.reset")}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {t("settings.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
