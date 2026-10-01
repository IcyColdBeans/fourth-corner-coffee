// Match quiz: one-question stepper over a real <form>, cosine match, newspaper "stamp" reveal,
// bean confetti, flavor chart, and the "Make it yours" builder.
import { gsap } from 'gsap';
import { DRINKS, FLAVOR_DIMS } from '../data/menu.js';
import { QUESTIONS, buildPreference, rankDrinks, why } from '../lib/match.js';
import { reducedMotion } from '../lib/motion-pref.js';
import { holdDrink, scrollToTarget } from './menu.js';

const KEY = 'fc.quiz.v1';
const BLURB = {
  'fourth-corner': 'Sweet, steady, and good on a bench. You are the corner people stop at.',
  'orchard-band': 'You chase the season and ask for extra cinnamon without apology.',
  'courthouse-clock': 'Punctual, a little bitter, secretly citrusy. The town sets its watch by you.',
  'white-river-cold-brew': 'Unhurried and smooth. You get there eventually, on your own terms.',
  drip: 'No fuss, all refills. The backbone of the square.',
  espresso: 'Short, intense, and finished before the others find a table.',
  cortado: 'Balanced to a fault. You would make an excellent town council chair.',
  cappuccino: 'Good posture, dry wit, foam mustache only in private.',
  'saturday-mocha': 'You treat every weekend like a parade, and the parade agrees.',
  'porch-swing-chai': 'Warm, spiced, and in no rush to go inside.',
  'ethiopia-pour-over': 'Bright and curious. You read the tasting notes out loud.',
  'jv-steamer': 'Sweet, soft, and fully foam-mustached. No shame in it.'
};
const MILK = { whole: 'whole milk', oat: 'oat', none: 'no milk' };
const SWEET = ['unsweetened', 'half sweet', 'full sweet'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const withArticle = (n) => (n.startsWith('The ') ? n : (/^[AEIOU]/.test(n) ? 'an ' : 'a ') + n);
const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } }
};

// Horizontal paired bars: outlined = you, solid = the drink. Shape differs, not just color.
function chart(pref, drink) {
  const max = Math.max(...pref) || 1;
  const you = pref.map((v) => v / max);
  const rows = FLAVOR_DIMS.map((d, i) => {
    const y = i * 32;
    return `<text x="0" y="${y + 17}" class="qc__label">${d}</text>
      <rect class="qc__you" x="68" y="${y + 4}" width="${Math.max(1, 220 * you[i])}" height="10" rx="2"/>
      <rect class="qc__drink" x="68" y="${y + 16}" width="${Math.max(1, 220 * drink.vector[i])}" height="10" rx="2"/>`;
  }).join('');
  const label = FLAVOR_DIMS.map((d, i) => `${d}: you ${Math.round(you[i] * 10)}, drink ${Math.round(drink.vector[i] * 10)}`).join('; ');
  return `<svg class="qc" viewBox="0 0 300 194" role="img" aria-label="Flavor comparison out of 10. ${label}">${rows}</svg>`;
}

const BEAN = '<svg viewBox="0 0 20 28" width="14" height="20"><ellipse cx="10" cy="14" rx="9" ry="13" fill="currentColor"/><path d="M10 2c-5 7 5 17 0 24" fill="none" stroke="var(--bg)" stroke-width="1.8" stroke-linecap="round"/></svg>';

function confetti(host) {
  const box = document.createElement('div');
  box.className = 'quiz__confetti';
  box.setAttribute('aria-hidden', 'true');
  const colors = ['var(--accent)', 'var(--brass)', 'var(--fg)'];
  for (let i = 0; i < 40; i++) {
    const b = document.createElement('span');
    b.innerHTML = BEAN;
    b.style.color = colors[i % 3];
    box.append(b);
    gsap.timeline()
      .fromTo(b, { x: 0, y: 0, rotation: gsap.utils.random(0, 360), scale: gsap.utils.random(.6, 1.2) },
        { x: gsap.utils.random(-220, 220), y: gsap.utils.random(-200, -40), rotation: '+=180', duration: .55, ease: 'power2.out' })
      .to(b, { y: '+=420', rotation: '+=240', opacity: 0, duration: 1.3, ease: 'power1.in' });
  }
  host.append(box);
  setTimeout(() => box.remove(), 2200);
}

function resultHTML(top, runners, pref) {
  const d = top.drink;
  const pct = Math.round(top.score * 100);
  const [a, b] = why(pref, d.vector);
  const milk = d.vector[2] >= .3 ? 'whole' : 'none';
  const seg = (name, opts, checked) => opts.map(([v, l]) =>
    `<label class="seg__opt"><input type="radio" name="${name}" value="${v}"${v === checked ? ' checked' : ''}><span>${l}</span></label>`).join('');
  return `<article class="qr card" aria-labelledby="quiz-result-title">
    <div class="qr__stamp" data-stamp>
      <p class="qr__extra">Extra! Extra!</p>
      <h3 id="quiz-result-title" class="qr__title" tabindex="-1">You're ${esc(withArticle(d.name))}</h3>
      <p class="qr__pct"><strong>${pct}%</strong> match</p>
    </div>
    <p class="qr__why">${esc(BLURB[d.id] || d.note)} Strongest common ground: ${a} and ${b}.</p>
    <figure class="qr__chart">
      ${chart(pref, d)}
      <figcaption class="qr__legend"><span class="key key--you"></span> Outlined bar: you <span class="key key--drink"></span> Solid bar: ${esc(d.name)}</figcaption>
    </figure>
    <div class="qr__runners"><h4>Runners-up</h4><ol>${runners.map((r) => `<li>${esc(r.drink.name)} <span class="muted">${Math.round(r.score * 100)}%</span></li>`).join('')}</ol></div>
    <form class="qb" data-build>
      <h4>Make it yours</h4>
      <fieldset class="seg"><legend>Milk</legend>${seg('milk', [['whole', 'Whole'], ['oat', 'Oat'], ['none', 'None']], milk)}</fieldset>
      <fieldset class="seg"><legend>Sweetness</legend>${seg('sweet', [['0', 'None'], ['1', 'Half'], ['2', 'Full']], '2')}</fieldset>
      <label class="qb__shot"><input type="checkbox" name="shot"><span>Extra shot</span></label>
      <p class="qb__line">Your order: <output data-custom></output></p>
      <div class="qb__actions">
        <button type="submit" class="btn btn--primary" data-magnetic>Come try it: hold my drink</button>
        <button type="button" class="btn btn--ghost" data-retake>Retake</button>
      </div>
    </form>
  </article>`;
}

export function init() {
  const root = document.getElementById('quiz');
  const form = root?.querySelector('[data-quiz-form]');
  if (!form) return;
  const steps = [...form.querySelectorAll('.quiz__q')];
  const $ = (s) => root.querySelector(s);
  const progress = $('[data-quiz-progress]'), countEl = $('[data-quiz-count]'), bar = $('[data-quiz-bar]');
  const back = $('[data-quiz-back]'), next = $('[data-quiz-next]'), submit = $('[data-quiz-submit]');
  const hint = $('[data-quiz-hint]'), resultEl = $('[data-quiz-result]'), live = $('[data-quiz-live]'), last = $('[data-quiz-last]');
  const N = steps.length;
  let step = 0, timer = 0, lastPointer = 0;

  form.noValidate = true; // we validate per step; hidden required radios would trip native validation
  form.classList.add('is-stepper');
  if (progress) progress.hidden = false;

  const answered = (i) => form.elements[QUESTIONS[i].id]?.value !== '';
  const show = (i, focus = true) => {
    clearTimeout(timer);
    step = i;
    steps.forEach((f, k) => { f.hidden = k !== i; });
    if (countEl) countEl.textContent = `Question ${i + 1} of ${N}`;
    if (bar) bar.value = i + 1;
    if (back) back.hidden = i === 0;
    if (next) next.hidden = i === N - 1;
    if (submit) submit.hidden = i !== N - 1;
    if (hint) hint.textContent = '';
    if (focus) (steps[i].querySelector('input:checked') || steps[i].querySelector('input'))?.focus({ preventScroll: true });
  };
  const advance = () => {
    if (!answered(step)) { if (hint) hint.textContent = 'Pick one to keep going. The poll insists.'; return; }
    if (step < N - 1) show(step + 1); else reveal();
  };

  form.addEventListener('pointerdown', () => { lastPointer = Date.now(); });
  form.addEventListener('change', () => {
    if (hint) hint.textContent = '';
    // Auto-advance only for taps/clicks; arrow keys also fire change and must not jump ahead.
    if (Date.now() - lastPointer < 1000 && step < N - 1) timer = setTimeout(advance, 350);
  });
  back?.addEventListener('click', () => show(Math.max(0, step - 1)));
  next?.addEventListener('click', advance);
  form.addEventListener('submit', (e) => { e.preventDefault(); advance(); }); // Enter on a radio lands here

  const start = () => {
    form.reset();
    resultEl.hidden = true;
    resultEl.innerHTML = '';
    form.hidden = false;
    show(0);
    scrollToTarget(root);
  };

  function reveal() {
    const answers = QUESTIONS.map((q) => Number(form.elements[q.id].value));
    const pref = buildPreference(answers, QUESTIONS);
    const [top, ...rest] = rankDrinks(pref, DRINKS);
    const d = top.drink;
    const pct = Math.round(top.score * 100);
    store.set({ id: d.id, name: d.name, pct, at: new Date().toISOString() });

    resultEl.innerHTML = resultHTML(top, rest.slice(0, 2), pref);
    form.hidden = true;
    resultEl.hidden = false;
    const title = resultEl.querySelector('#quiz-result-title');
    title?.focus({ preventScroll: true });
    scrollToTarget(resultEl);
    if (live) live.textContent = `Result: you're ${withArticle(d.name)}, ${pct} percent match.`;

    // Builder
    const build = resultEl.querySelector('[data-build]');
    const out = resultEl.querySelector('[data-custom]');
    const parts = () => {
      const f = build.elements;
      return [MILK[f.milk.value], SWEET[f.sweet.value], f.shot.checked && 'extra shot'].filter(Boolean).join(', ');
    };
    const update = () => { if (out) out.textContent = `${d.name}, ${parts()}`; };
    update();
    build?.addEventListener('change', update);
    build?.addEventListener('submit', (e) => { e.preventDefault(); holdDrink(d.id, d.name, parts()); });
    resultEl.querySelector('[data-retake]')?.addEventListener('click', start);

    if (reducedMotion()) return;
    const card = resultEl.querySelector('.qr');
    const stamp = resultEl.querySelector('[data-stamp]');
    gsap.timeline()
      .from(stamp, { scale: 2.6, rotation: -16, opacity: 0, duration: .42, ease: 'power4.in' })
      .add(() => confetti(card))
      .fromTo(card, { x: -8, y: 4 }, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .3)' })
      .from(resultEl.querySelectorAll('.qc rect'), { scaleX: 0, transformOrigin: '0 50%', duration: .7, stagger: .05, ease: 'expo.out' }, '-=.5')
      .from(resultEl.querySelectorAll('.qr__why, .qr__chart, .qr__runners, .qb'), { opacity: 0, y: 16, duration: .6, stagger: .08, ease: 'expo.out' }, '<');
  }

  const prev = store.get();
  if (prev?.name && last) {
    last.innerHTML = `Last time you were ${esc(withArticle(prev.name))}. <button type="button" class="quiz__retake">Retake?</button>`;
    last.hidden = false;
    last.querySelector('button')?.addEventListener('click', start);
  }
  show(0, false);
}
