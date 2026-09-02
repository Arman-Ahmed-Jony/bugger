export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;

export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export function formatPlaybackRate(rate: number): string {
  return `${rate}×`;
}

export function stepPlaybackRate(current: number, direction: -1 | 1): PlaybackRate {
  const currentIndex = PLAYBACK_RATES.findIndex((rate) => Math.abs(rate - current) < 0.001);
  const index = currentIndex === -1 ? PLAYBACK_RATES.indexOf(1) : currentIndex;
  const nextIndex = Math.max(0, Math.min(PLAYBACK_RATES.length - 1, index + direction));
  return PLAYBACK_RATES[nextIndex] ?? 1;
}

export function normalizePlaybackRate(rate: number): PlaybackRate {
  return PLAYBACK_RATES.includes(rate as PlaybackRate) ? (rate as PlaybackRate) : 1;
}
