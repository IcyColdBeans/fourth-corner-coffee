# Fourth Corner Coffee

A single-page site for a **fictional** coffee shop on the downtown square in Noblesville, Indiana. Its job is to make someone want to walk in. Online ordering is deliberately out of scope.

> Fourth Corner Coffee, its people (Mags and Theo), its reviews, and its street address are invented. The downtown square, the courthouse, the White River, and Hamilton County are real. No real businesses, people, events, or awards are referenced.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # node:test on the pure logic (hours, busy curve, quiz match, bandit, daily pick)
npm run build     # static site in dist/
npm run preview   # serve dist/ at http://localhost:4173
```

Requirements: Node 20+. No backend, no environment variables, no API keys.

## Brand in one paragraph

**Fourth Corner Coffee: "Est. on the square. Loud on Saturdays."** Mags Pruitt, a retired high-school band director, spent 31 years telling kids to "find your corner and hold it." She opened the shop with her nephew Theo, who roasts in small batches in the back, and named it for the corner the square was missing: the one where you stop. A brass trio plays Saturday mornings. The voice is a small-town newspaper columnist: warm, dry, civic, with one pun per section at most. Palette: brick, limestone, ink, and brass. Type: Playfair Display, DM Sans, and DM Mono. Full brand bible: [`docs/brand.md`](docs/brand.md).

**Signature drinks:** The Fourth Corner (honey-oat latte, sea salt), Courthouse Clock (ristretto over demerara, orange twist), and White River Cold Brew (18 hours, maple cream). **Seasonal:** Orchard Band Latte. 16 menu items in [`src/data/menu.js`](src/data/menu.js).

## How it's built

- **Vite + plain ES modules.** `index.html` stitches `sections/*.html` in at build time (a 10-line plugin in `vite.config.js`), so every section ships as static, crawlable HTML and JS only enhances it.
- **Design tokens** live in `src/styles/tokens.css`. Every text color pair was checked for WCAG AA (see the spec).
- **Critical path is ~8 kB of JS (gzip).** Above-the-fold modules run immediately. GSAP, ScrollTrigger, Lenis, and the feature modules load after first paint. The WebGL cup (OGL, 16 kB gzip) loads on idle with a static SVG fallback. The hero load choreography is pure CSS, so it doesn't wait for JS.
- **Fonts are self-hosted** Latin subsets (OFL), with fallback metrics measured in Chrome so the font swap causes no layout shift.
- **JSON-LD** (`CafeOrCoffeeShop` with hours and full menu) is generated at build time from the same data files the UI uses, so the two can't drift.
- **Open/closed and busyness are computed in shop time** (`America/Indiana/Indianapolis`), so they're correct for a visitor in any timezone. Light/dark *mood* follows the visitor's own clock.

```
index.html            page shell + <!-- @include sections/x.html -->
sections/             one HTML file per section
src/data/             menu.js (with flavor vectors), shop.js (hours, busy curves)
src/lib/              pure logic, unit-tested: hours, busy, match, bandit, pick
src/js/               one module per feature, each exports init()
src/styles/           fonts, tokens, base, one CSS file per feature
test/                 node:test suites
docs/                 spec, brand bible, contracts, QA checklist
```

## Feature → principle map

| Feature | Principle / method | Where |
|---|---|---|
| Always-visible header with six plain-language destinations (Today, Menu, Quiz, Rewards, Hold a drink, Visit); a "Sections" dropdown on phones/tablets; the current section is underlined | **Hick's Law** (few, clearly named choices) + **wayfinding** | `sections/header.html`, `chrome.js` |
| Section labels say what the section is ("Menu", "Drink quiz", "Reviews"); the newspaper voice lives in the headlines | **Recognition over recall**, clear information scent | `sections/*.html` eyebrows |
| Practical sections first (today → menu → quiz); the sideways scroll story comes after, with a "skip the story" link | **Progressive disclosure**, no scroll-jacking in the way of the menu | `index.html` order, `journey.html` |
| One accent-colored CTA per section, everything else ghost/text links | **Hick's Law** (fewer choices at each decision point) + **Von Restorff / isolation effect** | `.btn--primary` in `base.css` |
| Sticky mobile bar: Directions + Hold my drink, 48px+ targets at the bottom of the screen; hides when its targets are on screen | **Fitts's Law** (large, thumb-reachable targets) | `sections/sticky.html`, `visit.js` |
| Menu order: The Fourth Corner first, the two other signatures last | **Serial position effect** (primacy + recency) | `src/data/menu.js` array order |
| $14 Courthouse Reserve Flight placed beside the $5.75 signature | **Anchoring + decoy pricing** | `menu.js`, "For the ceremonious" card |
| Coffee match quiz: each drink is a 6-D flavor vector; your answers sum to a preference vector; drinks ranked by **cosine similarity** | Real math, plus **micro-commitments** before the ask | `src/lib/match.js`, `quiz.js` |
| "EXTRA! EXTRA!" result reveal, bean confetti, "you vs. drink" flavor chart | **Peak-end rule** (the peak) | `quiz.js`, `quiz.css` |
| "Make it yours" builder (milk / sweetness / extra shot) that pre-fills the hold form | **IKEA effect** + **commitment consistency** | `quiz.js` → `fc:drink-chosen` → `hold.js` |
| "See you on the corner." dusk scene with lights coming on | **Peak-end rule** (the end) | `sections/finale.html`, `motion.js` |
| Punch card starts at 2/10, labeled honestly as a welcome gift; each punch animates; copy frames the remaining distance | **Endowed progress** + **goal-gradient effect** | `punch.js` |
| Hero CTA copy chosen per visitor by **Thompson sampling** over 3 variants (Beta posteriors, Gamma-based sampler), learning from clicks in `localStorage` | Multi-armed bandit | `src/lib/bandit.js`, `bandit-cta.js` |
| Barista's Pick changes daily (deterministic hash of the shop-local date) | **Variable reward / curiosity** | `src/lib/pick.js`, `today.js` |
| Type `sousa` (or tap the logo 5x) for a coffee-bean marching band | **Variable reward**, a hidden delight | `easter.js` |
| Live "Open now · until 6 PM" everywhere, hours never hidden | Reduces uncertainty, the #1 local-intent question | `src/lib/hours.js`, `today.js` |
| "Is it busy?" with the day's curve and "quietest next" time, labeled "Estimate based on a typical day, not a live count" | Honest **expectation-setting** | `src/lib/busy.js`, `today.js` |
| Letters to the Editor, visibly labeled fictional; playful stats instead of fake ratings | **Social proof**, done honestly | `sections/letters.html` |
| Week hours in a `<details>`; quiz one question at a time; builder after the result | **Progressive disclosure** | `today.html`, `quiz.js` |
| Headline top-left → cup right → CTA bottom-left on desktop; menu and today cards in F-scan rows | **Z- and F-pattern** hierarchy | `hero.css`, `today.css`, `menu.css` |
| JSON-LD `CafeOrCoffeeShop` (hours + menu), OG/Twitter tags, semantic landmarks, fast CWV | **Local SEO** | `src/seo/jsonld.js`, `index.html` |
| Time-of-day mood (Morning/Afternoon/Evening/Late Edition, light/dark) | Contextual relevance | inline head script, `theme.js`, `hero-gl.js` |

**Hard rules we kept:** no pop-ups, no countdowns, no fake scarcity, no guilt copy, and no pre-checked boxes. Every demo form says plainly that nothing leaves the browser.

## Accessibility & motion

- WCAG AA contrast from tokens, a visible `:focus-visible` ring, a skip link, landmarks, labeled inputs, inline errors with `aria-describedby`, and `aria-live` for status, quiz result, and punch progress.
- `prefers-reduced-motion`: no Lenis, no pinning (the journey becomes a vertical stack), one static WebGL frame, no cursor, instant reveals.
- The custom cursor and magnetic buttons only apply to fine pointers. The native cursor stays visible except over the latte (where you "stir").

## Verified

- `npm test`: 27/27 passing.
- Browser (Chrome, via Playwright): screenshots at 375, 768, and 1440 px, normal and reduced motion; no console errors and no horizontal overflow at any width. Quiz → result → hold-form prefill, punch card, dark mode, and pinned journey were driven end to end.
- Lighthouse mobile (production build, 4 runs): Performance 94–96, Accessibility 100, Best Practices 100, SEO 100. CLS 0, TBT 120–190 ms, LCP 2.5 s.
- Independent code-review pass: 11 findings, 9 fixed (bandit double-counting on reload, one failed chunk disabling all features, over-chatty live regions, focus handoff to the hold form, reveal flash, ticket timezone, minute-aligned status, WebGL restore, JSON-LD "fictional"). Two low-risk ones left: see below.

## Known limits / deliberately left out

- **Bandit learning is per-browser.** With no backend, each visitor's `localStorage` only learns from that visitor. Real aggregation needs a tiny endpoint; the sampler would not change.
- **Canonical and `og:url`** need an absolute URL, so add them once there's a domain (see the comment in `index.html`).
- **Forms don't send anything.** Reservations and the loyalty sign-up are demos by design.
- **Parking tips are general on purpose.** No specific lots, prices, or rules were invented.
- **Quiz without JS:** the form renders and submits, but scoring needs JS.
- The JSON-LD reads data at config time, so restart `npm run dev` after editing the menu or hours.
- Two low-risk review items not fixed: if you activate the sticky bar's "Hold my drink" in the ~1s before the motion bundle loads, focus can drop to `<body>` when the bar hides; and the easter-egg toast's live region is created at trigger time, so some screen readers may miss its first announcement.
