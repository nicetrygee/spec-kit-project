import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CurrentConditions, Place, SavedConditions } from '../../src/core/types';
import {
  loadConditions,
  loadLastViewedPlace,
  saveConditions,
  saveLastViewedPlace,
} from '../../src/storage/savedConditions';

const vic: Place = { name: 'Richmond', state: 'Victoria', latitude: -37.82, longitude: 145 };
const nsw: Place = { name: 'Richmond', state: 'New South Wales', latitude: -33.6, longitude: 150.75 };
const now = Date.UTC(2026, 8, 24, 12, 0);

const conditions: CurrentConditions = {
  temperatureC: 23.7,
  feelsLikeC: 21.6,
  description: 'Overcast',
  rainChancePercent: 0,
  windSpeedKmh: 18.5,
  windDirection: 'N',
  observedAt: now - 5 * 60_000,
  farFromRequest: false,
  source: 'Open-Meteo',
  attribution: 'Weather data by Open-Meteo.com',
};

const saved: SavedConditions = { place: vic, conditions, savedAt: now };

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('saved conditions', () => {
  it('round-trips under the key conditions:<placeKey>', async () => {
    await saveConditions(saved);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('conditions:-37.82,145', expect.any(String));
    await expect(loadConditions(vic)).resolves.toEqual(saved);
  });

  it('returns null for a place never saved', async () => {
    await saveConditions(saved);
    await expect(loadConditions(nsw)).resolves.toBeNull();
  });

  it('returns null for corrupt stored data', async () => {
    await AsyncStorage.setItem('conditions:-37.82,145', '{not json');
    await expect(loadConditions(vic)).resolves.toBeNull();
  });

  it('returns null when storage fails on read', async () => {
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('disk'));
    await expect(loadConditions(vic)).resolves.toBeNull();
  });

  it('swallows a storage failure on write', async () => {
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));
    await expect(saveConditions(saved)).resolves.toBeUndefined();
  });
});

describe('last viewed place', () => {
  it('round-trips under the key lastViewedPlace', async () => {
    await saveLastViewedPlace(vic);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastViewedPlace', expect.any(String));
    await expect(loadLastViewedPlace()).resolves.toEqual(vic);
  });

  it('keeps only the most recent place', async () => {
    await saveLastViewedPlace(vic);
    await saveLastViewedPlace(nsw);
    await expect(loadLastViewedPlace()).resolves.toEqual(nsw);
  });

  it('returns null when nothing was viewed', async () => {
    await expect(loadLastViewedPlace()).resolves.toBeNull();
  });

  it('returns null for corrupt stored data', async () => {
    await AsyncStorage.setItem('lastViewedPlace', 'garbage');
    await expect(loadLastViewedPlace()).resolves.toBeNull();
  });

  it('returns null when storage fails on read', async () => {
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('disk'));
    await expect(loadLastViewedPlace()).resolves.toBeNull();
  });

  it('swallows a storage failure on write', async () => {
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));
    await expect(saveLastViewedPlace(vic)).resolves.toBeUndefined();
  });
});
