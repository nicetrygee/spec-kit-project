// The app's own data shapes (data-model.md). Only src/provider/ knows the
// weather provider's field names; everything else uses these (Principle VII).

/** A named Australian location the user can choose. */
export type Place = {
  /** Non-empty, e.g. "Richmond". */
  name: string;
  /** State or territory, e.g. "Victoria". "" if the provider gives none. */
  state: string;
  /** Always rounded to 2 decimal places (~1 km, FR-017). */
  latitude: number;
  /** Always rounded to 2 decimal places (~1 km, FR-017). */
  longitude: number;
};

/** A snapshot of the weather at a place. `null` means "Not available" (FR-011). */
export type CurrentConditions = {
  temperatureC: number | null;
  feelsLikeC: number | null;
  /** Plain words, e.g. "Overcast". */
  description: string | null;
  /** 0–100. */
  rainChancePercent: number | null;
  /** ≥ 0. */
  windSpeedKmh: number | null;
  /** 16-point compass, e.g. "NNW". */
  windDirection: string | null;
  /** Time the provider says the data describes, ms since 1970 (UTC). */
  observedAt: number;
  /** True if the provider's point is more than 0.25° from the requested one. */
  farFromRequest: boolean;
  source: string;
  attribution: string;
};

/** The most recent conditions for a place, kept on the device. */
export type SavedConditions = {
  place: Place;
  conditions: CurrentConditions;
  /** When the app saved it, ms since 1970 (device clock). */
  savedAt: number;
};
