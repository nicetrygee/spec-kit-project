import { placeKey, placeLabel, roundCoord } from '../../src/core/coarsen';
import type { Place } from '../../src/core/types';

const richmond: Place = { name: 'Richmond', state: 'Victoria', latitude: -37.81, longitude: 144.96 };

describe('roundCoord', () => {
  it('rounds to 2 decimal places (~1 km)', () => {
    expect(roundCoord(-37.8136)).toBe(-37.81);
    expect(roundCoord(144.9631)).toBe(144.96);
    expect(roundCoord(145.004)).toBe(145);
  });

  it('never returns negative zero', () => {
    expect(Object.is(roundCoord(-0.004), 0)).toBe(true);
  });
});

describe('placeKey', () => {
  it('joins the rounded coordinates', () => {
    expect(placeKey(richmond)).toBe('-37.81,144.96');
  });
});

describe('placeLabel', () => {
  it('shows name and state', () => {
    expect(placeLabel(richmond)).toBe('Richmond, Victoria');
  });

  it('shows just the name when there is no state', () => {
    expect(placeLabel({ ...richmond, state: '' })).toBe('Richmond');
  });
});
