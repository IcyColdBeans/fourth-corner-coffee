// Header chrome: always-visible header, a "Sections" dropdown on phones/tablets,
// and aria-current on the nav link for the section in view.
export function init() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 8), { passive: true });

  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('.site-nav');
  if (toggle && nav) {
    const setOpen = (open, { focus = false } = {}) => {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) nav.querySelector('a')?.focus();
      else if (focus) toggle.focus();
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('is-open')) setOpen(false, { focus: true });
    });
    document.addEventListener('click', (e) => { if (!header.contains(e.target)) setOpen(false); });
    matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  if (!('IntersectionObserver' in window)) return;
  const links = new Map();
  for (const a of header.querySelectorAll('.site-nav a[href^="#"]')) {
    const section = document.querySelector(a.getAttribute('href'));
    if (section) links.set(section, a);
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const a = links.get(e.target);
      if (e.isIntersecting) {
        links.forEach((l) => l.removeAttribute('aria-current'));
        a.setAttribute('aria-current', 'location');
      } else {
        a.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-45% 0px -50% 0px' }); // a thin band across the middle of the viewport
  links.forEach((_, section) => io.observe(section));
}
