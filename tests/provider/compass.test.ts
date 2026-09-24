import { compassToWords, degreesToCompass } from '../../src/provider/compass';

describe('degreesToCompass', () => {
  it.each([
    [0, 'N'],
    [358, 'N'],
    [11.24, 'N'],
    [11.25, 'NNE'],
    [90, 'E'],
    [202.5, 'SSW'],
    [337.5, 'NNW'],
    [360, 'N'],
  ])('%p° is %p', (degrees, expected) => {
    expect(degreesToCompass(degrees)).toBe(expected);
  });

  it('returns null for null', () => {
    expect(degreesToCompass(null)).toBeNull();
  });
});

describe('compassToWords', () => {
  it.each([
    ['N', 'north'],
    ['NNW', 'north-north-west'],
    ['SE', 'south-east'],
    ['WSW', 'west-south-west'],
  ])('%p is spoken as %p', (point, words) => {
    expect(compassToWords(point)).toBe(words);
  });

  it('has words for all 16 points', () => {
    for (let degrees = 0; degrees < 360; degrees += 22.5) {
      const words = compassToWords(degreesToCompass(degrees));
      expect(words).toEqual(expect.any(String));
      expect(words).not.toBe('');
    }
  });

  it('returns null for null', () => {
    expect(compassToWords(null)).toBeNull();
  });
});
