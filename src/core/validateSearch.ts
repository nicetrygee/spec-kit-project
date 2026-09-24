// Checks what the user typed before it goes anywhere (FR-002, Principle IX).

export const SEARCH_MESSAGES = {
  empty: 'Type the name of a suburb or town to search.',
  tooShort: 'Type at least 2 letters.',
  tooLong: "That's too long for a place name. Use 100 characters or fewer.",
  badCharacters:
    'Place names can only contain letters, spaces, hyphens, apostrophes, full stops and commas.',
} as const;

const MIN_LENGTH = 2;
const MAX_LENGTH = 100;

// Letters in any alphabet (\p{L}), a plain space (not \s, so tabs and
// newlines are rejected), straight and curly apostrophes, full stop, comma, hyphen.
const ALLOWED = /^[\p{L} '’.,-]+$/u;
const HAS_LETTER = /\p{L}/u;

export type SearchValidation = { ok: true; query: string } | { ok: false; message: string };

export function validateSearch(input: string): SearchValidation {
  const query = input.trim();

  if (query.length === 0) return { ok: false, message: SEARCH_MESSAGES.empty };
  if (query.length < MIN_LENGTH) return { ok: false, message: SEARCH_MESSAGES.tooShort };
  if (query.length > MAX_LENGTH) return { ok: false, message: SEARCH_MESSAGES.tooLong };
  if (!ALLOWED.test(query)) return { ok: false, message: SEARCH_MESSAGES.badCharacters };
  // Only punctuation (e.g. "--") can't be a place name.
  if (!HAS_LETTER.test(query)) return { ok: false, message: SEARCH_MESSAGES.empty };

  return { ok: true, query };
}
