# Build contracts (read before touching anything)

Spec: `docs/superpowers/specs/2026-09-30-fourth-corner-coffee-design.md`. Read it fully.

## Stack
Vite 8, plain ES modules, no framework. Deps: `gsap` (3.15, includes ScrollTrigger, SplitText, free), `lenis`, `ogl`. No new deps without a strong reason.
`index.html` stitches `sections/*.html` via `<!-- @include -->` (see `vite.config.js`). Sections are plain static HTML; JS enhances them.

## Shared files (read-only for agents unless listed as yours)
- `src/styles/tokens.css`: design tokens. Use semantic vars (`--bg --fg --muted --accent --on-accent --line --card --brass --mood-a --mood-b`, type steps, spaces, eases). Never hardcode hex colors in feature CSS except inside SVG illustration fills where a token cannot reach; prefer `currentColor`/`var()` there too.
- `src/styles/base.css`: `.container .section .eyebrow .lede .muted .visually-hidden .btn .btn--primary .btn--ghost .chip .card`. Reuse them.
- `src/data/menu.js` (`MENU`, `DRINKS`, `FLAVOR_DIMS`), `src/data/shop.js` (`SHOP`, `HOURS`, `BUSY`), `src/lib/motion-pref.js` (`reducedMotion()`, `finePointer()`).
- `src/main.js`: imports every module and CSS file listed below and calls `init()` on each. Every JS module must `export function init()`.

## Ownership (only edit your files)
| Agent | Files |
|---|---|
| A: brand/copy | `sections/header.html`, `sections/footer.html`, `sections/letters.html`, `sections/finale.html`, `src/js/chrome.js`, `src/styles/chrome.css`, `src/styles/letters.css`, `src/styles/finale.css`, `public/favicon.svg`, `docs/brand.md` |
| B: hero/WebGL | `sections/hero.html`, `src/js/hero.js`, `src/js/hero-gl.js`, `src/styles/hero.css` |
| C: scroll/motion | `sections/journey.html`, `src/js/motion.js`, `src/js/journey.js`, `src/styles/journey.css`, `src/styles/motion.css` |
| D1: menu/quiz | `sections/menu.html`, `sections/quiz.html`, `src/js/menu.js`, `src/js/quiz.js`, `src/lib/match.js`, `src/styles/menu.css`, `src/styles/quiz.css`, `test/match.test.js` |
| D2: shop utilities | `sections/today.html`, `sections/punch.html`, `sections/hold.html`, `sections/visit.html`, `sections/sticky.html`, `src/js/{theme,today,punch,hold,visit,bandit-cta,easter}.js`, `src/lib/{hours,busy,bandit,pick}.js`, `src/styles/{today,punch,hold,visit}.css`, `test/{hours,busy,bandit,pick}.test.js` |
| E: SEO/a11y/perf | `index.html` between `<!-- SEO:START -->`/`<!-- SEO:END -->` only, `vite.config.js` (may add plugins, keep the include plugin intact), `public/robots.txt`, `public/og.svg`/`og.png`, `src/seo/*` |

## Cross-module hooks (DOM attributes + events)
- Section roots: `<section id="{hero|today|journey|menu|quiz|letters|punch|hold|visit|finale}" class="section" aria-labelledby="{id}-title">` with an `<h2 id="{id}-title">` (hero uses `<h1>`).
- `[data-reveal]` on any element: motion.js fades/rises it in on scroll (`data-reveal="stagger"` on a parent staggers its children). Owners add the attribute. Do not write your own generic reveal code.
- `[data-magnetic]` on buttons: motion.js applies magnetic hover on fine pointers.
- `[data-cursor="label"]` optional: custom cursor shows that label while hovering (e.g., "stir", "pick").
- `[data-bandit-cta]`: the hero primary CTA `<a>`; bandit-cta.js sets its text + records clicks. B puts it in hero markup with default text "Get directions" and `href="#visit"`.
- `[data-theme-toggle]`: a button in the header (A); theme.js (D2) binds it. Sets `html[data-theme]`, saves `localStorage fc.theme`, dispatches `document` event `fc:theme-change` `{detail:{theme, mood}}`.
- `[data-open-status]`: any element; today.js fills it with the live open/closed text (A may place one in header/footer, B in hero). Also sets `data-state="open|closing|closed"` on it.
- `document` event `fc:drink-chosen` `{detail:{id, name, custom}}`: quiz.js dispatches after match/builder; hold.js listens and prefills the drink field. menu.js may dispatch it from a card's "Hold this one" link.
- Anchor targets: `#visit` (directions), `#hold` (form), `#menu`, `#quiz`, `#punch`.
- Lenis: motion.js creates it and exports `getLenis()`; others use `getLenis()?.scrollTo(target)` if they need programmatic scroll, else plain anchors.
- GSAP: `import { gsap } from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger'; gsap.registerPlugin(ScrollTrigger)` (idempotent). Always gate motion with `reducedMotion()` and use `gsap.matchMedia()` for breakpoint/motion variants.

## Quality bar (everyone)
- Mobile first (375px). No horizontal scroll. Touch targets ≥ 48px. Sticky mobile bar is ~72px tall + safe area: keep `padding-bottom` room at page end (finale/footer owner).
- WCAG AA via tokens; visible focus; labels on all inputs; `aria-live` for dynamic status; decorative SVG `aria-hidden="true"`.
- No emoji as icons; inline SVG only. No lorem ipsum. No external images (inline SVG / CSS / canvas illustration).
- No console errors. Guard every querySelector (feature missing → return).
- Voice: small-town newspaper columnist (see spec §2). No dark patterns, fake scarcity, countdowns, guilt copy, or pop-ups.
- Don't run `npm install` of new packages. You may run `npx vite build` and `npm test` to check your work. Don't start dev servers on port 5173 (integrator uses it); if you must, use `--port 51xx` and kill it after.
