// Easter egg: type "sousa" (outside form fields) or tap the logo 5 times within 3s.
// A marching band of coffee beans crosses the bottom of the screen, plus a polite toast.
import { reducedMotion } from '../lib/motion-pref.js';

const WORD = 'sousa';
const MSG = 'Mags would be proud. Band kids get a free sticker at the counter (the sticker is fictional too).';

// A bean with a tiny shako (band hat). currentColor so it follows the theme.
const BEAN = `<svg viewBox="0 0 36 48" aria-hidden="true" focusable="false">
  <rect x="11" y="2" width="14" height="11" rx="2" fill="currentColor"/>
  <rect x="9" y="12" width="18" height="3" rx="1.5" fill="var(--brass)"/>
  <path d="M18 2 v-2" stroke="var(--brass)" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="18" cy="31" rx="11" ry="15" fill="var(--accent)"/>
  <path d="M18 17 C 12 25, 24 37, 18 46" stroke="var(--bg)" stroke-width="2" fill="none"/>
</svg>`;

let toast, band, toastTimer;

function play() {
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'fc-toast';
    toast.setAttribute('role', 'status'); // implicit aria-live="polite"; never takes focus
    document.body.append(toast);
  }
  toast.textContent = '';
  requestAnimationFrame(() => { toast.textContent = MSG; });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.textContent = ''; }, 6000);

  if (reducedMotion() || band) return;
  band = document.createElement('div');
  band.className = 'fc-band';
  band.setAttribute('aria-hidden', 'true');
  band.innerHTML = BEAN.repeat(8);
  document.body.append(band);
  band.addEventListener('animationend', (e) => {
    if (e.target === band) { band.remove(); band = null; }
  });
}

const typing = (el) => el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export function init() {
  let buf = '';
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || typing(document.activeElement)) return;
    buf = (buf + e.key.toLowerCase()).slice(-WORD.length);
    if (buf === WORD) { buf = ''; play(); }
  });

  const logo = document.querySelector('[data-logo]') || document.querySelector('.site-header a[aria-label]');
  if (!logo) return;
  let taps = [];
  logo.addEventListener('click', () => {
    const now = Date.now();
    taps = [...taps.filter((t) => now - t < 3000), now];
    if (taps.length >= 5) { taps = []; play(); }
  });
}
