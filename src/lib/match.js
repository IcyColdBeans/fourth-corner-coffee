// Pure quiz matching math. No DOM; importable from node for tests.
import { FLAVOR_DIMS } from '../data/menu.js';

// Cosine similarity: dot(a,b) / (|a| |b|). 1 = same direction (same flavor balance),
// 0 = nothing in common. Zero-length vectors have no direction, so they score 0.
export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// answers[i] = chosen option index for questions[i] (undefined = skipped).
// Preference = sum of chosen weight vectors, negatives clamped to 0 (a drink can't be "minus creamy").
export function buildPreference(answers, questions) {
  const pref = FLAVOR_DIMS.map(() => 0);
  questions.forEach((q, i) => {
    const opt = q.options[answers[i]];
    if (opt) opt.weights.forEach((w, d) => { pref[d] += w; });
  });
  return pref.map((v) => Math.max(0, v));
}

// Rank by cosine, highest first. Flight (anchor) and the kids steamer are excluded; Array sort is stable, so ties keep menu order.
export function rankDrinks(pref, drinks) {
  return drinks
    .filter((d) => d.vector && !d.anchor && !d.tags.includes('kids'))
    .map((drink) => ({ drink, score: cosine(pref, drink.vector) }))
    .sort((a, b) => b.score - a.score);
}

// Weights: [sweet, bitter, creamy, strong, fruity, spice]
export const QUESTIONS = [
  { id: 'saturday', q: 'Your ideal Saturday on the square looks like:', options: [
    { label: 'Front row for the brass trio, hollering requests', weights: [.3, .2, .4, .6, 0, 0] },
    { label: 'The market loop, sampling every apple in the county', weights: [.4, 0, .2, 0, .9, .5] },
    { label: 'A bench, a paperback, and nowhere to be', weights: [.5, 0, .7, 0, 0, .2] },
    { label: 'Errands done by eight, then a victory lap', weights: [0, .5, -.3, .9, .2, 0] }
  ] },
  { id: 'mornings', q: 'How do you take your mornings?', options: [
    { label: 'Black, like my sense of humor', weights: [0, 1, -.6, .6, .2, 0] },
    { label: 'Softly, with the radio low', weights: [.3, 0, .8, 0, 0, .2] },
    { label: 'With a to-do list and a stopwatch', weights: [.1, .4, .2, 1, 0, 0] },
    { label: 'Late, and with a little something sweet', weights: [.8, 0, .4, 0, .1, .1] }
  ] },
  { id: 'dessert', q: 'The pie case is open. You point at:', options: [
    { label: 'Sugar cream pie, obviously. This is Indiana.', weights: [1, 0, .8, 0, 0, .1] },
    { label: 'The lemon bar that makes you squint', weights: [.3, 0, 0, .1, 1, 0] },
    { label: 'Dark chocolate, the bitterer the better', weights: [.3, .8, .2, .4, 0, 0] },
    { label: 'Warm apple crisp with too much cinnamon', weights: [.5, 0, .3, 0, .6, 1] }
  ] },
  { id: 'soundtrack', q: 'Pick the soundtrack for your first sip:', options: [
    { label: 'A brass band warming up across the street', weights: [.3, .2, .2, .6, 0, 0] },
    { label: 'Porch acoustic, a little out of tune', weights: [.2, 0, .4, 0, 0, .6] },
    { label: 'The courthouse clock striking the hour', weights: [0, .5, 0, .6, .3, 0] },
    { label: 'Silence. Blessed silence.', weights: [0, .4, 0, .3, .4, 0] }
  ] },
  { id: 'brave', q: 'On a scale of plaque-reader to daredevil, you are:', options: [
    { label: 'Same order since the last election', weights: [.3, .1, .4, .3, 0, 0] },
    { label: 'I will try the special if you vouch for it', weights: [.3, 0, .2, 0, .3, .5] },
    { label: 'Surprise me. I mean it.', weights: [.2, .2, 0, .3, .6, .3] }
  ] }
];

// Human-readable "why" for a match: the two dims the drink and person share most.
export function why(pref, vector) {
  const top = FLAVOR_DIMS.map((d, i) => [d, pref[i] * vector[i]]).sort((a, b) => b[1] - a[1]);
  return [top[0][0], top[1][0]];
}
