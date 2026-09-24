import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { ConditionsResult } from '../../src/core/getConditions';
import type { CurrentConditions, Place } from '../../src/core/types';
import { ConditionsScreen } from '../../src/screens/ConditionsScreen';

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

async function setup(...results: ConditionsResult[]) {
  const getConditions = jest.fn();
  for (const result of results) getConditions.mockResolvedValueOnce(result);
  const onBack = jest.fn();
  await render(
    <ConditionsScreen place={place} getConditions={getConditions} now={() => now} onBack={onBack} />,
  );
  return { getConditions, onBack };
}

describe('ConditionsScreen', () => {
  it('names the place in a heading', async () => {
    await setup({ status: 'fresh', conditions });
    expect(screen.getByRole('header', { name: 'Richmond, Victoria' })).toBeOnTheScreen();
    await screen.findByText('Overcast');
  });

  it('shows static loading text while waiting', async () => {
    // Hold the answer back so the loading state stays on screen.
    let answer!: (result: ConditionsResult) => void;
    const pending = new Promise<ConditionsResult>((resolve) => (answer = resolve));
    await render(
      <ConditionsScreen place={place} getConditions={() => pending} now={() => now} onBack={jest.fn()} />,
    );
    expect(screen.getByText('Loading weather…')).toBeOnTheScreen();
    await act(async () => answer({ status: 'fresh', conditions }));
    expect(await screen.findByText('Overcast')).toBeOnTheScreen();
    expect(screen.queryByText('Loading weather…')).toBeNull();
  });

  it('shows every value with matching screen-reader labels', async () => {
    await setup({ status: 'fresh', conditions });
    expect(await screen.findByText('Overcast')).toBeOnTheScreen();
    expect(screen.getByLabelText('Temperature 24 degrees')).toHaveTextContent('24°');
    expect(screen.getByLabelText('Feels like 22 degrees')).toHaveTextContent('Feels like 22°');
    expect(screen.getByLabelText('Chance of rain 0 percent')).toHaveTextContent('Rain: 0%');
    expect(screen.getByLabelText('Wind 19 kilometres per hour from the north')).toHaveTextContent(
      'Wind: 19 km/h N',
    );
    expect(screen.getByText('Updated 5 minutes ago')).toBeOnTheScreen();
    expect(
      screen.getByText('Source: Open-Meteo · Weather data by Open-Meteo.com'),
    ).toBeOnTheScreen();
  });

  it('shows "Not available" for missing values', async () => {
    await setup({ status: 'fresh', conditions: { ...conditions, description: null, rainChancePercent: null } });
    expect(await screen.findByText('Not available')).toBeOnTheScreen();
    expect(screen.getByText('Rain: Not available')).toBeOnTheScreen();
  });

  it('warns when the answer is far from the requested place', async () => {
    await setup({ status: 'fresh', conditions: { ...conditions, farFromRequest: true } });
    expect(await screen.findByText('This weather may be out of date.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Warning')).toBeOnTheScreen();
  });

  it('shows no warning for normal data', async () => {
    await setup({ status: 'fresh', conditions });
    await screen.findByText('Overcast');
    expect(screen.queryByText('This weather may be out of date.')).toBeNull();
  });

  it('explains an error and lets the user try again', async () => {
    const { getConditions } = await setup({ status: 'error' }, { status: 'fresh', conditions });
    expect(
      await screen.findByText(
        "We couldn't get the weather for Richmond, Victoria. Check your internet connection and try again.",
      ),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Overcast')).toBeOnTheScreen();
    expect(getConditions).toHaveBeenCalledTimes(2);
  });

  it('goes back to search', async () => {
    const { onBack } = await setup({ status: 'fresh', conditions });
    await screen.findByText('Overcast');
    await fireEvent.press(screen.getByRole('button', { name: 'Back to search' }));
    expect(onBack).toHaveBeenCalled();
  });
});
