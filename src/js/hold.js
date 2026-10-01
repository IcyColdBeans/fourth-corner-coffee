// "Hold my drink": client-side demo reservation. No network calls, nothing stored.
import { MENU } from '../data/menu.js';
import { HOURS } from '../data/shop.js';
import { shopNow, status, formatTime, hoursText } from '../lib/hours.js';
import { reducedMotion } from '../lib/motion-pref.js';

const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const ceil5 = (m) => Math.ceil(m / 5) * 5;

/** Today's pickup window in shop time: { earliest, close } or null when today is done. */
function windowToday(now = new Date()) {
  const { day, minutes } = shopNow(now);
  const h = HOURS[day];
  const earliest = ceil5(Math.max(h.open, minutes + 15));
  return earliest < h.close ? { day, earliest, close: h.close, open: h.open } : { day, closed: true };
}

function closedMessage() {
  const st = status();
  const next = st.opensAt ? ` We open at ${formatTime(st.opensAt.minutes)} ${st.opensAt.when}.` : '';
  return `We're done holding drinks for today.${next} Come back then and we'll save you one.`;
}

const RULES = {
  'hold-name': (el) => (el.value.trim() ? '' : 'We need a name to write on the cup.'),
  'hold-drink': (el) => (el.value ? '' : 'Pick something. Drip of the Day never judges.'),
  'hold-time': (el) => {
    const w = windowToday();
    if (w.closed) return closedMessage();
    if (!el.value) return `Pick a time between ${formatTime(w.earliest)} and ${formatTime(w.close - 5)}.`;
    const [h, m] = el.value.split(':').map(Number);
    const t = h * 60 + m;
    if (t < w.open) return `We open at ${formatTime(w.open)} today. Try ${formatTime(w.earliest)} or later.`;
    if (t >= w.close) return `We close at ${formatTime(w.close)} today. Try something a little earlier.`;
    if (t < w.earliest) return `Give Theo at least 15 minutes. The earliest we can do is ${formatTime(w.earliest)}.`;
    return '';
  }
};

export function init() {
  const root = document.getElementById('hold');
  const form = root?.querySelector('[data-hold-form]');
  if (!form) return;
  const drink = form.querySelector('[data-hold-drink]');
  const custom = form.querySelector('#hold-custom');
  const time = form.querySelector('#hold-time');
  const timeHint = form.querySelector('[data-hold-time-hint]');
  const submit = form.querySelector('[data-hold-submit]');
  const submitLabel = form.querySelector('[data-hold-label]');
  const ticket = root.querySelector('[data-hold-ticket]');
  const summary = root.querySelector('[data-hold-summary]');
  const live = root.querySelector('[data-hold-live]');

  // Drink options from the single source of truth, drinks and food as optgroups.
  if (drink) {
    for (const [label, items] of [['Drinks', MENU.filter((m) => m.vector)], ['Food', MENU.filter((m) => !m.vector)]]) {
      const g = document.createElement('optgroup');
      g.label = label;
      items.forEach((m) => g.append(new Option(`${m.name} · $${m.price.toFixed(2)}`, m.id)));
      drink.append(g);
    }
  }

  const refreshTimeHint = () => {
    const w = windowToday();
    if (!time || !timeHint) return;
    if (w.closed) {
      timeHint.textContent = closedMessage();
      time.removeAttribute('min'); time.removeAttribute('max');
    } else {
      timeHint.textContent = `Today ${hoursText(w.day)}, shop time (Indiana). Earliest pickup: ${formatTime(w.earliest)}.`;
      time.min = hhmm(w.earliest); time.max = hhmm(w.close - 5);
    }
  };
  refreshTimeHint();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshTimeHint(); });

  const check = (el) => {
    const rule = RULES[el.id];
    if (!rule) return true;
    const msg = rule(el);
    const err = form.querySelector(`#${el.id}-err`);
    if (err) { err.textContent = msg; err.hidden = !msg; }
    el.setAttribute('aria-invalid', String(!!msg));
    return !msg;
  };

  for (const id of Object.keys(RULES)) {
    const el = form.querySelector(`#${id}`);
    // Validate on blur once there's something to judge, then live while fixing an error.
    el?.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') check(el); });
    el?.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (el.getAttribute('aria-invalid') === 'true') check(el);
    });
  }

  const showForm = () => {
    if (ticket) ticket.hidden = true;
    form.hidden = false;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit?.getAttribute('aria-busy') === 'true') return;
    refreshTimeHint();
    const fields = Object.keys(RULES).map((id) => form.querySelector(`#${id}`)).filter(Boolean);
    const invalid = fields.filter((el) => !check(el));
    if (invalid.length) { invalid[0].focus(); return; }

    // Fake 600ms "sending" state so the button has something to say. Nothing is sent.
    submit?.setAttribute('aria-busy', 'true');
    submit?.classList.add('is-loading');
    if (submitLabel) submitLabel.textContent = 'Holding…';
    setTimeout(() => {
      submit?.removeAttribute('aria-busy');
      submit?.classList.remove('is-loading');
      if (submitLabel) submitLabel.textContent = 'Hold it';
      if (!ticket || !summary) return;

      const data = new FormData(form);
      const [h, m] = String(data.get('time')).split(':').map(Number);
      const rows = [
        ['Name', String(data.get('name')).trim()],
        ['Order', drink?.selectedOptions[0]?.text.split(' · ')[0] || ''],
        ['How you take it', String(data.get('custom') || '').trim()],
        ['Pickup', `${formatTime(h * 60 + m)} today, shop time (Indiana)`],
        ['Table', data.get('table') ? `for ${data.get('table')}` : '']
      ].filter(([, v]) => v);
      summary.replaceChildren(...rows.flatMap(([k, v]) => {
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        return [dt, dd];
      }));

      form.hidden = true;
      ticket.hidden = false;
      ticket.classList.toggle('is-in', !reducedMotion());
      if (live) live.textContent = 'Held. Your ticket stub is ready.';
      ticket.querySelector('[data-hold-ticket-title]')?.focus();
    }, 600);
  });

  root.querySelector('[data-hold-again]')?.addEventListener('click', () => {
    showForm();
    form.querySelector('#hold-name')?.focus();
  });

  // Prefill from the quiz / menu: { id, name, custom }.
  document.addEventListener('fc:drink-chosen', (e) => {
    const { id, name, custom: how } = e.detail || {};
    if (!drink) return;
    const opt = [...drink.options].find((o) => o.value === id || (name && o.text.startsWith(name)));
    if (opt) { drink.value = opt.value; check(drink); }
    if (custom && how) custom.value = how;
    showForm();
    if (live && opt) live.textContent = `Prefilled the hold form with ${opt.text.split(' · ')[0]}.`;
    // Keyboard users arrive with the page: next stop is the only empty required field.
    form.querySelector('input[name="name"]')?.focus({ preventScroll: true });
  });
}
