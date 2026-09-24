# Implementation Plan: Search a Place and See Its Current Weather

**Branch**: `001-place-search-weather` | **Date**: 2026-09-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-place-search-weather/spec.md`

## Summary

Build the first version of the app: a search screen where the user types an Australian place
name and picks a match, and a conditions screen that shows that place's current weather with
its source and how old the data is. It uses React Native with Expo (one codebase for iPhone
and Android) and Open-Meteo (free, no key) for both place search and weather. The latest
result for each place is saved on the phone, so it can be reused for 30 minutes and shown
when the network fails. The search screen offers a "Last viewed" shortcut.

## Technical Context

**Language/Version**: TypeScript, at the version Expo SDK 57's project template pins (JavaScript with type checks, see D2)

**Primary Dependencies**: Expo SDK 57 (React Native 0.86, as pinned by the SDK 57 template); `@react-native-async-storage/async-storage`; `react-native-safe-area-context` (D13)

**Storage**: On-device key-value storage (AsyncStorage). Nothing leaves the phone except provider requests.

**Testing**: Jest with `jest-expo` preset, React Native Testing Library

**Target Platform**: iPhone (iOS versions supported by Expo SDK 57) and Android (versions supported by Expo SDK 57)

**Project Type**: Mobile app (single project, no server)

**Performance Goals**: Search results and conditions each within 3 s on a typical mobile connection (SC-002); saved conditions within 2 s offline (SC-004)

**Constraints**: No server; no API keys; location ≤ ~1 km precision; network timeout 10 s; ≤ 1 provider call per place per 30 min

**Scale/Scope**: 2 screens, about 10 small source files, a public app with no accounts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: **PASS**.
Checked against constitution **v1.4.0** (re-checked 2026-09-24 after the Open-Meteo terms amendment).*

| Principle | Tier | Status | How this plan complies |
|---|---|---|---|
| I. Privacy by Design | Essential | ✅ Pass | No GPS in this increment. Place coordinates rounded to 2 decimals (~1 km) before any request (R5, FR-017). Saved data stays on the phone. No analytics, ads or crash reporting. Privacy policy is a release gate, not this increment; it will name Open-Meteo and GeoNames. Denied-permission fallback: search *is* the fallback, built here first. |
| II. Trustworthy When Things Go Wrong | Essential | ✅ Pass | Fallback to saved conditions with "last updated" (FR-013); source + age on every conditions screen (FR-009/010); plain-English messages with next steps (contracts/screens.md); warnings for data > 3 h old or far from the requested place. |
| III. Accessible to Everyone | Essential | ✅ Pass | Every element has a screen-reader label and role (contracts/screens.md); text scales; theme colours checked at ≥ 4.5:1 in both modes; rain as a number; all tap targets ≥ 48; follows dark mode; no animations. Tests query by accessibility label, so missing labels fail tests. |
| IV. One Codebase, Two Platforms | Essential | ✅ Pass | React Native + Expo (D1). Only platform-specific code: Android hardware back button, isolated in one hook (`src/screens/useAndroidBack.ts`). |
| V. Simple and Readable | Essential | ✅ Pass | Two new libraries beyond Expo's own: AsyncStorage (D4) and react-native-safe-area-context (D13, added during implementation). No navigation or state library (D5, D11). Small single-purpose files. Only what the spec asks for. |
| VI. Tested Before Shipped | Essential | ✅ Pass | Automated tests for fetching, caching, coarsening and failure handling. Denied permission is N/A (no GPS yet). The manual device and screen-reader check is in quickstart.md. This increment is not a store release. |
| VII. Replaceable Weather Provider | Recommended | ✅ Pass | All provider calls in `src/provider/`; app uses its own data shapes (data-model.md); storage keys are provider-neutral. |
| VIII. Low Running Cost | Essential | ✅ Pass | Open-Meteo is free for non-commercial use: $0/month. No server. 30-minute reuse keeps calls low. Future store fees (not incurred yet): Apple ~AUD 150/yr + Google ~AUD 38 once ≈ AUD 16/month in the first year. Open-Meteo's non-commercial terms confirmed by owner to cover a free, ad-free public app (research R2). |
| IX. Security Basics | Essential | ✅ Pass | No key or secret exists. Input trimmed, length-limited, restricted to a safe character set, URL-encoded (FR-002, R6); the provider module re-validates. |
| X. Explainability | Essential | ✅ Pass | See *Decisions explained* below (D1–D13). |
| Constraints: Current weather provider terms (Open-Meteo) | Binding | ✅ Pass | **No ads or paid features**: none in this feature; no ad, payment or subscription libraries. **Attribution**: "Weather data by Open-Meteo.com" on every conditions screen (FR-009, contracts/screens.md) and "Place data: GeoNames" with search results. **Caching and limits**: conditions reused for 30 min per place (FR-012, SC-007); search runs only when the user submits (D12); no timers or background refresh. A person using one phone cannot get near 600/min, 5,000/hour or 10,000/day. |

No violations, so *Complexity Tracking* is empty.

## Decisions explained

Each decision gives: **Chosen**, **Why**, **Rejected alternatives**, **Trade-off** (what we give up).

### D1. Framework: React Native with Expo

- **Chosen**: React Native, used through Expo. React Native (by Meta) lets one set of code draw
  real iPhone and Android screens. Expo is a toolkit on top of it that handles building, running
  and updating the app without touching Xcode or Android Studio for day-to-day work.
- **Why**: Widely used and backed by major organisations (Principle IV). It runs on the
  JavaScript tooling already on your machine (Node 22). The Expo Go app lets you see the app on
  your own phone within minutes, with nothing else installed. AI coding tools know it very well,
  which matters for a one-person project. Built-in accessibility features map directly to
  VoiceOver and TalkBack.
- **Rejected**:
  - *Flutter (Google)*: equally strong technically, but it uses the Dart language (less common,
    and not installed here), and it draws its own widgets rather than native ones.
  - *Kotlin Multiplatform*: shares logic well, but the iPhone screens are still largely separate
    work.
  - *.NET MAUI (Microsoft)*: smaller community for mobile.
  - *Two native apps*: ruled out by Principle IV.
- **Trade-off**: We depend on Expo's release cycle, with a major version about three times a
  year that needs upgrading. Some very specialised native features would need extra setup (not
  needed here).

### D2. Language: TypeScript

- **Chosen**: TypeScript, which is JavaScript plus type labels (e.g. "this is a number") that are
  checked before the app runs.
- **Why**: Catches mistakes like using a place name where a number was expected, before users
  see them. It is also Expo's default, so there is nothing extra to set up.
- **Rejected**: plain JavaScript. It is slightly less to read, but mistakes only show up at run time.
- **Trade-off**: A little extra syntax to learn to read.

### D3. Weather and place provider: Open-Meteo

- **Chosen**: Open-Meteo for current conditions and its place-search service (built on GeoNames).
- **Why**: Needs no API key, which is the constitution's preferred option (Principle IX) and
  leaves nothing to leak. It is free for non-commercial use (Principle VIII). It can limit search
  to Australia and returns the state name, so "Richmond, VIC" and "Richmond, NSW" can be told
  apart. It gives every value the spec asks for, including rain chance. The data licence (CC BY
  4.0) allows public apps with attribution. All of this was verified with live calls (research R2).
- **Rejected**:
  - *Bureau of Meteorology*: no official public API for apps, and its data terms restrict reuse.
  - *OpenWeatherMap*: needs an API key shipped in the app.
  - *WillyWeather*: paid, with a key.
  - *Apple WeatherKit*: needs a key, and Android support is awkward.
- **Trade-off**: A small independent provider; its terms could change (Principle VII keeps the
  swap cheap). Its forecasts blend global models, including BoM's, but are not official BoM
  forecasts. The free tier depends on the app staying free of ads and subscriptions (owner
  confirmed the terms on 2026-09-24). Since constitution v1.4.0 this is a binding rule:
  "No ads or paid features", with attribution and caching also required. Changing it needs
  an amendment.

### D4. On-device storage: AsyncStorage

- **Chosen**: `@react-native-async-storage/async-storage`, a simple "save this text under this
  name" store on the phone.
- **Why**: We save tiny amounts: one weather result per viewed place, plus the last viewed place.
  It is the standard, widely used choice, Expo supports it, it is MIT licensed and actively
  maintained. This is the only new library this plan adds (Principle V).
- **Rejected**:
  - *expo-sqlite*: a full database, far more than we need.
  - *react-native-mmkv*: faster, but needs a custom native build, which doesn't work in Expo Go.
  - *expo-secure-store*: meant for secrets, with size limits, and weather isn't secret.
- **Trade-off**: The data isn't encrypted. That's acceptable, because it holds public place names
  and public weather, not personal data.

### D5. No navigation library

- **Chosen**: The app shows either the search screen or the conditions screen, based on one
  piece of state ("which place is selected, if any"). A "Back to search" button, plus the Android
  back button, clears it.
- **Why**: Two screens don't justify a library. It is fewer concepts to understand (Principle V:
  build only what the spec asks for).
- **Rejected**: *Expo Router* or *React Navigation*: the standard choices for many screens, with
  animated transitions and deep links.
- **Trade-off**: If the app grows to several screens (e.g. multi-day forecasts), we will likely
  switch to Expo Router in a later feature. That's a modest, contained change. The Android back
  button needs one small platform-specific file (Principle IV allows this, isolated and labelled).

### D6. Testing: Jest, jest-expo and React Native Testing Library

- **Chosen**: Jest, a test runner that checks the code's behaviour on your computer. `jest-expo`
  sets it up for Expo. React Native Testing Library lets tests "look at" screens the way a user
  or screen reader would, by label and role.
- **Why**: These are the standard, Expo-recommended tools. Because the tests find buttons by their
  screen-reader labels, a missing label makes a test fail, which gives automatic protection for
  Principle III.
- **Rejected**: *Detox or Maestro* (tools that drive a real phone or simulator). They are valuable
  later, but slow and complex to set up for two screens. The manual quickstart checks cover the
  device side for now.
- **Trade-off**: The tests run in a simulated environment, not on real phones, so the manual
  device check before release (Principle VI) still matters.

### D7. Coarsening location: round to 2 decimal places

- **Chosen**: Round latitude and longitude to 2 decimal places everywhere a Place is created,
  and again inside the provider module just before any request.
- **Why**: 0.01° is about 1 km across Australia (research R5), which meets Principle I. Rounding
  twice means no code path can accidentally send a finer position, including when GPS is added
  later.
- **Rejected**: Snapping to a fixed grid, or adding random noise. These are more complex and no
  more private for this purpose.
- **Trade-off**: None that users would notice. Current conditions don't change meaningfully
  within 1 km.

### D8. Data age comes from the provider's timestamp

- **Chosen**: "Updated X minutes ago" is measured from the time the provider says the data
  describes, not from when the phone downloaded it. Ages below zero (wrong phone clock) are shown
  as "just now".
- **Why**: Principle II requires honesty about how old the data is. Downloading an hour-old
  reading a moment ago doesn't make it new.
- **Rejected**: Using the download time. It is simpler, but it can overstate freshness.
- **Trade-off**: If the phone's clock is badly wrong, the age can be off. We never show a
  negative age.

### D9. Weather description is worked out inside the app

- **Chosen**: A small table in the provider module turns Open-Meteo's weather code number
  (international WMO standard, e.g. 61) into words ("Light rain").
- **Why**: Open-Meteo only provides the number. Keeping the table in the provider module means a
  new provider with its own descriptions only changes that module (Principle VII).
- **Trade-off**: About 28 lines of fixed wording to maintain. The WMO codes rarely change.

### D10. Network timeout of 10 seconds

- **Chosen**: Give up on a request after 10 seconds and treat it as "provider unavailable",
  showing saved weather or the error message.
- **Why**: Without a limit, a poor connection could leave the user watching a spinner
  indefinitely. 10 s is generous enough for slow mobile networks.
- **Trade-off**: On an extremely slow connection, a request that would have succeeded at
  12 s is abandoned. The user can tap "Try again".

### D11. No state-management library

- **Chosen**: React's built-in `useState`, which lets a screen remember values.
- **Why**: Two screens with a handful of values don't need Redux, Zustand or similar (Principle V).
- **Trade-off**: Would need revisiting if many screens start sharing lots of data.

### D12. Search runs when the user submits, not on every keystroke

- **Chosen**: Search happens when the user taps "Search" or the keyboard's search key.
- **Why**: Fewer provider calls (Principle VIII). Screen-reader users aren't interrupted by
  results changing as they type (Principle III). Simpler code.
- **Rejected**: Search-as-you-type, which feels quicker but needs rate-limiting logic and is
  noisier for screen readers.
- **Trade-off**: One extra tap.

### D13. Keeping content clear of the notch: react-native-safe-area-context

*Added during implementation (T031). The plan did not anticipate this need.*

- **Chosen**: `react-native-safe-area-context` (5.7, MIT licence), used once in `App.tsx`,
  where it wraps both screens.
- **Why**: Modern phones have a notch, a camera cut-out and a home bar. Without this library,
  the search box and headings can sit underneath them. React Native's built-in `SafeAreaView`
  is officially deprecated ("Use `react-native-safe-area-context` instead"), and it only ever
  worked on iPhone. This library is the replacement React Native itself names. Expo picks the
  version that matches SDK 57, and it is already part of Expo Go, so nothing extra is installed
  on the phone. It is widely used and actively maintained (Principle V).
- **Rejected**:
  - *Built-in `SafeAreaView`*: deprecated, and iPhone only.
  - *Hard-coded top padding*: wrong on some phones, and breaks in landscape.
- **Trade-off**: One more library to keep up to date with Expo upgrades. `npx expo install
  --fix` handles that.

## Project Structure

### Documentation (this feature)

```text
specs/001-place-search-weather/
├── plan.md              # This file
├── research.md          # Phase 0: facts checked (APIs, versions, licences)
├── data-model.md        # Phase 1: the app's own data shapes
├── quickstart.md        # Phase 1: how to prove it works
├── contracts/
│   ├── weather-provider.md   # what the provider module promises
│   └── screens.md            # what each screen shows and says
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
App.tsx                      # Chooses search or conditions screen (D5)
jest.setup.ts                # Registers the AsyncStorage test stand-in
index.ts                     # Expo entry point (generated)
app.json                     # Expo config: name, dark mode "automatic"
src/
├── core/                    # Plain logic, no screens, no network
│   ├── types.ts             # Place, CurrentConditions, SavedConditions
│   ├── validateSearch.ts    # FR-002 rules and messages
│   ├── coarsen.ts           # round to 2 decimals, place key (D7)
│   ├── freshness.ts         # age text, reusable?, stale? (D8, FR-012/014)
│   └── getConditions.ts     # cache → provider → fallback decision (data-model states)
├── provider/                # The ONLY code that talks to Open-Meteo (Principle VII)
│   ├── index.ts             # searchPlaces, fetchCurrentConditions, constants, errors
│   ├── openMeteo.ts         # requests + mapping
│   ├── weatherCodes.ts      # WMO code → words (D9)
│   └── compass.ts           # degrees → "NNW"
├── storage/
│   └── savedConditions.ts   # AsyncStorage save/load, last viewed place
├── screens/
│   ├── SearchScreen.tsx
│   ├── ConditionsScreen.tsx
│   └── useAndroidBack.ts    # PLATFORM-SPECIFIC: Android back button (Principle IV)
└── ui/
    └── theme.ts             # light/dark colours (≥ 4.5:1), sizes (≥ 48)
tests/
├── core/                    # validateSearch, coarsen, freshness, getConditions
├── provider/                # openMeteo mapping + errors (fetch stubbed)
├── storage/                 # save/load round trip
└── screens/                 # SearchScreen, ConditionsScreen via labels
```

**Structure Decision**: A single Expo project at the repository root, next to `specs/` and
`.specify/`. There is no server (Principle VIII) and no separate iOS/Android folders (Expo
generates them at build time). The four `src/` folders separate *what the app decides* (core),
*who it asks* (provider), *what it remembers* (storage) and *what it shows* (screens), so
each can be read and tested alone.

## Complexity Tracking

No constitution violations. Nothing to justify.
