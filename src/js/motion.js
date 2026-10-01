// Global motion: Lenis smooth scroll + ScrollTrigger, reveals, cursor, magnetic buttons,
// finale parallax, scroll progress. Everything motion-y is off under prefers-reduced-motion.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MOTION = '(prefers-reduced-motion: no-preference)';
const FINE = '(pointer: fine) and (prefers-reduced-motion: no-preference)';

let lenis = null;
export const getLenis = () => lenis;

export function init() {
  const mm = gsap.matchMedia();
  mm.add(MOTION, () => {
    const stop = initLenis();
    initReveals();
    initFinale();
    return () => { stop(); lenis?.destroy(); lenis = null; };
  });
  mm.add(FINE, () => { const a = initCursor(); const b = initMagnetic(); return () => { a(); b(); }; });
  mm.add('(prefers-reduced-motion: reduce)', () => document.getElementById('finale')?.classList.add('is-lit'));
  initProgress();
  initAnchors();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

function initLenis() {
  lenis = new Lenis({ autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (t) => lenis?.raf(t * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return () => gsap.ticker.remove(raf);
}

// Anchor links: smooth via Lenis when it exists, native otherwise. Focus always follows.
function initAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    if (lenis) {
      e.preventDefault();
      lenis.scrollTo(target); // Lenis applies the target's CSS scroll-margin-top (header height), so no extra offset
      history.pushState(null, '', '#' + id);
    }
    if (!target.matches('a[href],button,input,select,textarea,[tabindex]')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: !!lenis });
  });
}

function initReveals() {
  const vars = { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08, overwrite: true };
  // motion.js loads after first paint, so skip anything already on or above screen:
  // hiding visible content just to fade it back in would flash.
  const unseen = (el) => el.getBoundingClientRect().top > innerHeight;
  const singles = gsap.utils.toArray('[data-reveal]:not([data-reveal="stagger"])').filter(unseen);
  const groups = gsap.utils.toArray('[data-reveal="stagger"]').filter(unseen);
  // Opacity (not visibility) so screen readers still reach content before it animates.
  gsap.set([...singles, ...groups.flatMap((g) => [...g.children])], { opacity: 0, y: 24 });
  if (singles.length) ScrollTrigger.batch(singles, { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, vars) });
  // Children read at enter time, so JS-rendered children (menu cards etc.) also stagger in.
  if (groups.length) ScrollTrigger.batch(groups, {
    start: 'top 92%', once: true,
    onEnter: (b) => gsap.fromTo(b.flatMap((g) => [...g.children]), { opacity: 0, y: 24 }, vars),
  });
}

function initFinale() {
  const finale = document.getElementById('finale');
  if (!finale) return;
  gsap.utils.toArray('.finale-layer[data-depth]', finale).forEach((el) => {
    const d = parseFloat(el.dataset.depth) || 0;
    gsap.fromTo(el, { yPercent: d * 30 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: finale, start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  });
  ScrollTrigger.create({ trigger: finale, start: 'top 60%', toggleClass: { targets: finale, className: 'is-lit' } });
}

function initProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  const set = gsap.quickSetter(bar, 'scaleX');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => set(self.progress) });
}

const INTERACTIVE = 'a[href],button,[role="button"],label,summary,.chip,[data-cursor],[data-magnetic]';
const TEXTY = 'input:not([type="checkbox"],[type="radio"],[type="range"],[type="button"],[type="submit"],[type="reset"],[type="color"]),textarea,select,[contenteditable="true"]';

function initCursor() {
  const root = document.createElement('div');
  root.className = 'cursor';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<div class="cursor__dot"></div><div class="cursor__follow"><div class="cursor__ring"></div><span class="cursor__label"></span></div>';
  document.body.append(root);
  const [dot, follow] = root.children;
  const label = follow.lastChild;
  const q = (el, p, d) => gsap.quickTo(el, p, { duration: d, ease: 'power3' });
  const dx = q(dot, 'x', 0.1), dy = q(dot, 'y', 0.1), fx = q(follow, 'x', 0.45), fy = q(follow, 'y', 0.45);
  const html = document.documentElement;
  html.classList.add('has-cursor');

  const move = (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!root.classList.contains('is-visible')) gsap.set([dot, follow], { x: e.clientX, y: e.clientY });
    dx(e.clientX); dy(e.clientY); fx(e.clientX); fy(e.clientY);
    root.classList.add('is-visible');
  };
  const over = (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const texty = t.closest(TEXTY);
    const hit = !texty && t.closest(INTERACTIVE);
    const text = (hit && hit.getAttribute('data-cursor')) || '';
    root.classList.toggle('is-hidden', !!texty);
    root.classList.toggle('is-hover', !!hit);
    root.classList.toggle('has-label', !!text);
    label.textContent = text;
  };
  const out = (e) => { if (!e.relatedTarget) root.classList.remove('is-visible'); };
  window.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', over);
  document.addEventListener('pointerout', out);
  return () => {
    window.removeEventListener('pointermove', move);
    document.removeEventListener('pointerover', over);
    document.removeEventListener('pointerout', out);
    root.remove();
    html.classList.remove('has-cursor');
  };
}

// Delegated, so buttons rendered later by other modules still get the effect.
function initMagnetic() {
  const MAX = 10;
  let el = null, cx = 0, cy = 0, w = 1, h = 1, qx, qy;
  const release = () => {
    if (el) gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: true });
    el = null;
  };
  const over = (e) => {
    const m = e.target.closest?.('[data-magnetic]');
    if (!m || m === el) return;
    release();
    el = m;
    const r = m.getBoundingClientRect();
    w = r.width / 2; h = r.height / 2;
    cx = r.left + w - gsap.getProperty(m, 'x');
    cy = r.top + h - gsap.getProperty(m, 'y');
    qx = gsap.quickTo(m, 'x', { duration: 0.4, ease: 'power3' });
    qy = gsap.quickTo(m, 'y', { duration: 0.4, ease: 'power3' });
  };
  const move = (e) => {
    if (!el) return;
    qx(gsap.utils.clamp(-1, 1, (e.clientX - cx) / w) * MAX);
    qy(gsap.utils.clamp(-1, 1, (e.clientY - cy) / h) * MAX);
  };
  const out = (e) => { if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) release(); };
  document.documentElement.classList.add('has-magnetic');
  document.addEventListener('pointerover', over);
  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerout', out);
  return () => {
    release();
    document.documentElement.classList.remove('has-magnetic');
    document.removeEventListener('pointerover', over);
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerout', out);
  };
}
