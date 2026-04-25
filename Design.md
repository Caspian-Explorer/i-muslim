# Design

Minimal scaffold. Sections will be filled in as features land — most details are intentionally `TBD`.

## Goal

An all-in-one Islamic companion web app that covers the daily needs of a Muslim user: prayer times, Qibla, Quran, Hadith, Duas, and the Hijri calendar.

## Core features

- **Prayer Times** — daily five, with user-selectable calculation method and location. `TBD`
- **Qibla** — compass-style direction indicator from the user's coordinates. `TBD`
- **Quran** — Mushaf reader with Arabic + translation + (optional) recitation. `TBD`
- **Hadith** — browsable collections (Bukhari, Muslim, etc.) with search. `TBD`
- **Duas** — curated supplications by occasion, Arabic + transliteration + translation. `TBD`
- **Hijri Calendar** — date display, conversion, notable dates (Ramadan, Eid, etc.). `TBD`

## Companion services

- **Matrimonial** — profile create/browse/mutual-interest flow for marriage-intent matchmaking, plus admin moderation. Mutual filter is the halal default (a viewer only sees profiles whose preferences match in both directions); photos are gated until both sides accept. Phase 1 (current) is free and chat-less. Phase 2 introduces a premium tier (Stripe) with raised rate limits and advanced filters; Phase 3 adds wali (guardian) mode; Phase 4 adds chat. Schema fields for `subscription` and `rateLimit` are pre-shaped so the future tier is a switch, not a rewrite. See `app/(site)/matrimonial/`, `app/(admin)/admin/matrimonial/`, and `lib/matrimonial/`.

## Architecture

- Next.js 16 App Router; server components by default, `"use client"` only where needed (geolocation, compass, interactive reader).
- Tailwind 4 for styling.
- Data fetching: server-side where possible; cache aggressively for static reference data (Quran, Hadith).
- `TBD` — state management, routing layout, offline strategy.

## Data sources

Candidates (not yet chosen):
- Quran text/translations: [AlQuran.cloud](https://alquran.cloud/api), [quran.com API](https://api-docs.quran.com/)
- Prayer times: [Aladhan](https://aladhan.com/prayer-times-api)
- Hadith: [Sunnah.com API](https://sunnah.com/developers)
- `TBD` — decide based on licensing, reliability, coverage.

## Data model

`TBD` — depends on whether we persist user state (saved bookmarks, memorization progress, location, preferred calc method).

## Non-goals (for now)

- Native mobile apps (web only).
- Community / social features beyond the matrimonial flow (comments, public sharing, profiles unrelated to matchmaking).
- Payments, donations, subscriptions — outside the deferred matrimonial premium tier (Phase 2).
- User-generated content.

## Open questions

- Auth needed? If so, anonymous local storage vs. account-based sync.
- Offline support / PWA?
- i18n languages beyond English and Arabic?
- Audio recitation hosting (bandwidth-heavy) — CDN vs. linking out?

## See also

- [CLAUDE.md](CLAUDE.md) — agent guidance
- [CHANGELOG.md](CHANGELOG.md) — version history
