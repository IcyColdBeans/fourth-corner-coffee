import test from 'node:test';
import assert from 'node:assert/strict';
import { baristaPick, shopDateKey, fnv1a } from '../src/lib/pick.js';
import { DRINKS } from '../src/data/menu.js';

test('fnv1a known vector', () => {
  assert.equal(fnv1a(''), 0x811c9dc5);
  assert.equal(fnv1a('a'), 0xe40c292c);
});

test('baristaPick is deterministic and never the anchor', () => {
  assert.equal(baristaPick('2026-09-30', DRINKS), baristaPick('2026-09-30', DRINKS));
  const seen = new Set();
  for (let d = 1; d <= 60; d++) {
    const key = `2026-10-${String((d % 28) + 1).padStart(2, '0')}`;
    const p = baristaPick(key, DRINKS);
    assert.ok(p && !p.anchor);
    seen.add(p.id);
  }
  assert.ok(seen.size > 3, 'picks should rotate');
});

test('shopDateKey uses shop time', () => {
  // 02:00 UTC Oct 1 is still Sep 30 in Indianapolis.
  assert.equal(shopDateKey(new Date('2026-10-01T02:00:00Z')), '2026-09-30');
  assert.equal(shopDateKey(new Date('2026-10-01T05:00:00Z')), '2026-10-01');
});
