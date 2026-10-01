import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/chrome.css';
import './styles/hero.css';
import './styles/today.css';
import './styles/journey.css';
import './styles/menu.css';
import './styles/quiz.css';
import './styles/letters.css';
import './styles/punch.css';
import './styles/hold.css';
import './styles/visit.css';
import './styles/finale.css';
import './styles/motion.css';

// Above the fold: small, no GSAP. These run immediately.
import * as theme from './js/theme.js';
import * as chrome from './js/chrome.js';
import * as hero from './js/hero.js';
import * as today from './js/today.js';
import * as banditCta from './js/bandit-cta.js';
import * as visit from './js/visit.js'; // also used by today.js; includes the sticky mobile bar

// Each feature module exports init(). One failing feature must not take down the page.
const run = (mods) => {
  for (const [name, mod] of Object.entries(mods)) {
    try { mod.init(); } catch (err) { console.error(`[fc] ${name} failed to init`, err); }
  }
};

run({ theme, chrome, hero, today, banditCta, visit });

// Below the fold: the GSAP/Lenis-heavy features load after first paint so they never delay it.
// Every section they enhance already works as plain HTML until they arrive.
// Order matters: motion (Lenis + ScrollTrigger) must init before journey pins.
const later = async () => {
  const names = ['motion', 'journey', 'menu', 'quiz', 'punch', 'hold', 'easter'];
  const results = await Promise.allSettled([
    import('./js/motion.js'), import('./js/journey.js'), import('./js/menu.js'), import('./js/quiz.js'),
    import('./js/punch.js'), import('./js/hold.js'), import('./js/easter.js')
  ]);
  // allSettled so one failed chunk (network blip) skips only that feature; object order keeps motion first.
  const loaded = {};
  results.forEach((r, i) => r.status === 'fulfilled' ? (loaded[names[i]] = r.value) : console.error(`[fc] ${names[i]} failed to load`, r.reason));
  run(loaded);
};
const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(later, { timeout: 1500 }) : setTimeout(later, 200));
if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
