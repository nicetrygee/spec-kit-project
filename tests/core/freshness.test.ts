import { ageText, isReusable, isStale } from '../../src/core/freshness';

const MINUTE = 60_000;
const now = Date.UTC(2026, 8, 24, 12, 0);

describe('ageText', () => {
  it.each([
    [30_000, 'Updated just now'],
    [MINUTE, 'Updated 1 minute ago'],
    [12 * MINUTE, 'Updated 12 minutes ago'],
    [60 * MINUTE, 'Updated 1 hour ago'],
    [150 * MINUTE, 'Updated 2 hours ago'],
  ])('%p ms old reads %p', (age, text) => {
    expect(ageText(now - age, now)).toBe(text);
  });

  it('never shows a negative age when the phone clock is behind', () => {
    expect(ageText(now + 5 * MINUTE, now)).toBe('Updated just now');
  });
});

describe('isReusable (FR-012: less than 30 minutes old)', () => {
  it('is true at 29 min 59 s', () => {
    expect(isReusable(now - (30 * MINUTE - 1000), now)).toBe(true);
  });

  it('is false at exactly 30 min', () => {
    expect(isReusable(now - 30 * MINUTE, now)).toBe(false);
  });
});

describe('isStale (FR-014: older than 3 hours)', () => {
  it('is false at exactly 3 h', () => {
    expect(isStale(now - 180 * MINUTE, now)).toBe(false);
  });

  it('is true at 3 h + 1 ms', () => {
    expect(isStale(now - 180 * MINUTE - 1, now)).toBe(true);
  });
});
