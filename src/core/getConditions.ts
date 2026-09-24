// Decides what the conditions screen shows (data-model.md → "States of the
// conditions screen"): reuse saved → ask provider → save → fallback → error.

import { isReusable, isStale } from './freshness';
import type { CurrentConditions, Place, SavedConditions } from './types';

export type ConditionsResult =
  | { status: 'fresh'; conditions: CurrentConditions; stale: boolean }
  | { status: 'fallback'; conditions: CurrentConditions; savedAt: number; stale: boolean }
  | { status: 'error' };

/** Passed in rather than imported, so tests can replace the network, storage and clock. */
export type ConditionsDeps = {
  fetchCurrentConditions: (place: Place) => Promise<CurrentConditions>;
  loadConditions: (place: Place) => Promise<SavedConditions | null>;
  saveConditions: (saved: SavedConditions) => Promise<void>;
  saveLastViewedPlace: (place: Place) => Promise<void>;
  now: () => number;
};

export async function getConditions(place: Place, deps: ConditionsDeps): Promise<ConditionsResult> {
  const now = deps.now();
  // Whatever happens next, the search screen's shortcut points to this place (FR-016).
  await deps.saveLastViewedPlace(place);

  const saved = await deps.loadConditions(place);
  if (saved && isReusable(saved.savedAt, now)) {
    // Recent enough: no network call (FR-012, SC-007).
    return { status: 'fresh', conditions: saved.conditions, stale: isStale(saved.conditions.observedAt, now) };
  }

  try {
    const conditions = await deps.fetchCurrentConditions(place);
    await deps.saveConditions({ place, conditions, savedAt: now });
    return { status: 'fresh', conditions, stale: isStale(conditions.observedAt, now) };
  } catch {
    // Any failure falls back to saved weather (FR-013), or the plain-English
    // error with "Try again" (FR-015), never a crash (Principle II).
    if (saved) {
      return {
        status: 'fallback',
        conditions: saved.conditions,
        savedAt: saved.savedAt,
        stale: isStale(saved.conditions.observedAt, now),
      };
    }
    return { status: 'error' };
  }
}
