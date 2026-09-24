import type { Place } from './types';

/**
 * Rounds a latitude or longitude to 2 decimal places, about 1 km across
 * Australia (research R5). Keeps location vague enough for Principle I.
 */
export function roundCoord(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  // Math.round can give -0 (e.g. for -0.004); show it as plain 0.
  return rounded === 0 ? 0 : rounded;
}

/** Provider-neutral storage key for a place, e.g. "-37.81,144.96". */
export function placeKey(place: Place): string {
  return `${roundCoord(place.latitude)},${roundCoord(place.longitude)}`;
}

/** Display name, e.g. "Richmond, Victoria", or just "Richmond" with no state. */
export function placeLabel(place: Place): string {
  return place.state ? `${place.name}, ${place.state}` : place.name;
}
