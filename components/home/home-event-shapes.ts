import type { EventLocationMode } from "@/types/admin";

export interface SerializableEvent {
  id: string;
  title: string;
  nextStartsAt: string;
  venue: string | null;
  address: string | null;
  mode: EventLocationMode;
  lat: number | null;
  lng: number | null;
}
