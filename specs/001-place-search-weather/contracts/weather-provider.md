# Contract: Weather Provider Module

The only part of the app that talks to the outside weather service (Principle VII).
Location: `src/provider/`. Everything else imports from `src/provider/index.ts` only.

## Functions

### `searchPlaces(query: string): Promise<Place[]>`

- **Precondition**: `query` has already passed validation (FR-002). The module also re-checks
  it and rejects invalid input with `InvalidQueryError` as a second line of defence.
- **Returns**: up to 10 Australian places (FR-003, FR-005), most relevant first, as `Place`
  (see [data-model.md](../data-model.md)), with coordinates already rounded to 2 decimal places.
- **Returns `[]`** when nothing matches (not an error).
- **Throws** `ProviderUnavailableError` on no network, timeout (10 s) or a non-success
  response.

Underlying request (Open-Meteo, for reference; the query is URL-encoded):

```text
GET https://geocoding-api.open-meteo.com/v1/search
    ?name=<query>&count=10&language=en&format=json&countryCode=AU
```

Field mapping: `name → name`, `admin1 → state` (missing → `""`), `latitude/longitude →` rounded.
The response has no `results` key when nothing matches, and that is treated as `[]`.

### `fetchCurrentConditions(place: Place): Promise<CurrentConditions>`

- **Precondition**: `place.latitude`/`longitude` are already rounded. The module rounds again
  anyway, so no request can ever carry finer coordinates (FR-017).
- **Returns**: `CurrentConditions` with any missing value set to `null` (FR-011).
- **Throws** `ProviderUnavailableError` on no network, timeout (10 s), a non-success response
  or a response with no `current` block.
- Sets `farFromRequest` to true if the provider's point is more than 0.25° from the
  requested one.

Underlying request:

```text
GET https://api.open-meteo.com/v1/forecast
    ?latitude=<lat>&longitude=<lon>
    &current=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m
    &wind_speed_unit=kmh&timeformat=unixtime
```

Field mapping: `temperature_2m → temperatureC`, `apparent_temperature → feelsLikeC`,
`precipitation_probability → rainChancePercent`, `weather_code → description` (WMO table),
`wind_speed_10m → windSpeedKmh`, `wind_direction_10m → windDirection` (16-point compass),
`current.time × 1000 → observedAt`.

## Constants exposed

- `PROVIDER_NAME = "Open-Meteo"`
- `WEATHER_ATTRIBUTION = "Weather data by Open-Meteo.com"`
- `PLACE_ATTRIBUTION = "Place data: GeoNames"`

## Test obligations

Tests replace the network call (`fetch`) with a stand-in and check each mapping, the `[]`
case, each error case, the rounding, and that the query is URL-encoded.
