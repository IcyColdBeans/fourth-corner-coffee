// Busy estimator: a hand-authored "typical day" curve, NOT a live count.
import { BUSY, HOURS } from '../data/shop.js';
import { isWithinHours, formatTime } from './hours.js';

export const curveFor = (day) => (day === 0 ? BUSY.sunday : day === 6 ? BUSY.saturday : BUSY.weekday);

/** Busyness 0–1 at a shop-local time, linearly interpolated between the hourly points. */
export function busyAt(day, minutes) {
  if (!isWithinHours(day, minutes)) return 0;
  const c = curveFor(day), h = Math.floor(minutes / 60), t = (minutes % 60) / 60;
  // The hour after close is 0 in the data; hold flat instead of sliding toward "empty".
  const next = c[(h + 1) % 24] || c[h];
  return c[h] + (next - c[h]) * t;
}

export function level(v) {
  return v < 0.3 ? 'Quiet' : v < 0.6 ? 'Steady' : v < 0.85 ? 'Busy' : 'Line out the door';
}

/** The quietest upcoming 15-minute slot later today (ties: earliest), or null if closed / none left. */
export function quietestNext(day, minutes) {
  if (!isWithinHours(day, minutes)) return null;
  let best = null;
  for (let m = (Math.floor(minutes / 15) + 1) * 15; m < HOURS[day].close; m += 15) {
    const v = busyAt(day, m);
    if (!best || v < best.value) best = { minutes: m, value: v, label: formatTime(m) };
  }
  return best;
}
