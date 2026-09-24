# Data Model: Search a Place and See Its Current Weather

These are the app's own data shapes (Principle VII). Only the provider module
(`src/provider/`) knows Open-Meteo's field names. Everything else uses these shapes.

## Place

A named Australian location the user can choose.

| Field | Type | Rules |
|---|---|---|
| `name` | text | Non-empty. From the provider, e.g. "Richmond". |
| `state` | text | State or territory name, e.g. "Victoria". Empty text if the provider gives none. |
| `latitude` | number | Always rounded to 2 decimal places (R5, FR-017). |
| `longitude` | number | Always rounded to 2 decimal places (R5, FR-017). |

- **Key**: `"<latitude>,<longitude>"` from the rounded values (e.g. `"-37.82,145"`). The key
  is provider-neutral, so saved data survives a provider switch.
- **Display label**: `"<name>, <state>"`, or just `name` if `state` is empty.

## CurrentConditions

A snapshot of the weather at a place.

| Field | Type | Rules |
|---|---|---|
| `temperatureC` | number or `null` | °C. `null` means "Not available" (FR-011). |
| `feelsLikeC` | number or `null` | °C. |
| `description` | text or `null` | Plain words from the WMO code, e.g. "Overcast". Unknown code → `null`. |
| `rainChancePercent` | number or `null` | 0–100. |
| `windSpeedKmh` | number or `null` | ≥ 0. |
| `windDirection` | text or `null` | 16-point compass, e.g. "NNW", worked out from degrees. |
| `observedAt` | number | Time the provider says the data describes, in milliseconds since 1970 (UTC). |
| `farFromRequest` | true/false | True if the provider's point is more than 0.25° from the requested one. |
| `source` | text | "Open-Meteo". |
| `attribution` | text | "Weather data by Open-Meteo.com". |

## SavedConditions

Stored on the device, one per place.

| Field | Type | Rules |
|---|---|---|
| `place` | Place | The place these conditions are for. |
| `conditions` | CurrentConditions | Last successful result. |
| `savedAt` | number | When the app saved it (ms since 1970, device clock). |

- **Storage key**: `conditions:<place key>`.
- **Last viewed place** (FR-016): stored separately under the key `lastViewedPlace` as a Place.
  Only one is kept, and it is replaced each time a place is viewed.

## Derived values (not stored)

| Name | Rule | Requirement |
|---|---|---|
| Data age | `now − observedAt`, never below 0 | FR-010, clock edge case |
| Reusable | `now − savedAt < 30 min` | FR-012 |
| Stale | data age `> 3 h` | FR-014 |

## States of the conditions screen

```text
            ┌───────────┐
 pick place │  Loading  │
 ──────────►│           │
            └─────┬─────┘
    reusable saved│  │not reusable → ask provider
      ┌───────────┘  ├──────── success ───────► Fresh (save it)
      ▼              │
   Fresh (from       └──────── failure ─┬─ saved exists ─► Fallback (saved + "couldn't refresh" note)
   saved)                               └─ nothing saved ─► Error (message + Try again)

 Any shown conditions with data age > 3 h also carry the "may be out of date" warning.
```
