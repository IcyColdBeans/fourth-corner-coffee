// Light/dark toggle. The inline <head> script already set html[data-mood] and html[data-theme]
// before paint; this only binds the header button and persists a manual choice.
const root = document.documentElement;

// The theme follows the clock (or the toggle), not the OS, so drop the OS media hints
// and point every theme-color tag at the active background (--limestone / --night).
function syncMeta(theme) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.removeAttribute('media');
    m.content = theme === 'dark' ? '#16141A' : '#EDE6D6';
  });
}

function apply(theme) {
  root.dataset.theme = theme;
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(theme === 'dark'));
  });
  syncMeta(theme);
}

export function init() {
  apply(root.dataset.theme === 'dark' ? 'dark' : 'light');
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(theme);
      try { localStorage.setItem('fc.theme', theme); } catch { /* private mode: fine, just not remembered */ }
      document.dispatchEvent(new CustomEvent('fc:theme-change', { detail: { theme, mood: root.dataset.mood } }));
    });
  });
}
