// Pure hours logic. Everything runs in SHOP time (America/Indiana/Indianapolis), so a visitor
// in Tokyo sees the same open/closed state as someone standing on the square.
import { SHOP, HOURS } from '../data/shop.js';

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const fmtCache = {};

/** Day of week (0 = Sunday) and minutes since midnight, in shop-local time. */
export function shopNow(date = new Date(), timeZone = SHOP.timeZone) {
  const f = fmtCache[timeZone] ??= new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  // Some engines report midnight as "24"; % 24 folds it back to 0 on the same weekday.
  return { day: WEEKDAY[p.weekday], minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) };
}

export function isWithinHours(day, minutes) {
  const h = HOURS[day];
  return !!h && minutes >= h.open && minutes < h.close;
}

/** 390 -> "6:30 AM", 1080 -> "6 PM". */
export function formatTime(minutes) {
  const h = Math.floor(minutes / 60) % 24, m = minutes % 60;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "6:30 AM – 6 PM" for a weekday, or "Closed". */
export function hoursText(day) {
  const h = HOURS[day];
  return h ? `${formatTime(h.open)} – ${formatTime(h.close)}` : 'Closed';
}

export function status(date = new Date()) {
  const { day, minutes } = shopNow(date);
  const today = HOURS[day];
  if (isWithinHours(day, minutes)) {
    const left = today.close - minutes;
    return left <= 30
      ? { state: 'closing', text: `Closing soon · ${left} min left`, closesAt: today.close }
      : { state: 'open', text: `Open now · until ${formatTime(today.close)}`, closesAt: today.close };
  }
  // Closed: find the next opening, later today (before open) or on a following day.
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7, h = HOURS[d];
    if (!h || (i === 0 && minutes >= h.open)) continue;
    const when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : DAY_NAMES[d];
    return { state: 'closed', text: `Closed · opens ${formatTime(h.open)} ${when}`, opensAt: { day: d, minutes: h.open, when } };
  }
  return { state: 'closed', text: 'Closed' };
}
