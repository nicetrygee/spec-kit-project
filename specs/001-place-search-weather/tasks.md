---
description: "Task list for 001-place-search-weather"
---

# Tasks: Search a Place and See Its Current Weather

**Input**: Design documents from `specs/001-place-search-weather/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/weather-provider.md, contracts/screens.md, quickstart.md

**Tests**: Included. Constitution Principle VI (Essential) requires automated tests for fetching,
caching, coarsening and failure handling. Within each story, tests are written first and must
fail before the code that makes them pass.

**Organization**: Tasks are grouped by user story, so each story can be built and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: Which user story the task belongs to (US1, US2, US3)
- All paths are relative to the repository root (single Expo project, plan.md → Project Structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the Expo project and test tooling. No app behaviour yet.

- [X] T001 Scaffold an Expo SDK 57 TypeScript project at the repository root using the `blank-typescript` template (create it in a temporary folder, then move the files in, so the existing `.specify/`, `.claude/`, `specs/` and `.gitignore` are kept; merge the template's `.gitignore` entries into the existing one). The result must include `package.json`, `tsconfig.json`, `app.json`, `index.ts` and `App.tsx`.
- [X] T002 Configure `app.json`: set `name` to "Weather", `slug` to "weather-app", and `userInterfaceStyle` to "automatic" (follows the phone's dark mode, FR-024)
- [X] T003 Install test tooling as dev dependencies with `npx expo install --dev jest-expo jest @testing-library/react-native @types/jest`, then in `package.json` add the Jest config (`"preset": "jest-expo"`, `"testMatch": ["<rootDir>/tests/**/*.test.ts?(x)"]`) and the scripts `"test": "jest"` and `"typecheck": "tsc --noEmit"`
- [X] T004 Create the empty folders from plan.md: `src/core/`, `src/provider/`, `src/storage/`, `src/screens/`, `src/ui/`, `tests/core/`, `tests/provider/`, `tests/storage/`, `tests/screens/`, `tests/ui/`
- [X] T005 Check that `npm test -- --passWithNoTests` and `npm run typecheck` both run cleanly, then commit "Scaffold Expo SDK 57 project with Jest"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared building blocks every story uses: data shapes, 1 km rounding, input
validation, the theme and the provider module's public surface.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Define the app's own types in `src/core/types.ts`, exactly as in data-model.md: `Place` {`name`: string (non-empty), `state`: string ("" if the provider gives none), `latitude`: number, `longitude`: number, both "always rounded to 2 decimal places"}; `CurrentConditions` {`temperatureC`, `feelsLikeC`: number | null; `description`: string | null; `rainChancePercent`: number | null ("0–100"); `windSpeedKmh`: number | null ("≥ 0"); `windDirection`: string | null ("16-point compass"); `observedAt`: number (ms since 1970 UTC); `farFromRequest`: boolean; `source`: string; `attribution`: string}; `SavedConditions` {`place`: Place; `conditions`: CurrentConditions; `savedAt`: number}
- [X] T007 [P] Write failing tests in `tests/core/coarsen.test.ts` for `roundCoord` (−37.8136 → −37.81, 144.9631 → 144.96, 145.004 → 145, −0.004 → 0 not −0), `placeKey` (Place at −37.81, 144.96 → `"-37.81,144.96"`) and `placeLabel` ("Richmond, Victoria"; just "Richmond" when `state` is "")
- [X] T008 Implement `roundCoord`, `placeKey` and `placeLabel` in `src/core/coarsen.ts` so T007 passes (plan.md D7)
- [X] T009 [P] Write failing tests in `tests/core/validateSearch.test.ts`: input is trimmed; valid inputs "Richmond", "O'Connor", "O’Connor", "Wagga Wagga", "St. Kilda", "Mount Isa", "Coffs Harbour, NSW", "Café" are accepted; "" and "   " are rejected with "Type the name of a suburb or town to search."; "a" with "Type at least 2 letters."; a 101-character name with "That's too long for a place name. Use 100 characters or fewer."; "<script>", "Richmond!", "3000" and "😀" with "Place names can only contain letters, spaces, hyphens, apostrophes, full stops and commas."; "--" and "'." (no letters) with "Type the name of a suburb or town to search."
- [X] T010 Implement `validateSearch(input: string): { ok: true; query: string } | { ok: false; message: string }` in `src/core/validateSearch.ts`: trim; length 2–100; pattern `^[\p{L} '’.,-]+$` with the `u` flag (a literal space, not `\s`, so tabs and newlines inside the text are rejected); must contain at least one letter; messages exactly as in contracts/screens.md → Messages. Make T009 pass.
- [X] T011 [P] Write a failing test in `tests/ui/theme.test.ts` that computes the WCAG contrast ratio of every text-on-background colour pair in both the light and dark palettes and asserts each is ≥ 4.5 (FR-022), and that `minTouchSize` is ≥ 48 (FR-023)
- [X] T012 Implement `src/ui/theme.ts`: `lightColors` and `darkColors` (keys: `background`, `text`, `mutedText`, `accent`, `warningText`, `warningBackground`, `buttonText`, `buttonBackground`, `border`), `minTouchSize = 48`, spacing constants, and a `useTheme()` hook using React Native's `useColorScheme()`. Make T011 pass.
- [X] T013 [P] Create `src/ui/announce.ts` with `announce(message: string)`, which calls `AccessibilityInfo.announceForAccessibility` so VoiceOver/TalkBack read out status messages. This is the ONLY announcement mechanism: do not also set `accessibilityLiveRegion` on message views, or TalkBack reads each message twice.
- [X] T014 Create the provider module's public surface in `src/provider/index.ts`: export `ProviderUnavailableError` and `InvalidQueryError` (both extend `Error`), and the constants `PROVIDER_NAME = "Open-Meteo"`, `WEATHER_ATTRIBUTION = "Weather data by Open-Meteo.com"` and `PLACE_ATTRIBUTION = "Place data: GeoNames"` (contracts/weather-provider.md). Functions are added in US1.
- [X] T015 Run `npm test` and `npm run typecheck` (all green), then commit "Add core types, coarsening, input validation and theme"

**Checkpoint**: Foundation ready. User story work can begin.

---

## Phase 3: User Story 1 - Find a place and see its current weather (Priority: P1) 🎯 MVP

**Goal**: Online search for an Australian place → pick a result → see current conditions with source and data age.

**Independent Test**: Online, search "Richmond", pick "Richmond, Victoria", and see temperature, feels-like, description, rain %, wind, "Updated … ago" and the source line (quickstart checks 1–2).

### Tests for User Story 1 (write first, must fail) ⚠️

- [ ] T016 [P] [US1] Write failing tests in `tests/provider/compass.test.ts` for `degreesToCompass`: 0 → "N", 358 → "N", 11.24 → "N", 11.25 → "NNE", 90 → "E", 202.5 → "SSW", 337.5 → "NNW", 360 → "N", `null` → `null`; and `compassToWords`: "N" → "north", "NNW" → "north-north-west", "SE" → "south-east", "WSW" → "west-south-west", all 16 points map to non-empty words, `null` → `null`
- [ ] T017 [P] [US1] Write failing tests in `tests/provider/weatherCodes.test.ts`: 0 → "Clear sky", 3 → "Overcast", 61 → "Light rain", 95 → "Thunderstorm", unknown 42 → `null`, `null` → `null`; and every one of the 28 WMO codes (0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99) has a non-empty description
- [ ] T018 [P] [US1] Write failing tests in `tests/provider/openMeteo.test.ts` with `global.fetch` replaced by a Jest stub. For `searchPlaces`: the URL is the geocoding endpoint with `count=10`, `language=en`, `format=json`, `countryCode=AU` and the URL-encoded name (e.g. "St. Kilda" → `St.%20Kilda`); results map `name → name`, `admin1 → state` (missing → ""), and coordinates are rounded to 2 decimals; a response with no `results` key → `[]`; at most 10 results are returned; a non-OK status, a network rejection or an abort after 10 s → `ProviderUnavailableError`. For `fetchCurrentConditions`: the request uses the rounded lat/lon (a Place given −37.8136 is sent as −37.81), `current=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m`, `wind_speed_unit=kmh` and `timeformat=unixtime`; fields map per the contract, with `observedAt = current.time × 1000`; any missing field → `null`; `farFromRequest` is true only when the response point is more than 0.25° from the request in latitude or longitude; `source`/`attribution` are set from the constants; no `current` block, a non-OK status, a network error, a timeout, or a body that is not valid JSON → `ProviderUnavailableError` (for both functions: a malformed body must never escape as any other error). Use Jest fake timers for the timeout case.
- [ ] T019 [P] [US1] Write failing tests in `tests/core/freshness.test.ts` for `ageText(observedAt, now)`: difference < 1 min → "Updated just now"; 1 min → "Updated 1 minute ago"; 12 min → "Updated 12 minutes ago"; 60 min → "Updated 1 hour ago"; 150 min → "Updated 2 hours ago"; observedAt in the future (wrong clock) → "Updated just now"
- [ ] T020 [P] [US1] Write failing tests in `tests/core/getConditions.test.ts` for `getConditions(place, deps)`, where `deps` = { `fetchCurrentConditions`, `now` }: on success → `{ status: "fresh", conditions }`; when fetch throws `ProviderUnavailableError` → `{ status: "error" }`
- [ ] T021 [P] [US1] Write failing tests in `tests/screens/SearchScreen.test.tsx` (React Native Testing Library, search function passed in as a prop): the text box is found by label "Place name"; typing "Richmond" and pressing the button labelled "Search" calls search with "Richmond"; results appear as buttons labelled "Richmond, Victoria", "Richmond, New South Wales"; pressing one calls `onSelectPlace` with that Place; "Place data: GeoNames" is visible when results are shown; invalid input ("a") shows "Type at least 2 letters." and search is NOT called; a `ProviderUnavailableError` shows "Search needs an internet connection. Check your connection and try again."
- [ ] T022 [P] [US1] Write failing tests in `tests/screens/ConditionsScreen.test.tsx` (getConditions and `now` passed in as props): the heading "Richmond, Victoria" has the header role; with fresh conditions it shows "24°" with label "Temperature 24 degrees", "Feels like 22°" with label "Feels like 22 degrees", "Overcast", "Rain: 0%" with label "Chance of rain 0 percent", "Wind: 19 km/h N" with label "Wind 19 kilometres per hour from the north", "Updated 5 minutes ago", and "Source: Open-Meteo · Weather data by Open-Meteo.com"; a `null` value renders "Not available" (FR-011); `farFromRequest: true` shows "This weather may be out of date." with a ⚠ labelled "Warning"; the error status shows "We couldn't get the weather for Richmond, Victoria. Check your internet connection and try again." plus a "Try again" button that calls getConditions again; "Back to search" calls `onBack`

### Implementation for User Story 1

- [ ] T023 [P] [US1] Implement `degreesToCompass(degrees: number | null): string | null` (16 points) and `compassToWords(point: string | null): string | null` (16-entry table, for screen-reader labels) in `src/provider/compass.ts`; export `compassToWords` from `src/provider/index.ts`. Make T016 pass.
- [ ] T024 [P] [US1] Implement `describeWeatherCode(code: number | null): string | null` with the 28-entry WMO table in `src/provider/weatherCodes.ts` (plan.md D9). Make T017 pass.
- [ ] T025 [US1] Implement `searchPlaces` and `fetchCurrentConditions` in `src/provider/openMeteo.ts`, with a private `fetchWithTimeout(url, 10_000)` using `AbortController` (plan.md D10). Use `roundCoord` from `src/core/coarsen.ts` on every coordinate before building a URL, and `encodeURIComponent` on the query. Wrap the request and the parsing of the response together so that any failure (including a JSON parse error or an unexpected shape) is re-thrown as `ProviderUnavailableError`. Export both from `src/provider/index.ts`. Make T018 pass. (Depends on T023, T024.)
- [ ] T026 [P] [US1] Implement `ageText(observedAt: number, now: number): string` in `src/core/freshness.ts` (plan.md D8). Make T019 pass.
- [ ] T027 [US1] Implement `getConditions(place, deps)` in `src/core/getConditions.ts`, returning `{ status: "fresh"; conditions }` or `{ status: "error" }` (US2 adds cache and fallback). Make T020 pass.
- [ ] T028 [US1] Implement `src/screens/SearchScreen.tsx` per contracts/screens.md → Search screen (heading, labelled text box with `returnKeyType="search"`, Search button, results as labelled buttons ≥ 48 high, GeoNames attribution, message area whose text is also passed to `announce()`). Wrap in a `ScrollView` so the largest text size never cuts off. Use `useTheme()`. Make T021 pass.
- [ ] T029 [US1] Implement `src/screens/ConditionsScreen.tsx` per contracts/screens.md → Conditions screen (a static "Loading weather…" text while waiting, not a spinner, so nothing moves on screen (Principle III, reduce motion); the fresh state with all labelled values rounded to whole numbers (screen-reader labels use the same rounded numbers as the text, and the wind label uses `compassToWords`), "Not available" for `null`, freshness line from `ageText`, source line, far-from-request warning, error state with "Try again", "Back to search" button). Wrap in a `ScrollView`; no animations. Make T022 pass.
- [ ] T030 [US1] Implement `src/screens/useAndroidBack.ts`: a hook that, only when `Platform.OS === "android"`, registers a `BackHandler` listener calling a given callback and returning `true`. Mark the file with a top comment "PLATFORM-SPECIFIC (Android): hardware back button — constitution Principle IV". Use it in ConditionsScreen for `onBack`.
- [ ] T031 [US1] Wire `App.tsx`: hold `selectedPlace: Place | null` in `useState`; render SearchScreen (passing `searchPlaces`) when it is null, otherwise ConditionsScreen (passing `getConditions` bound to the real `fetchCurrentConditions` and `Date.now`); set the status bar style from the theme (plan.md D5, D11)
- [ ] T032 [US1] Run `npm test` and `npm run typecheck` (all green), then commit "US1: search a place and see its current weather"

**Checkpoint**: User Story 1 works on its own. This is the MVP: try quickstart checks 1–2 on a phone.

---

## Phase 4: User Story 2 - See saved conditions when the connection fails (Priority: P2)

**Goal**: Save each result on the phone; reuse it for 30 minutes; show it with a "couldn't refresh" note when the provider fails; warn when data is over 3 hours old; show a "Last viewed" shortcut on the search screen.

**Independent Test**: View Richmond online → fully close the app → flight mode → reopen → tap "Last viewed: Richmond, Victoria" → saved weather appears with "Couldn't get newer weather. Showing saved weather from …" (quickstart checks 3–5).

### Tests for User Story 2 (write first, must fail) ⚠️

- [ ] T033 [US2] Install storage with `npx expo install @react-native-async-storage/async-storage` (plan.md D4), and register its official Jest mock in a new `jest.setup.ts` at the repository root, referenced from `setupFiles` in `package.json`. Check the installed package's README for the 3.x mock import path; don't assume the 2.x path.
- [ ] T034 [P] [US2] Write failing tests in `tests/storage/savedConditions.test.ts`: `saveConditions(saved)` then `loadConditions(place)` round-trips under the key `conditions:<placeKey>`; `loadConditions` for an unknown place → `null`; corrupt JSON stored under a key → `null` (no crash); `saveLastViewedPlace(place)` then `loadLastViewedPlace()` round-trips under the key `lastViewedPlace`, and saving again replaces it (only one is kept); storage throwing on read → `null`, on write → swallowed (the weather still shows)
- [ ] T035 [P] [US2] Add failing tests to `tests/core/freshness.test.ts`: `isReusable(savedAt, now)` is true at 29 min 59 s and false at 30 min (FR-012: "less than 30 minutes old"); `isStale(observedAt, now)` is false at exactly 3 h and true at 3 h + 1 ms (FR-014: "older than 3 hours")
- [ ] T036 [P] [US2] Add failing tests to `tests/core/getConditions.test.ts`, with `deps` extended to { `fetchCurrentConditions`, `loadConditions`, `saveConditions`, `saveLastViewedPlace`, `now` }: reusable saved → `{ status: "fresh", conditions: saved.conditions }` and fetch NOT called (SC-007); not reusable + fetch succeeds → fresh, and both `saveConditions` (with `savedAt = now`) and `saveLastViewedPlace` are called; fetch fails + saved exists → `{ status: "fallback", conditions, savedAt }`; fetch fails + nothing saved → `{ status: "error" }`; every successful or fallback result also sets `stale: isStale(conditions.observedAt, now)`; `saveLastViewedPlace` is called even on fallback/error so the shortcut points to the place just opened
- [ ] T037 [P] [US2] Add failing tests to `tests/screens/ConditionsScreen.test.tsx`: the fallback status shows "Couldn't get newer weather. Showing saved weather from 2:15 pm." (the time formatted from `conditions.observedAt`, the same timestamp the "Updated … ago" line uses, in the phone's local time with lower-case am/pm); `stale: true` shows "This weather may be out of date." with the ⚠ labelled "Warning"; the fallback still shows the freshness and source lines
- [ ] T038 [P] [US2] Add failing tests to `tests/screens/SearchScreen.test.tsx`: when a `lastViewedPlace` prop is given, a button labelled "Last viewed: Richmond, Victoria. Opens its weather." is shown, and pressing it calls `onSelectPlace` with that Place; with no `lastViewedPlace` there is no such button; when search fails with `ProviderUnavailableError` and a last viewed place exists, the message also includes "You can still see saved weather for Richmond, Victoria above."

### Implementation for User Story 2

- [ ] T039 [US2] Implement `saveConditions`, `loadConditions`, `saveLastViewedPlace` and `loadLastViewedPlace` in `src/storage/savedConditions.ts` using AsyncStorage and `placeKey` from `src/core/coarsen.ts`. Every read and write is wrapped so storage failures never crash the app. Make T034 pass.
- [ ] T040 [US2] Add `isReusable` (30-minute constant `REUSE_PERIOD_MS`) and `isStale` (3-hour constant `STALE_AFTER_MS`) to `src/core/freshness.ts`. Make T035 pass.
- [ ] T041 [US2] Extend `getConditions` in `src/core/getConditions.ts` to the full state flow in data-model.md → "States of the conditions screen" (reuse → fetch → save → fallback → error, plus the `stale` flag). Make T036 pass without breaking T020.
- [ ] T042 [US2] Extend `src/screens/ConditionsScreen.tsx` with the fallback note and the stale warning (both passed to `announce()`). Make T037 pass.
- [ ] T043 [US2] Extend `src/screens/SearchScreen.tsx` with the "Last viewed" shortcut button (≥ 48 high) and the extra offline sentence. Make T038 pass.
- [ ] T044 [US2] Update `App.tsx`: on start, call `loadLastViewedPlace()` and pass the result to SearchScreen; refresh it whenever the user returns from the conditions screen; bind `getConditions` to the real storage functions
- [ ] T045 [US2] Run `npm test` and `npm run typecheck` (all green), then commit "US2: save conditions, reuse for 30 min, offline fallback and last-viewed shortcut"

**Checkpoint**: User Stories 1 and 2 both work. Try quickstart checks 3–6.

---

## Phase 5: User Story 3 - Helpful handling of unusual searches (Priority: P3)

**Goal**: No input can crash the app; every unusual search gets a plain-English message; no-results is handled; the provider module refuses invalid input as a second line of defence.

**Independent Test**: Search "", "a", a 500-character string, "<script>" and "Zzqxville"; each shows the right message and the app keeps working (quickstart check 7).

### Tests for User Story 3 (write first, must fail) ⚠️

- [ ] T046 [P] [US3] Add a robustness test to `tests/core/validateSearch.test.ts` (SC-005: "at least 20 unusual inputs"): a table of ≥ 20 inputs — "", " ", "\t\n", "a", 101 × "a", 500 × "a", "<script>alert(1)</script>", "'; DROP TABLE places;--", "%00", "../../etc", "😀😀", "Richmond😀", "１２３", "http://x.com", "a@b", "#", "\u0000", "--", "'.", "Richmond\nVIC" — each returns `ok: false` with one of the four messages from contracts/screens.md, and none throws
- [ ] T047 [P] [US3] Add failing tests to `tests/provider/openMeteo.test.ts`: `searchPlaces("<script>")` rejects with `InvalidQueryError` and `fetch` is never called (the provider re-checks with `validateSearch`)
- [ ] T048 [P] [US3] Add failing tests to `tests/screens/SearchScreen.test.tsx`: when search resolves `[]` for "Zzqxville", the message reads exactly `No Australian places matched "Zzqxville". Check the spelling or try a nearby town.`; for each of the four validation messages, submitting the matching input shows it and search is NOT called; after an error message, a valid new search clears it and shows results

### Implementation for User Story 3

- [ ] T049 [US3] Fix anything in `src/core/validateSearch.ts` that T046 exposes (it should already pass if T010 was done fully; any change must keep T009 green)
- [ ] T050 [US3] Make `searchPlaces` in `src/provider/openMeteo.ts` call `validateSearch` first and throw `InvalidQueryError` on failure. Make T047 pass.
- [ ] T051 [US3] Add the no-results message and message clearing to `src/screens/SearchScreen.tsx`. Make T048 pass.
- [ ] T052 [US3] Run `npm test` and `npm run typecheck` (all green), then commit "US3: plain-English handling of unusual and unmatched searches"

**Checkpoint**: All three user stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Release-gate checks from the constitution and a short README.

- [ ] T053 [P] Accessibility review of `src/screens/SearchScreen.tsx` and `src/screens/ConditionsScreen.tsx` against contracts/screens.md: every `Pressable`/`TextInput` has `accessibilityRole` and `accessibilityLabel`; no fixed `height` on text containers (use `minHeight`); no `allowFontScaling={false}`; no `maxFontSizeMultiplier` below the largest standard size; all touch targets use `minTouchSize`; the ⚠ icon has `accessibilityLabel="Warning"`. Fix anything found.
- [ ] T054 [P] Secrets check (constitution gate 5): run `git log -p | grep -iE "api[_-]?key|secret|token|password"` and `grep -rniE "api[_-]?key|secret|token|password" src App.tsx app.json` and confirm nothing sensitive appears (Open-Meteo needs no key)
- [ ] T055 [P] Privacy check (Principle I): `grep -rn "fetch(" src` shows calls only in `src/provider/openMeteo.ts`, and every URL there is built from `roundCoord` output; `package.json` has no analytics, ads or crash-reporting dependencies
- [ ] T056 [P] Write `README.md` at the repository root: one paragraph on what the app is, the prerequisites and commands from quickstart.md (`npm install`, `npm test`, `npx expo start`), and data attribution (Open-Meteo, GeoNames)
- [ ] T057 Run the full `npm test` and `npm run typecheck`, and confirm the final state is green; commit "Polish: accessibility review, README, release-gate checks"
- [ ] T058 **Owner**: run quickstart.md → Manual checks 1–11 on a real phone via Expo Go, including the VoiceOver/TalkBack pass (Principle VI); record any failures as new tasks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies, can start immediately
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories.
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational. Builds on US1's `getConditions`, screens and `App.tsx` (it extends them), so in practice it follows US1.
- **US3 (Phase 5)**: Depends on Foundational. Extends US1's `SearchScreen` and `openMeteo.ts`, so it follows US1; it is independent of US2.
- **Polish (Phase 6)**: After all stories

### User Story Dependencies

```text
Setup ─► Foundational ─► US1 (MVP) ─┬─► US2 ─┐
                                    └─► US3 ─┴─► Polish
```

US2 and US3 touch different parts of `SearchScreen.tsx` (shortcut vs. messages), so they should be done one after the other, not in parallel, to avoid edit conflicts.

### Within Each User Story

- Tests are written first and must FAIL
- Provider and core logic before screens
- Screens before `App.tsx` wiring
- Run all tests and commit at the end of every phase (constitution: "Each change MUST be committed with a clear message")

### Parallel Opportunities

- Phase 2: T006, T007, T009, T011 and T013 touch different files and can be written together
- US1 tests T016–T022 are all separate files ([P])
- US1 implementation: T023, T024 and T026 can go together; T025 waits for T023 + T024
- US2 tests T034–T038 are all separate files ([P])
- US3 tests T046–T048 are all separate files ([P])
- Polish T053–T056 can go together

---

## Parallel Example: User Story 1

```bash
# All US1 tests together (separate files):
Task: "Failing tests for degreesToCompass in tests/provider/compass.test.ts"
Task: "Failing tests for describeWeatherCode in tests/provider/weatherCodes.test.ts"
Task: "Failing tests for searchPlaces/fetchCurrentConditions in tests/provider/openMeteo.test.ts"
Task: "Failing tests for ageText in tests/core/freshness.test.ts"
Task: "Failing tests for getConditions in tests/core/getConditions.test.ts"
Task: "Failing tests for SearchScreen in tests/screens/SearchScreen.test.tsx"
Task: "Failing tests for ConditionsScreen in tests/screens/ConditionsScreen.test.tsx"

# Then the independent pieces of logic together:
Task: "Implement degreesToCompass in src/provider/compass.ts"
Task: "Implement describeWeatherCode in src/provider/weatherCodes.ts"
Task: "Implement ageText in src/core/freshness.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: User Story 1
4. **STOP and VALIDATE**: `npm test`, then quickstart checks 1–2 on a phone
5. Continue only when the MVP looks right

### Incremental Delivery

1. Setup + Foundational → foundation ready (commit)
2. US1 → test → demo on phone (commit): **MVP**
3. US2 → test → demo offline behaviour (commit)
4. US3 → test → demo unusual inputs (commit)
5. Polish → release-gate checks → owner's manual device check

Each phase ends with a commit, so every change can be reviewed in one sitting (Principle V).

---

## Notes

- [P] tasks = different files, no dependency on unfinished tasks
- The [Story] label ties each task back to spec.md for traceability
- Verify each test fails before writing the code that makes it pass
- T010 adds one rule not spelled out word-for-word in FR-002: the input must contain at least one letter (so "--" is rejected). This follows FR-002's "restricted to expected characters", since a place name needs letters.
- Stop at any checkpoint to check the story on its own
