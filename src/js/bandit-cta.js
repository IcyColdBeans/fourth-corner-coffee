// Hero CTA wording picked by Thompson sampling (see src/lib/bandit.js for the explanation).
// Learning is per-browser: stats live in localStorage, there is no server. That's a known limit.
import { chooseArm, record } from '../lib/bandit.js';

const KEY = 'fc.bandit.v1';
const SEEN = 'fc.bandit.seen'; // sessionStorage: which arm this session saw (1 impression per session)
export const VARIANTS = ['Get directions', 'Save me a seat on the square', 'Point me to the corner'];

function loadStats() {
  const stats = Object.fromEntries(VARIANTS.map((v) => [v, { s: 0, f: 0 }]));
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  for (const v of VARIANTS) if (saved[v]) stats[v] = { s: +saved[v].s || 0, f: +saved[v].f || 0 };
  return stats;
}

export function init() {
  const cta = document.querySelector('[data-bandit-cta]');
  if (!cta) return;
  let arm = VARIANTS[0];
  let stats;
  try {
    stats = loadStats();
    // Keep the same wording for the whole session so the button doesn't change under people.
    const seen = sessionStorage.getItem(SEEN);
    if (VARIANTS.includes(seen)) {
      arm = seen;
    } else {
      arm = chooseArm(stats);
      // Count the impression as a "miss" now; a click later converts it to a hit.
      stats = record(stats, arm, false);
      localStorage.setItem(KEY, JSON.stringify(stats));
      sessionStorage.setItem(SEEN, arm);
    }
  } catch {
    arm = VARIANTS[0]; // storage blocked or corrupt: plain default, no learning
    stats = null;
  }
  cta.textContent = arm;
  cta.setAttribute('href', '#visit');

  // One success per session, matching the one-impression-per-session rule above,
  // so reload-and-click-again can't count two successes against one impression.
  cta.addEventListener('click', () => {
    if (!stats) return;
    try {
      if (sessionStorage.getItem('fc.bandit.clicked')) return;
      sessionStorage.setItem('fc.bandit.clicked', '1');
      const cur = loadStats();
      const next = record(cur, arm, true);
      next[arm].f = Math.max(0, next[arm].f - 1); // the impression was pre-counted as a miss
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  });

  // Debugging aid: open the console and run fcBandit.stats() to see { arm: { s, f } }.
  window.fcBandit = {
    stats() { try { return loadStats(); } catch { return null; } }
  };
}
