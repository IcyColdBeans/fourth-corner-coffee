// "Today on the square": live open status, busy estimate, Barista's Pick.
// Also fills every [data-open-status] on the page (hero badge, header, footer).
import { HOURS } from '../data/shop.js';
import { DRINKS } from '../data/menu.js';
import { status, shopNow, formatTime, hoursText, DAY_NAMES } from '../lib/hours.js';
import { busyAt, level, quietestNext } from '../lib/busy.js';
import { baristaPick, shopDateKey } from '../lib/pick.js';
import { renderHours } from './visit.js';

// One per weekday (index = shop day), so the reason rotates with the week.
const QUIPS = [
  'Sunday rule: nothing that requires a decision before 10.',
  "Mondays deserve a head start. Theo won't say more.",
  'Tuesday is roast day, and this is what the back room smelled like.',
  "Midweek, the square needs something steady. This is steady.",
  'Theo tasted it twice to be sure. Then a third time for the record.',
  'Friday calls for a drink that has earned the weekend.',
  "The brass trio's order, more or less. Tempo not included."
];

const $ = (root, sel) => root?.querySelector(sel);
const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
const NS = 'http://www.w3.org/2000/svg';

function heading(st, minutes) {
  if (st.state === 'closed') return st.opensAt?.when === 'today' ? "Here's the day, before it starts" : "Here's how the day went";
  return minutes < 11 * 60 ? "Here's the morning so far" : minutes < 17 * 60 ? "Here's the day so far" : "Here's the evening so far";
}

function drawChart(svg, day, minutes, isOpen) {
  const { open, close } = HOURS[day];
  const span = close - open, n = 24, W = 240, base = 70, H = 52, slot = W / n;
  const nowIdx = isOpen ? Math.min(n - 1, Math.floor(((minutes - open) / span) * n)) : -1;
  svg.replaceChildren();
  let peak = { v: -1, t: open };
  for (let i = 0; i < n; i++) {
    const t = open + ((i + 0.5) * span) / n, v = busyAt(day, Math.round(t));
    if (v > peak.v) peak = { v, t };
    const h = Math.max(3, v * H);
    const r = document.createElementNS(NS, 'rect');
    Object.entries({ x: i * slot + 1.5, y: base - h, width: slot - 3, height: h, rx: 2 })
      .forEach(([k, val]) => r.setAttribute(k, val.toFixed(1)));
    r.setAttribute('class', i === nowIdx ? 'bar is-now' : i < nowIdx ? 'bar is-past' : 'bar');
    svg.append(r);
  }
  if (nowIdx >= 0) {
    // Non-color cue: a triangle + "now" text above the current bar.
    const cx = nowIdx * slot + slot / 2;
    const tri = document.createElementNS(NS, 'path');
    tri.setAttribute('d', `M${cx - 4} ${base + 5} L${cx + 4} ${base + 5} L${cx} ${base + 1} Z`);
    tri.setAttribute('class', 'now-mark');
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', Math.min(W - 12, Math.max(12, cx)).toFixed(1));
    label.setAttribute('y', (base + 14).toFixed(1));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'now-label');
    label.textContent = 'now';
    svg.append(tri, label);
  }
  const nowText = isOpen ? ` Right now: ${level(busyAt(day, minutes))}.` : '';
  svg.setAttribute('aria-label',
    `Bar chart of estimated busyness today, ${formatTime(open)} to ${formatTime(close)}. ` +
    `Busiest around ${formatTime(Math.round(peak.t / 15) * 15)}.${nowText}`);
}

export function init() {
  const root = document.getElementById('today');
  let lastKey = '';

  const render = () => {
    const now = new Date();
    const st = status(now);
    const { day, minutes } = shopNow(now);

    document.querySelectorAll('[data-open-status]').forEach((el) => {
      setText(el, st.text);
      el.dataset.state = st.state;
    });
    if (!root) return;

    setText($(root, '[data-today-title]'), heading(st, minutes));
    setText($(root, '[data-today-hours]'), `Today, ${DAY_NAMES[day]}: ${hoursText(day)}`);

    const body = $(root, '[data-hours-body]');
    if (body) renderHours(body, day);

    const isOpen = st.state !== 'closed';
    const v = busyAt(day, minutes);
    setText($(root, '[data-busy-level]'), isOpen ? level(v) : 'Closed, so: very quiet');
    const svg = $(root, '[data-busy-chart]');
    if (svg) drawChart(svg, day, minutes, isOpen);
    setText($(root, '[data-busy-open]'), formatTime(HOURS[day].open));
    setText($(root, '[data-busy-close]'), formatTime(HOURS[day].close));
    const q = quietestNext(day, minutes);
    setText($(root, '[data-busy-quiet]'),
      q ? `Quietest next: ${q.label}` : isOpen ? 'Quietest next: right about closing time' : `Back ${st.opensAt ? `at ${formatTime(st.opensAt.minutes)} ${st.opensAt.when}` : 'soon'}.`);

    // The pick only changes at shop-local midnight.
    const key = shopDateKey(now);
    if (key !== lastKey) {
      lastKey = key;
      const pick = baristaPick(key, DRINKS);
      if (pick) {
        setText($(root, '[data-pick-name]'), pick.name);
        setText($(root, '[data-pick-note]'), pick.note);
        setText($(root, '[data-pick-price]'), `$${pick.price.toFixed(2)}`);
        setText($(root, '[data-pick-why]'), `Why Theo picked it: ${QUIPS[day]}`);
      }
    }
  };

  render();
  // Re-render just after each minute boundary, so "closing soon" never lags up to 59s behind.
  const tick = () => setTimeout(() => { render(); tick(); }, 60_000 - (Date.now() % 60_000) + 50);
  tick();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
}
