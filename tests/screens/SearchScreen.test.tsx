import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Place } from '../../src/core/types';
import { ProviderUnavailableError } from '../../src/provider';
import { SearchScreen } from '../../src/screens/SearchScreen';

const vic: Place = { name: 'Richmond', state: 'Victoria', latitude: -37.82, longitude: 145 };
const nsw: Place = { name: 'Richmond', state: 'New South Wales', latitude: -33.6, longitude: 150.75 };

async function setup(
  search = jest.fn().mockResolvedValue([vic, nsw]),
  lastViewedPlace: Place | null = null,
) {
  const onSelectPlace = jest.fn();
  await render(
    <SearchScreen search={search} onSelectPlace={onSelectPlace} lastViewedPlace={lastViewedPlace} />,
  );
  return { search, onSelectPlace };
}

async function searchFor(text: string) {
  await fireEvent.changeText(screen.getByLabelText('Place name'), text);
  await fireEvent.press(screen.getByRole('button', { name: 'Search' }));
}

describe('SearchScreen', () => {
  it('shows a heading', async () => {
    await setup();
    expect(screen.getByRole('header', { name: 'Find a place' })).toBeOnTheScreen();
  });

  it('searches and lists results by name and state', async () => {
    const { search } = await setup();
    await searchFor('Richmond');
    expect(search).toHaveBeenCalledWith('Richmond');
    expect(await screen.findByRole('button', { name: 'Richmond, Victoria' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Richmond, New South Wales' })).toBeOnTheScreen();
    expect(screen.getByText('Place data: GeoNames')).toBeOnTheScreen();
  });

  it('submits from the keyboard search key', async () => {
    const { search } = await setup();
    await fireEvent.changeText(screen.getByLabelText('Place name'), 'Richmond');
    await fireEvent(screen.getByLabelText('Place name'), 'submitEditing');
    expect(search).toHaveBeenCalledWith('Richmond');
    await screen.findByRole('button', { name: 'Richmond, Victoria' });
  });

  it('opens the chosen place', async () => {
    const { onSelectPlace } = await setup();
    await searchFor('Richmond');
    await fireEvent.press(await screen.findByRole('button', { name: 'Richmond, New South Wales' }));
    expect(onSelectPlace).toHaveBeenCalledWith(nsw);
  });

  it('does not search invalid input and explains why', async () => {
    const { search } = await setup();
    await searchFor('a');
    expect(screen.getByText('Type at least 2 letters.')).toBeOnTheScreen();
    expect(search).not.toHaveBeenCalled();
  });

  it('explains when search cannot reach the provider', async () => {
    await setup(jest.fn().mockRejectedValue(new ProviderUnavailableError()));
    await searchFor('Richmond');
    expect(
      await screen.findByText(
        'Search needs an internet connection. Check your connection and try again.',
      ),
    ).toBeOnTheScreen();
  });

  it('hides the GeoNames credit when there are no results to credit', async () => {
    await setup();
    expect(screen.queryByText('Place data: GeoNames')).toBeNull();
  });

  describe('last viewed shortcut (US2)', () => {
    const shortcut = 'Last viewed: Richmond, Victoria. Opens its weather.';

    it('opens the last viewed place', async () => {
      const { onSelectPlace } = await setup(undefined, vic);
      expect(screen.getByText('Last viewed: Richmond, Victoria')).toBeOnTheScreen();
      await fireEvent.press(screen.getByRole('button', { name: shortcut }));
      expect(onSelectPlace).toHaveBeenCalledWith(vic);
    });

    it('is not shown when no place was viewed before', async () => {
      await setup();
      expect(screen.queryByRole('button', { name: shortcut })).toBeNull();
    });

    it('points to saved weather when search is offline', async () => {
      await setup(jest.fn().mockRejectedValue(new ProviderUnavailableError()), vic);
      await searchFor('Carlton');
      expect(
        await screen.findByText(
          'Search needs an internet connection. Check your connection and try again. ' +
            'You can still see saved weather for Richmond, Victoria above.',
        ),
      ).toBeOnTheScreen();
    });
  });
});
