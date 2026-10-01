import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cosine, buildPreference, rankDrinks, QUESTIONS } from '../src/lib/match.js';
import { DRINKS, MENU } from '../src/data/menu.js';

test('cosine basics', () => {
  assert.ok(Math.abs(cosine([1, 2, 3], [1, 2, 3]) - 1) < 1e-9);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([0, 0, 0], [1, 2, 3]), 0);
});

test('buildPreference sums and clamps negatives', () => {
  const qs = [{ options: [{ weights: [0, 1, -.6, .6, 0, 0] }] }, { options: [{ weights: [0, 0, .2, 0, 0, 0] }] }];
  assert.deepEqual(buildPreference([0, 0], qs), [0, 1, 0, .6, 0, 0]);
});

test('known preferences rank the expected drink first', () => {
  assert.equal(rankDrinks([.6, .2, .7, .2, .1, 1], DRINKS)[0].drink.id, 'porch-swing-chai');
  assert.equal(rankDrinks([.7, .2, .8, .4, .6, .8], DRINKS)[0].drink.id, 'orchard-band');
  assert.equal(rankDrinks([0, .8, 0, .9, .4, 0], DRINKS)[0].drink.id, 'espresso');
  assert.equal(rankDrinks([.3, .8, 0, 1, .5, .1], DRINKS)[0].drink.id, 'courthouse-clock');
});

test('rankDrinks excludes the anchor flight and food, sorted desc', () => {
  const r = rankDrinks([.1, .5, .1, .6, .7, 0], MENU);
  assert.ok(r.every(({ drink }) => !drink.anchor && drink.vector));
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
});

test('every signature and the seasonal wins for some answer path', () => {
  const winners = new Set();
  const walk = (i, a) => {
    if (i === QUESTIONS.length) return void winners.add(rankDrinks(buildPreference(a, QUESTIONS), DRINKS)[0].drink.id);
    QUESTIONS[i].options.forEach((_, k) => walk(i + 1, [...a, k]));
  };
  walk(0, []);
  for (const id of ['fourth-corner', 'courthouse-clock', 'white-river-cold-brew', 'orchard-band']) assert.ok(winners.has(id), id);
});

test('questions are well formed', () => {
  assert.equal(QUESTIONS.length, 5);
  for (const q of QUESTIONS) {
    assert.ok(q.options.length >= 3 && q.options.length <= 4);
    for (const o of q.options) assert.equal(o.weights.length, 6);
  }
});
