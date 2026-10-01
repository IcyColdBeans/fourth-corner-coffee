// Menu: renders cards from MENU (replacing the no-JS list), filter chips with Flip,
// flavor previews, "Hold this one", and "Surprise me".
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { MENU, FLAVOR_DIMS } from '../data/menu.js';
import { reducedMotion } from '../lib/motion-pref.js';
import * as motion from './motion.js';

gsap.registerPlugin(Flip);

const PAIRS = {
  'sugar-cream-bar': ['espresso', 'drip'],
  'early-docket': ['drip', 'cortado'],
  'cheddar-scone': ['white-river-cold-brew', 'cappuccino']
};
const byId = Object.fromEntries(MENU.map((m) => [m.id, m]));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const BADGE = {
  signature: '<span class="badge badge--sig"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="9" y="1.5" width="5.5" height="5.5" style="fill:var(--brass)"/></svg>Signature</span>',
  seasonal: '<span class="badge badge--season"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 13C3 7 7 3 13 3c0 6-4 10-10 10Zm0 0 6-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Seasonal</span>'
};
const CUP = '<svg class="cup" viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><path class="cup__steam" d="M18 14c-2-3 2-4 0-8M26 14c-2-3 2-4 0-8" fill="none" style="stroke:var(--brass)" stroke-width="2" stroke-linecap="round"/><path d="M9 18h25v9a11 11 0 0 1-11 11h-3A11 11 0 0 1 9 27z" fill="currentColor"/><path d="M34 21h3a4 4 0 0 1 0 8h-3" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="5" y="40" width="33" height="2.5" rx="1.25" fill="currentColor"/></svg>';

// Scroll helper shared with quiz.js: Lenis if motion.js exposes it, else native.
export function scrollToTarget(el) {
  if (!el) return;
  const lenis = motion.getLenis?.();
  if (lenis) lenis.scrollTo(el);
  else el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

export function holdDrink(id, name, custom = '') {
  document.dispatchEvent(new CustomEvent('fc:drink-chosen', { detail: { id, name, custom } }));
  scrollToTarget(document.getElementById('hold'));
}

function preview(m) {
  if (!m.vector) {
    const names = (PAIRS[m.id] || []).map((id) => byId[id]?.name).filter(Boolean);
    return `<p class="mcard__pairs"><span class="mcard__label">Pairs with</span> ${esc(names.join(' or '))}</p>`;
  }
  const bars = FLAVOR_DIMS.map((d, i) => {
    const v = Math.round(m.vector[i] * 10);
    return `<li><span class="mcard__dim">${d}</span><span class="mcard__track" aria-hidden="true"><span class="mcard__bar" style="--v:${m.vector[i]};--i:${i}"></span></span><span class="visually-hidden">${v} of 10</span></li>`;
  }).join('');
  return `<div class="mcard__profile">${CUP}<ul class="mcard__bars" aria-label="Flavor profile">${bars}</ul></div>`;
}

function card(m) {
  const sig = m.tags.includes('signature');
  const badges = m.tags.filter((t) => BADGE[t]).map((t) => BADGE[t]).join('');
  const isDrink = !!m.vector && !m.anchor;
  return `<li class="mcard card${sig ? ' mcard--sig' : ''}${m.anchor ? ' mcard--anchor' : ''}" data-id="${m.id}" data-tags="${m.tags.join(' ')}"${isDrink ? ' data-drink' : ''} tabindex="-1">
    ${m.anchor ? '<p class="mcard__kicker">For the ceremonious</p>' : ''}
    <div class="mcard__top"><h3 class="mcard__name">${esc(m.name)}</h3><span class="mcard__price">$${m.price.toFixed(2)}</span></div>
    ${badges ? `<div class="mcard__badges">${badges}</div>` : ''}
    <p class="mcard__note">${esc(m.note)}</p>
    <div class="mcard__preview" id="pv-${m.id}"><div>${preview(m)}</div></div>
    <div class="mcard__actions">
      <button type="button" class="mcard__toggle" aria-expanded="false" aria-controls="pv-${m.id}">${m.vector ? 'Flavor profile' : 'Pairings'}</button>
      ${m.vector ? `<button type="button" class="mcard__hold" data-hold>Hold this one</button>` : ''}
    </div>
  </li>`;
}

export function init() {
  const root = document.getElementById('menu');
  const grid = root?.querySelector('[data-menu-grid]');
  if (!grid) return;
  const tools = root.querySelector('[data-menu-tools]');
  const count = root.querySelector('[data-menu-count]');

  grid.innerHTML = `<ul class="menu__grid" role="list">${MENU.map(card).join('')}</ul>`;
  if (tools) tools.hidden = false;
  const cards = [...grid.querySelectorAll('.mcard')];

  grid.addEventListener('click', (e) => {
    const c = e.target.closest('.mcard');
    if (!c) return;
    if (e.target.closest('[data-hold]')) {
      const m = byId[c.dataset.id];
      return holdDrink(m.id, m.name);
    }
    // Toggle button, or a tap anywhere else on the card (touch has no hover).
    if (e.target.closest('button') && !e.target.closest('.mcard__toggle')) return;
    const t = c.querySelector('.mcard__toggle');
    const open = t.getAttribute('aria-expanded') !== 'true';
    t.setAttribute('aria-expanded', String(open));
    c.classList.toggle('is-open', open);
  });

  // Filters
  const chips = [...(tools?.querySelectorAll('.chip') || [])];
  const apply = (filter) => {
    chips.forEach((ch) => ch.setAttribute('aria-pressed', String(ch.dataset.filter === filter)));
    const state = reducedMotion() ? null : Flip.getState(cards);
    let n = 0;
    cards.forEach((c) => {
      const show = filter === 'all' || c.dataset.tags.split(' ').includes(filter);
      c.hidden = !show;
      n += show;
    });
    if (count) count.textContent = `${n} ${n === 1 ? 'item' : 'items'}`;
    if (state) Flip.from(state, {
      duration: .5, ease: 'power2.inOut', absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .4 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: .94, duration: .3 })
    });
  };
  chips.forEach((ch) => ch.addEventListener('click', () => apply(ch.dataset.filter)));

  // Surprise me: slot-machine highlight that decelerates onto a random drink (never flight/food).
  const surprise = tools?.querySelector('[data-surprise]');
  let spinning = false;
  surprise?.addEventListener('click', () => {
    if (spinning) return;
    let pool = cards.filter((c) => c.hasAttribute('data-drink') && !c.hidden);
    if (!pool.length) { apply('all'); pool = cards.filter((c) => c.hasAttribute('data-drink')); }
    const target = pool[Math.floor(Math.random() * pool.length)];
    const land = () => {
      cards.forEach((c) => c.classList.remove('is-lit'));
      target.classList.add('is-picked');
      setTimeout(() => target.classList.remove('is-picked'), 2400);
      target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
      target.focus({ preventScroll: true });
      if (count) count.textContent = `Surprise: ${byId[target.dataset.id].name}`;
    };
    if (reducedMotion() || pool.length < 2) return land();
    spinning = true;
    // 12 hops with growing delays (30ms + 9ms*i) ≈ 0.95s total, an ease-out stop.
    const steps = 12;
    const start = Math.floor(Math.random() * pool.length);
    const offset = pool.indexOf(target) - (start + steps - 1);
    let i = 0;
    const hop = () => {
      cards.forEach((c) => c.classList.remove('is-lit'));
      if (i === steps) { spinning = false; return land(); }
      const idx = ((start + i + (i === steps - 1 ? offset : 0)) % pool.length + pool.length) % pool.length;
      pool[idx].classList.add('is-lit');
      setTimeout(hop, 30 + 9 * i++);
    };
    hop();
  });
}
