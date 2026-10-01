// Hero: edition eyebrow, pointer-lean headline, lazy WebGL cup.
// The load choreography is pure CSS (hero.css) so it starts on first paint, not after this bundle.
// gsap is only needed for the pointer lean, so it loads after the entrance instead of blocking first paint.
let gsap;
import { reducedMotion, finePointer } from '../lib/motion-pref.js';

const EDITIONS = { morning: 'Morning', midday: 'Afternoon', evening: 'Evening', night: 'Late' };

function setEdition(hero) {
  const el = hero.querySelector('[data-edition]');
  if (el) el.textContent = EDITIONS[document.documentElement.dataset.mood] || 'Morning';
}

// After first paint and when the main thread is idle, so OGL stays off the critical path.
function loadGL(cup, well) {
  const go = () => import('./hero-gl.js')
    .then((m) => m.mount(cup, well))
    .catch(() => {}); // static SVG latte art stays
  requestAnimationFrame(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 });
    else setTimeout(go, 200);
  });
}

// Letters lean away from the pointer. Desktop fine pointers only.
function lean(hero, h1, chars) {
  if (!finePointer() || reducedMotion() || !chars.length) return;
  gsap.set(chars, { transformOrigin: '50% 90%' });
  const setters = chars.map((c) => ({
    x: gsap.quickTo(c, 'x', { duration: 0.6, ease: 'power3' }),
    r: gsap.quickTo(c, 'rotation', { duration: 0.6, ease: 'power3' })
  }));
  let centers = null, px = 0, py = 0, queued = false;
  const measure = () => {
    const hr = h1.getBoundingClientRect();
    centers = chars.map((c) => {
      const r = c.getBoundingClientRect();
      return [r.left + r.width / 2 - hr.left, r.top + r.height / 2 - hr.top];
    });
  };
  const apply = () => {
    queued = false;
    if (!centers) measure();
    const hr = h1.getBoundingClientRect();
    centers.forEach(([cx, cy], i) => {
      const dx = cx + hr.left - px, dy = cy + hr.top - py;
      const dist = Math.hypot(dx, dy) || 1;
      const f = Math.exp(-(dist * dist) / (2 * 160 * 160));
      setters[i].x((dx / dist) * f * 8);
      setters[i].r((dx / dist) * f * 10);
    });
  };
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    px = e.clientX; py = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(apply); }
  });
  hero.addEventListener('pointerleave', () => setters.forEach((s) => { s.x(0); s.r(0); }));
  window.addEventListener('resize', () => { centers = null; });
}

export function init() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  setEdition(hero);
  document.addEventListener('fc:theme-change', () => setEdition(hero));

  const h1 = hero.querySelector('#hero-title');
  const cup = hero.querySelector('[data-cup]');
  const well = hero.querySelector('[data-cup-well]');
  if (cup && well) loadGL(cup, well);
  // Start the lean once the CSS entrance (~1.1s) has released the char transforms.
  if (h1 && finePointer() && !reducedMotion()) setTimeout(async () => {
    ({ gsap } = await import('gsap'));
    lean(hero, h1, [...h1.querySelectorAll('.ch')]);
  }, 1200);
}
