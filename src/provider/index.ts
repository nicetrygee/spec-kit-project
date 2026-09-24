// The weather provider module's public surface (contracts/weather-provider.md).
// The rest of the app imports from here only, never from openMeteo.ts directly,
// so switching provider means changing this folder only (Principle VII).

/** No network, timeout, or an unusable answer from the provider. */
export class ProviderUnavailableError extends Error {
  constructor(message = 'The weather provider could not be reached.') {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

/** A search query that failed validation reached the provider module. */
export class InvalidQueryError extends Error {
  constructor(message = 'The search text is not a valid place name.') {
    super(message);
    this.name = 'InvalidQueryError';
  }
}

export const PROVIDER_NAME = 'Open-Meteo';
export const WEATHER_ATTRIBUTION = 'Weather data by Open-Meteo.com';
export const PLACE_ATTRIBUTION = 'Place data: GeoNames';
