// Barista's Pick: the same drink for every visitor on a given shop-local day.
import { SHOP } from '../data/shop.js';

/** FNV-1a 32-bit string hash: tiny, deterministic, well spread for short keys. */
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Excludes the anchor (the $14 flight). */
export function baristaPick(dateKey, drinks) {
  const pool = drinks.filter((d) => !d.anchor);
  return pool.length ? pool[fnv1a(dateKey) % pool.length] : null;
}

/** 'YYYY-MM-DD' in shop time. */
export function shopDateKey(date = new Date(), timeZone = SHOP.timeZone) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
