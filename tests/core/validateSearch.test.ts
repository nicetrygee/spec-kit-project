import { SEARCH_MESSAGES, validateSearch } from '../../src/core/validateSearch';

describe('validateSearch', () => {
  it('trims the input', () => {
    expect(validateSearch('  Richmond  ')).toEqual({ ok: true, query: 'Richmond' });
  });

  it.each([
    'Richmond',
    "O'Connor",
    'O’Connor',
    'Wagga Wagga',
    'St. Kilda',
    'Mount Isa',
    'Coffs Harbour, NSW',
    'Café',
  ])('accepts %p', (input) => {
    expect(validateSearch(input)).toEqual({ ok: true, query: input });
  });

  it.each(['', '   '])('rejects empty input %p', (input) => {
    expect(validateSearch(input)).toEqual({ ok: false, message: SEARCH_MESSAGES.empty });
  });

  it('rejects a single character', () => {
    expect(validateSearch('a')).toEqual({ ok: false, message: SEARCH_MESSAGES.tooShort });
  });

  it('rejects more than 100 characters', () => {
    expect(validateSearch('a'.repeat(101))).toEqual({ ok: false, message: SEARCH_MESSAGES.tooLong });
    expect(validateSearch('a'.repeat(100)).ok).toBe(true);
  });

  it.each(['<script>', 'Richmond!', '3000', '😀'])('rejects bad characters in %p', (input) => {
    expect(validateSearch(input)).toEqual({ ok: false, message: SEARCH_MESSAGES.badCharacters });
  });

  it.each(['--', "'."])('rejects %p because it has no letters', (input) => {
    expect(validateSearch(input)).toEqual({ ok: false, message: SEARCH_MESSAGES.empty });
  });

  it('uses the exact wording from contracts/screens.md', () => {
    expect(SEARCH_MESSAGES).toEqual({
      empty: 'Type the name of a suburb or town to search.',
      tooShort: 'Type at least 2 letters.',
      tooLong: "That's too long for a place name. Use 100 characters or fewer.",
      badCharacters:
        'Place names can only contain letters, spaces, hyphens, apostrophes, full stops and commas.',
    });
  });
});
