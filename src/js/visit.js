// Getting Here: map links + hours table, and the mobile sticky action bar.
import { SHOP } from '../data/shop.js';
import { shopNow, hoursText, DAY_NAMES } from '../lib/hours.js';

/** Weekly hours rows with today marked; shared with today.js. */
export function renderHours(body, day = shopNow().day) {
  body.replaceChildren(...DAY_NAMES.map((name, d) => {
    const tr = document.createElement('tr');
    if (d === day) tr.setAttribute('aria-current', 'date');
    tr.innerHTML = '<th scope="row"></th><td></td>';
    tr.cells[0].textContent = d === day ? `${name} (today)` : name;
    tr.cells[1].textContent = hoursText(d);
    return tr;
  }));
}

function initSticky() {
  const bar = document.querySelector('[data-sticky]');
  if (!bar) return;
  bar.querySelector('[data-sticky-directions]')?.setAttribute('href', SHOP.googleMaps);
  const targets = ['visit', 'hold', 'finale'].map((id) => document.getElementById(id)).filter(Boolean);
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const onScreen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
    const hide = onScreen.size > 0;
    bar.classList.toggle('is-hidden', hide);
    bar.inert = hide; // slid away: keep it out of the tab order too
  }, { threshold: 0.15 });
  targets.forEach((t) => io.observe(t));
}

export function init() {
  initSticky();
  const root = document.getElementById('visit');
  if (!root) return;
  root.querySelector('[data-visit-google]')?.setAttribute('href', SHOP.googleMaps);
  root.querySelector('[data-visit-apple]')?.setAttribute('href', SHOP.appleMaps);
  const body = root.querySelector('[data-visit-hours]');
  if (body) {
    renderHours(body);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) renderHours(body); });
  }
}
