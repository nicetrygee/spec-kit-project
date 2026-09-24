// The weather provider module's public surface (contracts/weather-provider.md).
// The rest of the app imports from here only, never from the files behind it,
// so switching provider means changing this folder only (Principle VII).

export {
  InvalidQueryError,
  PLACE_ATTRIBUTION,
  PROVIDER_NAME,
  ProviderUnavailableError,
  WEATHER_ATTRIBUTION,
} from './errors';
export { compassToWords } from './compass';
export { fetchCurrentConditions, searchPlaces } from './openMeteo';
