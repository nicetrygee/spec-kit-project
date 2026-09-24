import { ageText } from '../../src/core/freshness';

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
