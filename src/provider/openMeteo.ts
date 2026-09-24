// The only code that talks to Open-Meteo (Principle VII). It turns Open-Meteo's
// answers into the app's own shapes (src/core/types.ts).
// Contract: specs/001-place-search-weather/contracts/weather-provider.md

import { roundCoord } from '../core/coarsen';
import type { CurrentConditions, Place } from '../core/types';
import { degreesToCompass } from './compass';
import { PROVIDER_NAME, ProviderUnavailableError, WEATHER_ATTRIBUTION } from './errors';
import { describeWeatherCode } from './weatherCodes';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_FIELDS =
  'temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m';

const TIMEOUT_MS = 10_000; // plan.md D10
const MAX_RESULTS = 10; // FR-005
const FAR_DEGREES = 0.25; // "wrong place" edge case
const TOLERANCE = 1e-9; // absorbs floating-point noise, e.g. 38.06 − 37.81

/**
 * Fetches a URL and parses the JSON answer. Any failure (no network, a timeout,
 * a non-OK status, or a body that isn't JSON) becomes ProviderUnavailableError,
 * so the screens only ever have one kind of failure to handle (Principle II).
 */
async function getJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new ProviderUnavailableError();
    return await response.json();
  } catch {
    throw new ProviderUnavailableError();
  } finally {
    clearTimeout(timer);
  }
}

/** A finite number, or null for anything else (missing, text, NaN). */
function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Up to 10 Australian places matching the query, most relevant first. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const url =
    `${GEOCODING_URL}?name=${encodeURIComponent(query)}` +
    `&count=${MAX_RESULTS}&language=en&format=json&countryCode=AU`;
  const data = await getJson(url);
  if (!isObject(data)) throw new ProviderUnavailableError();

  // Open-Meteo leaves out "results" entirely when nothing matches.
  const results = Array.isArray(data.results) ? data.results : [];

  const places: Place[] = [];
  for (const result of results) {
    if (!isObject(result)) continue;
    const latitude = numberOrNull(result.latitude);
    const longitude = numberOrNull(result.longitude);
    if (typeof result.name !== 'string' || !result.name || latitude === null || longitude === null) {
      continue; // skip entries we can't use rather than fail the whole search
    }
    places.push({
      name: result.name,
      state: typeof result.admin1 === 'string' ? result.admin1 : '',
      latitude: roundCoord(latitude),
      longitude: roundCoord(longitude),
    });
  }
  return places.slice(0, MAX_RESULTS);
}

/** Current weather at a place. Location is rounded to ~1 km before sending (FR-017). */
export async function fetchCurrentConditions(place: Place): Promise<CurrentConditions> {
  const latitude = roundCoord(place.latitude);
  const longitude = roundCoord(place.longitude);
  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=${CURRENT_FIELDS}&wind_speed_unit=kmh&timeformat=unixtime`;
  const data = await getJson(url);
  if (!isObject(data) || !isObject(data.current)) throw new ProviderUnavailableError();

  const current = data.current;
  const time = numberOrNull(current.time);
  if (time === null) throw new ProviderUnavailableError();

  // Open-Meteo moves the point to its nearest grid cell (a few km is normal).
  const answeredLatitude = numberOrNull(data.latitude);
  const answeredLongitude = numberOrNull(data.longitude);
  const farFromRequest =
    (answeredLatitude !== null &&
      Math.abs(answeredLatitude - latitude) > FAR_DEGREES + TOLERANCE) ||
    (answeredLongitude !== null &&
      Math.abs(answeredLongitude - longitude) > FAR_DEGREES + TOLERANCE);

  return {
    temperatureC: numberOrNull(current.temperature_2m),
    feelsLikeC: numberOrNull(current.apparent_temperature),
    description: describeWeatherCode(numberOrNull(current.weather_code)),
    rainChancePercent: numberOrNull(current.precipitation_probability),
    windSpeedKmh: numberOrNull(current.wind_speed_10m),
    windDirection: degreesToCompass(numberOrNull(current.wind_direction_10m)),
    observedAt: time * 1000, // Open-Meteo gives seconds; the app uses milliseconds
    farFromRequest,
    source: PROVIDER_NAME,
    attribution: WEATHER_ATTRIBUTION,
  };
}
