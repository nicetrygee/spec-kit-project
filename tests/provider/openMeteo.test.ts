import type { Place } from '../../src/core/types';
import {
  InvalidQueryError,
  ProviderUnavailableError,
  WEATHER_ATTRIBUTION,
  fetchCurrentConditions,
  searchPlaces,
} from '../../src/provider';

// A stand-in for the network: each test decides what "the internet" answers.
const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

function answer(body: unknown, ok = true) {
  fetchMock.mockResolvedValueOnce({ ok, json: async () => body });
}

function answerNotJson() {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    },
  });
}

function requestedUrl(): URL {
  return new URL(fetchMock.mock.calls[0][0]);
}

// Never answers until the request is cancelled, like a dead connection.
function hang() {
  fetchMock.mockImplementationOnce(
    (_url: string, init: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  );
}

describe('searchPlaces', () => {
  it('asks for up to 10 Australian places in English', async () => {
    answer({ results: [] });
    await searchPlaces('Richmond');
    const url = requestedUrl();
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
    expect(url.searchParams.get('name')).toBe('Richmond');
    expect(url.searchParams.get('count')).toBe('10');
    expect(url.searchParams.get('language')).toBe('en');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('countryCode')).toBe('AU');
  });

  it('URL-encodes the query', async () => {
    answer({ results: [] });
    await searchPlaces('St. Kilda');
    expect(fetchMock.mock.calls[0][0]).toContain('name=St.%20Kilda');
  });

  it('maps results to Places with rounded coordinates', async () => {
    answer({
      results: [
        { name: 'Richmond', admin1: 'Victoria', latitude: -37.8182, longitude: 144.9984 },
        { name: 'Richmond', latitude: -33.59956, longitude: 150.75142 },
      ],
    });
    await expect(searchPlaces('Richmond')).resolves.toEqual([
      { name: 'Richmond', state: 'Victoria', latitude: -37.82, longitude: 145 },
      { name: 'Richmond', state: '', latitude: -33.6, longitude: 150.75 },
    ]);
  });

  it('returns [] when the provider has no results key', async () => {
    answer({ generationtime_ms: 0.5 });
    await expect(searchPlaces('Zzqxville')).resolves.toEqual([]);
  });

  it('returns at most 10 places', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      name: `Place ${i}`,
      admin1: 'Victoria',
      latitude: -37,
      longitude: 145,
    }));
    answer({ results: many });
    await expect(searchPlaces('Place')).resolves.toHaveLength(10);
  });

  it('rejects invalid input with InvalidQueryError and never calls fetch', async () => {
    await expect(searchPlaces('<script>')).rejects.toBeInstanceOf(InvalidQueryError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the trimmed query', async () => {
    answer({ results: [] });
    await searchPlaces('  Richmond  ');
    expect(requestedUrl().searchParams.get('name')).toBe('Richmond');
  });

  it('fails with ProviderUnavailableError on a non-OK status', async () => {
    answer({}, false);
    await expect(searchPlaces('Richmond')).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('fails with ProviderUnavailableError when the network is down', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(searchPlaces('Richmond')).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('fails with ProviderUnavailableError when the body is not JSON', async () => {
    answerNotJson();
    await expect(searchPlaces('Richmond')).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('gives up after 10 seconds', async () => {
    jest.useFakeTimers();
    try {
      hang();
      const result = searchPlaces('Richmond');
      jest.advanceTimersByTime(10_000);
      await expect(result).rejects.toBeInstanceOf(ProviderUnavailableError);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('fetchCurrentConditions', () => {
  const place: Place = { name: 'Richmond', state: 'Victoria', latitude: -37.8136, longitude: 145.0 };

  const current = {
    time: 1_790_000_000,
    interval: 900,
    temperature_2m: 23.7,
    apparent_temperature: 21.6,
    precipitation_probability: 0,
    weather_code: 3,
    wind_speed_10m: 18.5,
    wind_direction_10m: 358,
  };

  it('asks for the six current values, rounded location, km/h and unix time', async () => {
    answer({ latitude: -37.856, longitude: 145.013, current });
    await fetchCurrentConditions(place);
    const url = requestedUrl();
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('-37.81');
    expect(url.searchParams.get('longitude')).toBe('145');
    expect(url.searchParams.get('current')).toBe(
      'temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m',
    );
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('timeformat')).toBe('unixtime');
  });

  it('maps the answer to CurrentConditions', async () => {
    answer({ latitude: -37.856, longitude: 145.013, current });
    await expect(fetchCurrentConditions(place)).resolves.toEqual({
      temperatureC: 23.7,
      feelsLikeC: 21.6,
      description: 'Overcast',
      rainChancePercent: 0,
      windSpeedKmh: 18.5,
      windDirection: 'N',
      observedAt: 1_790_000_000_000,
      farFromRequest: false,
      source: 'Open-Meteo',
      attribution: WEATHER_ATTRIBUTION,
    });
  });

  it('uses null for any missing value', async () => {
    answer({ latitude: -37.81, longitude: 145, current: { time: 1_790_000_000 } });
    const conditions = await fetchCurrentConditions(place);
    expect(conditions).toMatchObject({
      temperatureC: null,
      feelsLikeC: null,
      description: null,
      rainChancePercent: null,
      windSpeedKmh: null,
      windDirection: null,
    });
  });

  it('flags an answer more than 0.25° from the requested point', async () => {
    answer({ latitude: -37.81, longitude: 145.26, current });
    await expect(fetchCurrentConditions(place)).resolves.toMatchObject({ farFromRequest: true });
  });

  it('does not flag an answer exactly 0.25° away', async () => {
    answer({ latitude: -38.06, longitude: 145, current });
    await expect(fetchCurrentConditions(place)).resolves.toMatchObject({ farFromRequest: false });
  });

  it.each([
    ['no current block', () => answer({ latitude: -37.81, longitude: 145 })],
    ['a non-OK status', () => answer({}, false)],
    ['a network error', () => fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'))],
    ['a body that is not JSON', answerNotJson],
  ])('fails with ProviderUnavailableError on %s', async (_label, arrange) => {
    arrange();
    await expect(fetchCurrentConditions(place)).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('gives up after 10 seconds', async () => {
    jest.useFakeTimers();
    try {
      hang();
      const result = fetchCurrentConditions(place);
      jest.advanceTimersByTime(10_000);
      await expect(result).rejects.toBeInstanceOf(ProviderUnavailableError);
    } finally {
      jest.useRealTimers();
    }
  });
});
