import test from 'node:test';
import assert from 'node:assert/strict';
import { shopNow, status, isWithinHours, formatTime } from '../src/lib/hours.js';

// All dates are fixed UTC instants. Indianapolis is UTC-4 in summer (EDT), UTC-5 in winter (EST).
const at = (iso) => new Date(iso);

test('shopNow converts to shop time', () => {
  assert.deepEqual(shopNow(at('2026-09-30T14:00:00Z')), { day: 3, minutes: 10 * 60 }); // Wed 10:00 EDT
  assert.deepEqual(shopNow(at('2026-09-30T04:00:00Z')), { day: 3, minutes: 0 }); // midnight, not "24"
});

test('isWithinHours', () => {
  assert.equal(isWithinHours(1, 390), true);
  assert.equal(isWithinHours(1, 389), false);
  assert.equal(isWithinHours(1, 1080), false); // close is exclusive
});

test('formatTime', () => {
  assert.equal(formatTime(390), '6:30 AM');
  assert.equal(formatTime(1080), '6 PM');
  assert.equal(formatTime(720), '12 PM');
  assert.equal(formatTime(0), '12 AM');
});

test('open', () => {
  const s = status(at('2026-09-30T14:00:00Z')); // Wed 10:00 AM
  assert.equal(s.state, 'open');
  assert.equal(s.text, 'Open now · until 6 PM');
});

test('closing soon', () => {
  const s = status(at('2026-09-30T21:35:00Z')); // Wed 5:35 PM
  assert.equal(s.state, 'closing');
  assert.equal(s.text, 'Closing soon · 25 min left');
});

test('closed before open', () => {
  const s = status(at('2026-09-30T10:00:00Z')); // Wed 6:00 AM
  assert.equal(s.state, 'closed');
  assert.equal(s.text, 'Closed · opens 6:30 AM today');
});

test('closed after close, Friday night -> Saturday', () => {
  const s = status(at('2026-10-03T00:00:00Z')); // Fri 8:00 PM
  assert.equal(s.text, 'Closed · opens 7 AM tomorrow');
  assert.deepEqual(s.opensAt, { day: 6, minutes: 420, when: 'tomorrow' });
});

test('Sunday -> Monday wrap', () => {
  const s = status(at('2026-10-04T20:00:00Z')); // Sun 4:00 PM
  assert.equal(shopNow(at('2026-10-04T20:00:00Z')).day, 0);
  assert.equal(s.text, 'Closed · opens 6:30 AM tomorrow');
  assert.equal(s.opensAt.day, 1);
});

test('DST in March (starts Mar 8, 2026)', () => {
  // Same 11:00 UTC instant is 6:00 EST before the change and 7:00 EDT after.
  assert.deepEqual(shopNow(at('2026-03-06T11:00:00Z')), { day: 5, minutes: 360 });
  assert.equal(status(at('2026-03-06T11:00:00Z')).state, 'closed');
  assert.deepEqual(shopNow(at('2026-03-09T11:00:00Z')), { day: 1, minutes: 420 });
  assert.equal(status(at('2026-03-09T11:00:00Z')).state, 'open');
});

test('DST in November (ends Nov 1, 2026)', () => {
  assert.deepEqual(shopNow(at('2026-10-30T11:00:00Z')), { day: 5, minutes: 420 });
  assert.equal(status(at('2026-10-30T11:00:00Z')).state, 'open');
  assert.deepEqual(shopNow(at('2026-11-02T11:00:00Z')), { day: 1, minutes: 360 });
  assert.equal(status(at('2026-11-02T11:00:00Z')).text, 'Closed · opens 6:30 AM today');
});
