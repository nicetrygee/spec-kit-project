// Wind direction: degrees → compass point → spoken words.

const POINTS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;

const WORDS: Record<string, string> = {
  N: 'north',
  NNE: 'north-north-east',
  NE: 'north-east',
  ENE: 'east-north-east',
  E: 'east',
  ESE: 'east-south-east',
  SE: 'south-east',
  SSE: 'south-south-east',
  S: 'south',
  SSW: 'south-south-west',
  SW: 'south-west',
  WSW: 'west-south-west',
  W: 'west',
  WNW: 'west-north-west',
  NW: 'north-west',
  NNW: 'north-north-west',
};

/** 0–360 degrees → 16-point compass, e.g. 337.5 → "NNW". Each point covers 22.5°. */
export function degreesToCompass(degrees: number | null): string | null {
  if (degrees === null) return null;
  const normalised = ((degrees % 360) + 360) % 360;
  return POINTS[Math.round(normalised / 22.5) % 16];
}

/** "NNW" → "north-north-west", for screen readers. */
export function compassToWords(point: string | null): string | null {
  if (point === null) return null;
  return WORDS[point] ?? null;
}
