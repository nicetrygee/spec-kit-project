import { getConditions } from '../../src/core/getConditions';
import type { CurrentConditions, Place } from '../../src/core/types';
import { ProviderUnavailableError } from '../../src/provider';

const place: Place = { name: 'Richmond', state: 'Victoria', latitude: -37.82, longitude: 145 };
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

describe('getConditions', () => {
  it('returns fresh conditions when the provider answers', async () => {
    const fetchCurrentConditions = jest.fn().mockResolvedValue(conditions);
    await expect(
      getConditions(place, { fetchCurrentConditions, now: () => now }),
    ).resolves.toEqual({ status: 'fresh', conditions });
    expect(fetchCurrentConditions).toHaveBeenCalledWith(place);
  });

  it('returns an error status when the provider is unavailable', async () => {
    const fetchCurrentConditions = jest.fn().mockRejectedValue(new ProviderUnavailableError());
    await expect(
      getConditions(place, { fetchCurrentConditions, now: () => now }),
    ).resolves.toEqual({ status: 'error' });
  });
});
