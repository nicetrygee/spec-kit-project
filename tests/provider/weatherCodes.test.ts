import { describeWeatherCode } from '../../src/provider/weatherCodes';

const ALL_WMO_CODES = [
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
  95, 96, 99,
];

describe('describeWeatherCode', () => {
  it.each([
    [0, 'Clear sky'],
    [3, 'Overcast'],
    [61, 'Light rain'],
    [95, 'Thunderstorm'],
  ])('code %p is %p', (code, text) => {
    expect(describeWeatherCode(code)).toBe(text);
  });

  it('returns null for an unknown code', () => {
    expect(describeWeatherCode(42)).toBeNull();
  });

  it('returns null for null', () => {
    expect(describeWeatherCode(null)).toBeNull();
  });

  it.each(ALL_WMO_CODES)('code %p has a description', (code) => {
    expect(describeWeatherCode(code)).toMatch(/\S/);
  });
});
