// How old the weather data is, in plain words (FR-010, plan.md D8).

const MINUTE_MS = 60_000;

/**
 * "Updated 12 minutes ago", measured from the provider's own timestamp.
 * A future timestamp (phone clock behind) reads "just now", never a negative age.
 */
export function ageText(observedAt: number, now: number): string {
  const minutes = Math.floor(Math.max(0, now - observedAt) / MINUTE_MS);
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
}
