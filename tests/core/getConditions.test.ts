import { getConditions, type ConditionsDeps } from '../../src/core/getConditions';
import type { CurrentConditions, Place, SavedConditions } from '../../src/core/types';
import { ProviderUnavailableError } from '../../src/provider';

const MINUTE = 60_000;
const place: Place = { name: 'Richmond', state: 'Victoria', latitude: -37.82, longitude: 145 };
const now = Date.UTC(2026, 8, 24, 12, 0);

const conditions: CurrentConditions = {
  temperatureC: 23.7,
  feelsLikeC: 21.6,
  description: 'Overcast',
  rainChancePercent: 0,
  windSpeedKmh: 18.5,
  windDirection: 'N',
  observedAt: now - 5 * MINUTE,
  farFromRequest: false,
  source: 'Open-Meteo',
  attribution: 'Weather data by Open-Meteo.com',
};

/** Stand-ins for the network, storage and clock; override per test. */
function makeDeps(overrides: Partial<ConditionsDeps> = {}) {
  return {
    fetchCurrentConditions: jest.fn().mockResolvedValue(conditions),
    loadConditions: jest.fn().mockResolvedValue(null),
    saveConditions: jest.fn().mockResolvedValue(undefined),
    saveLastViewedPlace: jest.fn().mockResolvedValue(undefined),
    now: () => now,
    ...overrides,
  };
}

const unavailable = () => jest.fn().mockRejectedValue(new ProviderUnavailableError());

describe('getConditions', () => {
  it('returns fresh conditions when the provider answers', async () => {
    const deps = makeDeps();
    await expect(getConditions(place, deps)).resolves.toEqual({
      status: 'fresh',
      conditions,
      stale: false,
    });
    expect(deps.fetchCurrentConditions).toHaveBeenCalledWith(place);
  });

  it('returns an error status when the provider is unavailable and nothing is saved', async () => {
    const deps = makeDeps({ fetchCurrentConditions: unavailable() });
    await expect(getConditions(place, deps)).resolves.toEqual({ status: 'error' });
  });

  it('reuses saved conditions under 30 minutes old without asking the provider (SC-007)', async () => {
    const saved: SavedConditions = { place, conditions, savedAt: now - 29 * MINUTE };
    const deps = makeDeps({ loadConditions: jest.fn().mockResolvedValue(saved) });
    await expect(getConditions(place, deps)).resolves.toEqual({
      status: 'fresh',
      conditions,
      stale: false,
    });
    expect(deps.fetchCurrentConditions).not.toHaveBeenCalled();
  });

  it('asks the provider when saved conditions are too old to reuse, then saves the answer', async () => {
    const older = { ...conditions, temperatureC: 10 };
    const saved: SavedConditions = { place, conditions: older, savedAt: now - 30 * MINUTE };
    const deps = makeDeps({ loadConditions: jest.fn().mockResolvedValue(saved) });
    await expect(getConditions(place, deps)).resolves.toEqual({
      status: 'fresh',
      conditions,
      stale: false,
    });
    expect(deps.fetchCurrentConditions).toHaveBeenCalledWith(place);
    expect(deps.saveConditions).toHaveBeenCalledWith({ place, conditions, savedAt: now });
    expect(deps.saveLastViewedPlace).toHaveBeenCalledWith(place);
  });

  it('falls back to saved conditions when the provider fails', async () => {
    const savedAt = now - 2 * 60 * MINUTE;
    const saved: SavedConditions = { place, conditions, savedAt };
    const deps = makeDeps({
      fetchCurrentConditions: unavailable(),
      loadConditions: jest.fn().mockResolvedValue(saved),
    });
    await expect(getConditions(place, deps)).resolves.toEqual({
      status: 'fallback',
      conditions,
      savedAt,
      stale: false,
    });
    expect(deps.saveConditions).not.toHaveBeenCalled();
  });

  it('marks fallback conditions over 3 hours old as stale', async () => {
    const old = { ...conditions, observedAt: now - 5 * 60 * MINUTE };
    const saved: SavedConditions = { place, conditions: old, savedAt: now - 5 * 60 * MINUTE };
    const deps = makeDeps({
      fetchCurrentConditions: unavailable(),
      loadConditions: jest.fn().mockResolvedValue(saved),
    });
    await expect(getConditions(place, deps)).resolves.toMatchObject({
      status: 'fallback',
      stale: true,
    });
  });

  it('marks fresh conditions stale when the provider itself reports old data', async () => {
    const old = { ...conditions, observedAt: now - 4 * 60 * MINUTE };
    const deps = makeDeps({ fetchCurrentConditions: jest.fn().mockResolvedValue(old) });
    await expect(getConditions(place, deps)).resolves.toMatchObject({
      status: 'fresh',
      stale: true,
    });
  });

  it.each([
    ['reused', { loadConditions: jest.fn().mockResolvedValue({ place, conditions, savedAt: now }) }],
    [
      'fallback',
      {
        fetchCurrentConditions: unavailable(),
        loadConditions: jest.fn().mockResolvedValue({ place, conditions, savedAt: now - 60 * MINUTE }),
      },
    ],
    ['error', { fetchCurrentConditions: unavailable() }],
  ])('remembers the place as last viewed on the %s path', async (_path, overrides) => {
    const deps = makeDeps(overrides);
    await getConditions(place, deps);
    expect(deps.saveLastViewedPlace).toHaveBeenCalledWith(place);
  });
});
