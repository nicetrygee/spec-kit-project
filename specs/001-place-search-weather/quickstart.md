# Quickstart: Validate "Search a Place and See Its Current Weather"

How to prove the feature works once it's built. For what each screen must show, see
[contracts/screens.md](./contracts/screens.md).

## Prerequisites

- Node 22 or later (`node -v`).
- The **Expo Go** app on a real iPhone or Android phone, on the same Wi-Fi as the computer.
  An iOS Simulator or Android emulator also works if one is installed.
- No API keys or configuration files are needed (Open-Meteo requires no key).

## 1. Automated tests (required, Principle VI)

```sh
npm install
npm test
```

Expected: all tests pass. They cover input validation, rounding coordinates to about 1 km,
provider mapping, saving and reuse, fallback to saved weather, and the screens' behaviour
and screen-reader labels.

Also run the type checker:

```sh
npx tsc --noEmit
```

Expected: no errors.

## 2. Run the app

```sh
npx expo start
```

Scan the QR code with the phone's camera (iPhone) or with Expo Go (Android).

## 3. Manual checks

| # | Do this | Expect | Covers |
|---|---|---|---|
| 1 | Search "Richmond" | List includes Richmond with New South Wales, Victoria, Tasmania, Queensland… | US1, FR-003/004 |
| 2 | Tap "Richmond, Victoria" (on 4G, not Wi-Fi) | Search results and then conditions each appear within about 3 s. Temperature, feels like, description, rain %, wind km/h + direction, "Updated … ago", source line | US1, FR-007–010, SC-002 |
| 3 | Back, tap Richmond again within 30 min | Same data appears instantly, no loading | FR-012 |
| 4 | Close app fully, turn on flight mode, reopen | Search screen shows "Last viewed: Richmond, Victoria" | FR-016 |
| 5 | Tap the shortcut | Within 2 s: saved weather + "Couldn't get newer weather…" note | US2, FR-013, SC-004 |
| 6 | Still offline, search "Hobart" | "Search needs an internet connection…" | Edge case |
| 7 | Online, search "", "a", "<script>", "Zzqxville", 101 letters | Correct plain-English message each time, no crash | US3, FR-002/006 |
| 8 | Search "O'Connor" and "St. Kilda" | Accepted and searched (confirms `\p{L}` support on device, R6) | FR-002 |
| 9 | Turn on VoiceOver / TalkBack and repeat 1–2 | Every item is read with a sensible label | FR-020 |
| 10 | Set the largest text size | Nothing cut off or overlapping; screen scrolls | FR-021 |
| 11 | Switch dark mode on and off | Colours change and stay readable | FR-024 |

Testing old data (FR-014) by hand needs a 3-hour wait, so the automated tests cover it
instead by faking the clock.
