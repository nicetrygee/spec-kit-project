# Research: Search a Place and See Its Current Weather

**Feature**: `001-place-search-weather` | **Date**: 2026-09-24

This file records the facts found while planning. The plain-language explanation of each
decision (what, why, alternatives, trade-off) lives in [plan.md](./plan.md#decisions-explained),
as the constitution's Principle X requires. Each item below is referenced there as R1, R2, …

## R1. Cross-platform framework

- **Decision**: React Native via Expo (SDK 57, React Native 0.87), TypeScript.
- **Findings**:
  - Expo SDK 57 is current (`npm view expo version` → 57.0.24 on 2026-09-24).
  - React Native is maintained by Meta; Expo by Expo (650 Industries). Both are widely used.
  - Node 22 is already installed on the owner's machine; Flutter is not. Xcode command-line
    tools are present; the Android SDK is not.
  - Expo Go (a free app from the stores) runs the project on a real phone without Xcode or the
    Android SDK, which is enough for this increment. Store builds can later use EAS Build's
    free tier or local toolchains.
- **Alternatives considered**: Flutter (Google), Kotlin Multiplatform (JetBrains), .NET MAUI
  (Microsoft), two native apps. See plan.md D1.

## R2. Weather and place-search provider

- **Decision**: Open-Meteo for both current conditions and place search.
- **Findings** (live calls made 2026-09-24):
  - Place search: `GET https://geocoding-api.open-meteo.com/v1/search?name=Richmond&count=10&language=en&format=json&countryCode=AU`
    returned only Australian results, each with `name`, `admin1` (state, e.g. "New South
    Wales"), `latitude`, `longitude` and `id`.
  - Current conditions: `GET https://api.open-meteo.com/v1/forecast?latitude=-37.82&longitude=145&current=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`
    returned all six values in °C, %, km/h and degrees, plus `current.time` and
    `interval: 900` (the values describe a 15-minute period).
  - Adding `timeformat=unixtime` returns `current.time` as seconds since 1970 (UTC). This
    avoids time-zone parsing.
  - The provider snaps the requested point to its model grid (asked −37.82, 145.00; answered
    −37.856, 145.013, about 4 km away). This is normal and not a "wrong place".
  - No API key is needed. Free use is for non-commercial purposes, with limits of about
    10,000 calls per day, 5,000 per hour and 600 per minute. Calls come from each user's phone,
    so the limits apply per user, not across the whole app.
  - Weather data is licensed CC BY 4.0 and requires the attribution "Weather data by
    Open-Meteo.com". Place-search data comes from GeoNames, also CC BY 4.0, which requires
    the attribution "Place data: GeoNames".
  - `weather_code` is a WMO code number (e.g. 3 = overcast). The app must turn it into words.
- **Licence confirmed by owner (2026-09-24)**: Open-Meteo's terms list as non-commercial
  "Using our service for private or non-profit websites or apps that do not have subscriptions
  or advertising." This free, ad-free public app qualifies, so the free tier applies. Condition:
  adding ads or subscriptions would end that eligibility (paid tier from about €29/month, which is
  over budget). The constitution already requires an amendment before adding either.
- **Alternatives considered**: Bureau of Meteorology, OpenWeatherMap, WillyWeather, Apple
  WeatherKit. See plan.md D3.

## R3. On-device storage

- **Decision**: `@react-native-async-storage/async-storage` (3.1.1).
- **Findings**: included in Expo's supported library list; stores small text values
  (key → string); community-maintained under the React Native organisation; MIT licence.
  The data this feature saves is tiny: one entry per viewed place, plus the last viewed place.
- **Alternatives considered**: expo-sqlite, react-native-mmkv, expo-secure-store. See plan.md D4.

## R4. Testing tools

- **Decision**: Jest with the `jest-expo` preset (57.0.5), plus React Native Testing Library
  (`@testing-library/react-native` 14.0.1).
- **Findings**: `jest-expo` is Expo's official test preset. React Native Testing Library
  queries screens by accessibility label and role, so the tests also check that screen-reader
  labels exist.
- **Alternatives considered**: Detox or Maestro for full end-to-end device tests. These are
  deferred until there is more than one flow. See plan.md D6.

## R5. Location coarsening

- **Decision**: round latitude and longitude to 2 decimal places before any request.
- **Findings**: 0.01° of latitude is about 1.11 km. 0.01° of longitude is about 0.89 km at
  Melbourne's latitude and about 1.0 km at Brisbane's. That meets "about 1 km" across Australia.

## R6. Input validation character set

- **Decision**: allow Unicode letters (`\p{L}`), spaces, apostrophes (straight `'` and curly `’`),
  hyphens, full stops and commas; 2–100 characters after trimming.
- **Findings**: covers "O'Connor", "Wagga Wagga", "Mount Isa", "St. Kilda" and accented
  names. React Native's JavaScript engine (Hermes) supports `\p{L}` in regular expressions.
  The implementation should still confirm this with a test on a real device, as noted in
  quickstart.md.
