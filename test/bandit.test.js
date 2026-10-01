import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleBeta, chooseArm, record } from '../src/lib/bandit.js';

// Tiny seeded PRNG so the test is deterministic.
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('sampleBeta stays in [0, 1], including shape < 1', () => {
  const rng = mulberry32(1);
  for (const [a, b] of [[1, 1], [0.5, 0.5], [51, 1], [1, 51], [3, 7]]) {
    for (let i = 0; i < 500; i++) {
      const x = sampleBeta(a, b, rng);
      assert.ok(x >= 0 && x <= 1, `${x} out of range for Beta(${a},${b})`);
    }
  }
});

test('sampleBeta mean is about right', () => {
  const rng = mulberry32(7);
  let sum = 0;
  for (let i = 0; i < 4000; i++) sum += sampleBeta(3, 7, rng);
  assert.ok(Math.abs(sum / 4000 - 0.3) < 0.02);
});

test('a 50/0 arm beats a 0/50 arm in > 95% of choices', () => {
  const rng = mulberry32(42);
  const stats = { good: { s: 50, f: 0 }, bad: { s: 0, f: 50 } };
  let wins = 0;
  for (let i = 0; i < 1000; i++) if (chooseArm(stats, rng) === 'good') wins++;
  assert.ok(wins > 950, `good won only ${wins}`);
});

test('record is immutable and counts outcomes', () => {
  const a = {};
  const b = record(a, 'x', true);
  const c = record(b, 'x', false);
  assert.deepEqual(a, {});
  assert.deepEqual(c, { x: { s: 1, f: 1 } });
});
