// Decides what the conditions screen shows (data-model.md → "States of the
// conditions screen"). US1: ask the provider; show the answer or an error.

import type { CurrentConditions, Place } from './types';

export type ConditionsResult =
  | { status: 'fresh'; conditions: CurrentConditions }
  | { status: 'error' };

/** Passed in rather than imported, so tests can replace the network and clock. */
export type ConditionsDeps = {
  fetchCurrentConditions: (place: Place) => Promise<CurrentConditions>;
  now: () => number;
};

export async function getConditions(place: Place, deps: ConditionsDeps): Promise<ConditionsResult> {
  try {
    const conditions = await deps.fetchCurrentConditions(place);
    return { status: 'fresh', conditions };
  } catch {
    // Any failure shows the plain-English error with "Try again" (FR-015),
    // never a crash (Principle II).
    return { status: 'error' };
  }
}
