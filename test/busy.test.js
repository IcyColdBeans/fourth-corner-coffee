import test from 'node:test';
import assert from 'node:assert/strict';
import { busyAt, level, quietestNext } from '../src/lib/busy.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('busyAt interpolates and is 0 outside hours', () => {
  close(busyAt(3, 8 * 60), 0.95); // weekday 8:00
  close(busyAt(3, 8 * 60 + 30), 0.825); // halfway .95 -> .7
  assert.equal(busyAt(3, 5 * 60), 0);
  assert.equal(busyAt(3, 18 * 60), 0);
  close(busyAt(3, 17 * 60 + 30), 0.45); // holds flat into close
  close(busyAt(6, 10 * 60), 1); // Saturday peak
  close(busyAt(0, 10 * 60 + 15), 0.95 - 0.1 * 0.25); // Sunday curve
});

test('level thresholds', () => {
  assert.equal(level(0), 'Quiet');
  assert.equal(level(0.29), 'Quiet');
  assert.equal(level(0.3), 'Steady');
  assert.equal(level(0.6), 'Busy');
  assert.equal(level(0.85), 'Line out the door');
});

test('quietestNext finds the lowest upcoming slot', () => {
  const q = quietestNext(3, 13 * 60); // weekday 1 PM: dip at 3 PM (.3)
  assert.equal(q.minutes, 15 * 60);
  assert.equal(q.label, '3 PM');
  assert.ok(q.minutes > 13 * 60);
});

test('quietestNext is null when closed or nothing left', () => {
  assert.equal(quietestNext(3, 5 * 60), null);
  assert.equal(quietestNext(3, 17 * 60 + 50), null);
});
