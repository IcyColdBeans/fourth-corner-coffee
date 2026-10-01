// Punch card: endowed progress (starts at 2/10), email "join", then goal-gradient copy.
// Entirely client-side. Stored as { joined, punches } in localStorage 'fc.punch.v1'.
import { reducedMotion } from '../lib/motion-pref.js';

const KEY = 'fc.punch.v1';
const TOTAL = 10;

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* not remembered, still works */ } };

function progressText(p) {
  const left = TOTAL - p;
  if (left <= 0) return 'Free drink earned. Tell the barista what you want; the card does the talking.';
  if (left === 1) return 'One to go. Theo is warming up the good mug.';
  if (left === 2) return 'Two to go. Practically a regular.';
  if (left <= 4) return `${left} to go. You can see the counter from here.`;
  if (p === 0) return 'Fresh card, ten to go. Same corner.';
  return `${left} to go. Momentum looks good on you.`;
}

// Paper-chad pop: a few tiny circles burst out of the new hole.
function burst(slot) {
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('span');
    c.className = 'punch-chad';
    const a = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
    const d = 26 + Math.random() * 22;
    c.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    c.style.setProperty('--dy', `${Math.sin(a) * d + 18}px`);
    slot.append(c);
    setTimeout(() => c.remove(), 800);
  }
}

export function init() {
  const root = document.getElementById('punch');
  const card = root?.querySelector('[data-punch-card]');
  const slots = root ? [...root.querySelectorAll('.punch-slot')] : [];
  if (!card || slots.length !== TOTAL) return;
  const form = root.querySelector('[data-punch-form]');
  const email = root.querySelector('#punch-email');
  const err = root.querySelector('#punch-email-err');
  const joined = root.querySelector('[data-punch-joined]');
  const progress = root.querySelector('[data-punch-progress]');
  const add = root.querySelector('[data-punch-add]');
  const reset = root.querySelector('[data-punch-reset]');
  const intro = root.querySelector('[data-punch-intro]');

  let state = load() || { joined: false, punches: 2 };

  const render = (animateIndex = -1) => {
    const p = Math.max(0, Math.min(TOTAL, state.punches | 0));
    slots.forEach((s, i) => s.classList.toggle('is-punched', i < p));
    card.setAttribute('aria-label', `${p} of ${TOTAL} punches`);
    card.classList.toggle('is-complete', p >= TOTAL);
    if (form) form.hidden = state.joined;
    if (joined) joined.hidden = !state.joined;
    if (state.joined && intro) intro.textContent = "You're on the card. Every visit is one more punch.";
    if (progress && state.joined) progress.textContent = progressText(p);
    if (add) add.hidden = p >= TOTAL;
    if (reset) reset.hidden = p < TOTAL;

    if (animateIndex >= 0 && !reducedMotion()) {
      const slot = slots[animateIndex];
      slot.classList.remove('is-new');
      void slot.offsetWidth; // restart the keyframes
      slot.classList.add('is-new');
      burst(slot);
      card.classList.remove('is-bump');
      void card.offsetWidth;
      card.classList.add('is-bump');
    }
  };

  const punch = () => {
    state = { ...state, punches: Math.min(TOTAL, state.punches + 1) };
    save(state);
    render(state.punches - 1);
  };

  const validate = () => {
    if (!email || !err) return true;
    const v = email.value.trim();
    const msg = !v ? 'We need an email to put your name on the card.'
      : !email.checkValidity() ? "That email looks like it's missing a piece. Try name@example.com." : '';
    err.textContent = msg;
    err.hidden = !msg;
    email.setAttribute('aria-invalid', String(!!msg));
    return !msg;
  };

  email?.addEventListener('blur', () => { if (email.value || email.getAttribute('aria-invalid') === 'true') validate(); });
  email?.addEventListener('input', () => { if (email.getAttribute('aria-invalid') === 'true') validate(); });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) { email?.focus(); return; }
    state = { joined: true, punches: Math.max(2, state.punches) };
    punch();
    progress?.setAttribute('tabindex', '-1');
    progress?.focus({ preventScroll: true }); // the form just disappeared; keep focus somewhere sensible
  });

  add?.addEventListener('click', () => {
    punch();
    if (state.punches >= TOTAL) reset?.focus();
  });
  reset?.addEventListener('click', () => {
    state = { joined: true, punches: 0 };
    save(state);
    render();
    add?.focus();
  });

  render();
}
