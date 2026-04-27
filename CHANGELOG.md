# Changelog

All notable changes to **i-muslim** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Admin Settings page is now tabbed (Interface / Qur'an / Hadith); the Interface tab merges the bundled and reserved locale lists into one. Reserved-locale rows show an "Activate" button when inactive and "Edit" + "Deactivate" once activated.
- "Download base JSON" button in the activate-locale dialog so admins can grab the latest `messages/<base>.json` to translate offline before pasting back.
- `npm run sync:locales` script: mirrors activated reserved-locale Firestore docs to the current bundled-locale shape, adding missing keys with English placeholders and dropping stale ones. Idempotent. CLAUDE.md instructs Claude to run it after any change to `messages/*.json` that adds, renames, or removes keys.
- Reserved-locale pool (`ru`, `az`, `fr`, `ur`, `fa`, `bn`, `ms`, `de`, `es`, `hi`) routable from day one. Admin can "Activate" any of them from /admin/settings → Reserved interface locales by pasting a translations JSON; the locale's messages live in Firestore (`config/uiLocales/locales/{code}`) and are deep-merged over the base locale at request time, so partial uploads fall back gracefully.
- Turkish (`tr`) Qur'an/Hadith translation language with Diyanet İşleri Quran translation. Run `npm run seed:quran:lang -- --lang=tr` and `npm run seed:hadith:lang -- --lang=tr` to populate text, then enable in /admin/settings.
- Per-language seed scripts (`seed:quran:lang`, `seed:hadith:lang`) — additive, idempotent, preserve admin-edited translations via `editedTranslations.<lang>` flag.
- Admin Settings page: enable/disable UI locales and Qur'an/Hadith translation languages; disabled entries are hidden from public switchers without affecting routing.

### Changed
- `config/languages` doc: `contentEnabled` split into `quranEnabled` + `hadithEnabled` so Qur'an and Hadith translation languages can be toggled independently. Reads fall back to legacy `contentEnabled` when only that field is present.
- `AyahDoc.translations` and `HadithDoc.translations` widened from fixed `{ en, ru }` to open `Record<string, string>`; renderer iterates over all keys present in the doc, so adding a translation language is purely additive.
- `LocalizedTextRequired` (used for business categories, amenities, mosque names, etc.) is now keyed by `BundledLocale` rather than the full `Locale` set. Authored content stays scoped to the four bundled UI locales; reserved locales fall back to English at render time via the new `pickLocalized` helper in [lib/utils.ts](lib/utils.ts).
- Initial Next.js 16 + React 19 + Tailwind 4 + TypeScript 5 scaffold (via `create-next-app`).
- Foundational documentation: `CLAUDE.md`, `Design.md`, `CHANGELOG.md`.
- `AGENTS.md` with Next.js version warning for coding agents.
- `CLAUDE.md` "Task completion" policy: agents auto-update `CHANGELOG.md` / `README.md` and commit (local only) at the end of each code-changing task.
