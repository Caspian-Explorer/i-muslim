import type { MethodKey, MadhabKey } from "./engine";

export const METHOD_LABEL_KEY: Record<MethodKey, string> = {
  MuslimWorldLeague: "method.MuslimWorldLeague",
  Egyptian: "method.Egyptian",
  Karachi: "method.Karachi",
  UmmAlQura: "method.UmmAlQura",
  Dubai: "method.Dubai",
  MoonsightingCommittee: "method.MoonsightingCommittee",
  NorthAmerica: "method.NorthAmerica",
  Kuwait: "method.Kuwait",
  Qatar: "method.Qatar",
  Singapore: "method.Singapore",
  Tehran: "method.Tehran",
  Turkey: "method.Turkey",
};

export const ALL_METHODS: MethodKey[] = [
  "MuslimWorldLeague",
  "Egyptian",
  "Karachi",
  "UmmAlQura",
  "Dubai",
  "MoonsightingCommittee",
  "NorthAmerica",
  "Kuwait",
  "Qatar",
  "Singapore",
  "Tehran",
  "Turkey",
];

const METHOD_BY_COUNTRY: Record<string, MethodKey> = {
  SA: "UmmAlQura",
  AE: "Dubai",
  EG: "Egyptian",
  SD: "Egyptian",
  LY: "Egyptian",
  YE: "Egyptian",
  PK: "Karachi",
  BD: "Karachi",
  IN: "Karachi",
  AF: "Karachi",
  IR: "Tehran",
  TR: "Turkey",
  ID: "Singapore",
  MY: "Singapore",
  SG: "Singapore",
  BN: "Singapore",
  KW: "Kuwait",
  QA: "Qatar",
  US: "NorthAmerica",
  CA: "NorthAmerica",
  // Russia/CIS — adhan has no native method; MWL is the conventional fallback
  RU: "MuslimWorldLeague",
  AZ: "MuslimWorldLeague",
  KZ: "MuslimWorldLeague",
  UZ: "MuslimWorldLeague",
  KG: "MuslimWorldLeague",
  TJ: "MuslimWorldLeague",
  TM: "MuslimWorldLeague",
};

const HANAFI_COUNTRIES = new Set([
  "TR",
  "PK",
  "BD",
  "IN",
  "AF",
  "UZ",
  "KZ",
  "KG",
  "TJ",
  "TM",
]);

export function pickDefaultMethod(countryCode?: string | null): MethodKey {
  if (!countryCode) return "MuslimWorldLeague";
  return METHOD_BY_COUNTRY[countryCode.toUpperCase()] ?? "MuslimWorldLeague";
}

export function pickDefaultMadhab(countryCode?: string | null): MadhabKey {
  if (!countryCode) return "shafi";
  return HANAFI_COUNTRIES.has(countryCode.toUpperCase()) ? "hanafi" : "shafi";
}
