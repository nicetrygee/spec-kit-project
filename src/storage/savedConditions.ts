// Saved weather and the last viewed place, kept on the phone (plan.md D4,
// data-model.md → SavedConditions). Storage problems never crash the app:
// a failed read counts as "nothing saved" and a failed write is skipped.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { placeKey } from '../core/coarsen';
import type { Place, SavedConditions } from '../core/types';

const LAST_VIEWED_KEY = 'lastViewedPlace';

function conditionsKey(place: Place): string {
  return `conditions:${placeKey(place)}`;
}

async function read<T>(key: string): Promise<T | null> {
  try {
    const text = await AsyncStorage.getItem(key);
    return text === null ? null : (JSON.parse(text) as T);
  } catch {
    return null; // unreadable or corrupt: behave as if nothing was saved
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not saving only loses the offline copy; the weather still shows.
  }
}

export function saveConditions(saved: SavedConditions): Promise<void> {
  return write(conditionsKey(saved.place), saved);
}

export function loadConditions(place: Place): Promise<SavedConditions | null> {
  return read<SavedConditions>(conditionsKey(place));
}

/** Only one is kept; each call replaces the previous one (FR-016). */
export function saveLastViewedPlace(place: Place): Promise<void> {
  return write(LAST_VIEWED_KEY, place);
}

export function loadLastViewedPlace(): Promise<Place | null> {
  return read<Place>(LAST_VIEWED_KEY);
}
