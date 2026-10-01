// Thompson sampling for the hero CTA wording, explained for a non-statistician.
//
// We have a few CTA texts. Each one is an "arm" (as in a row of slot machines) with an unknown
// true click rate. For each arm we count successes (clicks) and failures (shown, not clicked).
// Our belief about that arm's click rate is a Beta(1 + successes, 1 + failures) distribution:
//   - with no data it is Beta(1, 1), which is flat: "any rate from 0% to 100% is plausible";
//   - as data arrives the curve narrows around the rate we have actually observed.
// On every visit we draw ONE random sample from each arm's belief and show the arm whose sample
// is highest. An arm we know little about has a wide belief, so it sometimes draws high and gets
// shown: that is exploring. An arm that has proven good draws high most of the time: that is
// exploiting. There are no knobs to tune, and traffic drifts to the winner as evidence builds.
//
// All randomness comes from an injectable rng() returning [0, 1), so tests can be seeded.

/** Standard normal sample via Box–Muller. */
function normal(rng) {
  let u = 0;
  while (u === 0) u = rng(); // log(0) would be -Infinity
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/**
 * Gamma(shape, 1) sample using Marsaglia–Tsang (2000), a fast rejection sampler for shape >= 1.
 * For shape < 1 we use the standard "boost": sample Gamma(shape + 1), multiply by U^(1/shape).
 */
function gamma(shape, rng) {
  if (shape < 1) return gamma(shape + 1, rng) * Math.pow(rng() || Number.MIN_VALUE, 1 / shape);
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do { x = normal(rng); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x ** 4) return d * v; // quick accept (most draws end here)
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Beta(a, b) sample: if X ~ Gamma(a) and Y ~ Gamma(b), then X / (X + Y) ~ Beta(a, b). */
export function sampleBeta(a, b, rng = Math.random) {
  const x = gamma(a, rng), y = gamma(b, rng);
  return x + y === 0 ? 0.5 : x / (x + y);
}

/** stats: { [arm]: { s: successes, f: failures } }. Returns the arm key to show this visit. */
export function chooseArm(stats, rng = Math.random) {
  let best = null, bestDraw = -1;
  for (const [arm, st] of Object.entries(stats)) {
    const draw = sampleBeta(1 + (st?.s || 0), 1 + (st?.f || 0), rng);
    if (draw > bestDraw) { bestDraw = draw; best = arm; }
  }
  return best;
}

/** Returns a NEW stats object with one outcome recorded (clicked = success, else failure). */
export function record(stats, arm, clicked) {
  const cur = { s: 0, f: 0, ...stats[arm] };
  return { ...stats, [arm]: clicked ? { ...cur, s: cur.s + 1 } : { ...cur, f: cur.f + 1 } };
}
