# Fourth Corner Coffee — Design Spec

Date: 2026-09-30 · Status: approved concept, pending spec review

## 1. Goal

A single-page, experience-first website for a **fictional** independent coffee shop on the downtown square in Noblesville, Indiana. Its job: make a visitor want to walk in. Primary conversions, in order: **get directions / visit**, **hold my drink** (client-side reservation), **join the punch-card list**. No backend. No online ordering.

Success criteria:
- Runs locally with `npm install && npm run dev`; `npm run build` produces a static `dist/`.
- Lighthouse mobile ≥ 90 performance, ≥ 95 accessibility/SEO/best practices.
- No console errors at 375px, 768px, 1440px. No CLS from fonts or WebGL.
- Every feature in §6 works with keyboard only and under `prefers-reduced-motion`.
- `node --test` passes for pure logic (hours, busy curve, cosine match, bandit, daily pick).

## 2. Brand

- **Name:** Fourth Corner Coffee
- **Tagline:** "Est. on the square. Loud on Saturdays."
- **Story (invented):** A downtown square has four sides, and people cross it. Marguerite "Mags" Pruitt, a retired high-school band director (fictional), spent 31 years telling kids to "find your corner and hold it." She opened the shop with her nephew Theo (fictional), who roasts in the back in small batches, and named it for the corner the square was missing: the one where you stop. Saturday mornings a (fictional) brass trio plays. Hence "loud on Saturdays."
- **Real local references allowed:** the downtown square, the courthouse at its center, the White River, Hamilton County, Indiana. Indiana's sugar cream pie tradition. Nothing else real: no real businesses, people, events, or awards.
- **Address:** displayed as *"On the square, Noblesville, IN · street address is a placeholder: Fourth Corner is a fictional shop."* Map/directions links point to a real search for "Noblesville downtown square".
- **Voice:** a small-town newspaper columnist. Warm, dry, civic pride, at most one pun per section. Section eyebrows use newspaper vocabulary: *Morning Edition, Features, Classifieds, Letters to the Editor, Public Notice*. Banned: "Welcome to our website", "elevate", "curated", "artisanal journey", guilt trips, urgency.
- **Logo mark:** SVG square outline (stroke = `--fg`) with the top-right corner block filled `--brass`. Wordmark in Playfair Display.

## 3. Hours & time logic

Shop timezone: `America/Indiana/Indianapolis`. All open/closed/busy math runs in shop time via `Intl.DateTimeFormat(..., { timeZone })`, so any visitor anywhere sees the true state.

| Day | Hours |
|---|---|
| Mon–Fri | 6:30 AM – 6:00 PM |
| Sat | 7:00 AM – 8:00 PM |
| Sun | 8:00 AM – 2:00 PM |

- Status strings: "Open now · until 6 PM", "Closing soon · 25 min left" (≤ 30 min), "Closed · opens 7 AM Saturday".
- **Theme mood** follows the *visitor's* local clock: `morning` 5–11, `midday` 11–17, `evening` 17–21, `night` 21–5. Set as `data-mood` on `<html>`. `night` and `evening` use the dark palette. A manual toggle overrides it (stored in localStorage).
- **Busy estimator:** a hand-authored hourly curve per day type (weekday / Saturday / Sunday), values 0–1, linearly interpolated at 15-minute resolution. Labeled: "Estimate based on typical days, not a live count." Shows level (Quiet / Steady / Busy / Line out the door), a 24-bar sparkline of the day with "now" marked, and "Quietest next: 2:15 PM".
- **Barista's Pick:** deterministic by shop-local date: `hash(YYYY-MM-DD) % drinks.length`, excluding the flight. Same for every visitor that day.

## 4. Design tokens (src/styles/tokens.css)

```css
:root {
  /* primitives */
  --limestone: #EDE6D6; --limestone-2: #E3DAC6; --ink: #1B1A1F; --night: #16141A; --night-2: #221F27;
  --brick: #8E3B2E; --brick-night: #E07A5F; --brass: #C79A3B; --steam: #FBF8F2;
  /* semantic (day) */
  --bg: var(--limestone); --bg-2: var(--limestone-2); --fg: var(--ink); --muted: #5A5550;
  --accent: var(--brick); --on-accent: var(--limestone); --line: color-mix(in oklab, var(--ink) 18%, transparent);
  /* type */
  --font-display: "Playfair Display", Georgia, serif;
  --font-body: "DM Sans", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, monospace;
  --step--1: clamp(0.83rem, 0.8rem + 0.15vw, 0.9rem);
  --step-0: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --step-1: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --step-2: clamp(1.6rem, 1.4rem + 1vw, 2.2rem);
  --step-3: clamp(2.1rem, 1.7rem + 2vw, 3.4rem);
  --step-4: clamp(2.8rem, 2rem + 4.5vw, 6.5rem);
  /* space (spacious) */
  --s-1: .5rem; --s-2: 1rem; --s-3: 1.5rem; --s-4: 2.5rem; --s-5: 4rem; --s-6: 6rem;
  --radius: 14px; --radius-pill: 999px;
  /* motion */
  --ease-out: cubic-bezier(.16,1,.3,1);   /* expo.out */
  --ease-inout: cubic-bezier(.65,0,.35,1);
  --dur-ui: 200ms; --dur-reveal: 800ms; --dur-load: 1200ms;
  --tap: 48px; /* min touch target */
}
:root[data-theme="dark"] {
  --bg: var(--night); --bg-2: var(--night-2); --fg: var(--limestone); --muted: #A9A096;
  --accent: var(--brick-night); --on-accent: var(--night); --line: color-mix(in oklab, var(--limestone) 18%, transparent);
}
```

Contrast (verified): fg/bg 13.9 (day) and 14.7 (night); accent/bg 6.0 and 6.2; muted/bg 5.9 and 7.1; on-accent/accent ≥ 6.0. **Brass is never text on a light background** (2.08:1). It's decoration only in day mode and allowed as text in dark mode (6.7:1).
GSAP eases: reveals `expo.out` 0.8s, pinned scrub `none`, UI `power2.out` 0.2s, load choreography 1.2s total.

## 5. Menu (src/data/menu.js). Single source of truth

Flavor vector dims: `[sweet, bitter, creamy, strong, fruity, spice]`, each 0–1. ★ in the table marks signatures for this doc only; the UI uses an SVG badge, never an emoji or glyph icon. Display order = array order (serial position: best first and last). `tags` drive filter chips: `signature | seasonal | espresso | cold | tea | food | kids`.

| # | Name | Price | Tags | Tasting note (voice seed) | Vector |
|---|---|---|---|---|---|
| 1 | **The Fourth Corner** ★ | 5.75 | signature, espresso | Honey-oat latte, pinch of sea salt, brass-gold honey on top. Tastes like the first sunny bench of spring. | .6 .3 .8 .5 .1 .1 |
| 2 | Courthouse Reserve Flight *(anchor)* | 14.00 | espresso | Three single-origin pours side by side with a tasting card. For the person who reads the plaque on every statue. | .1 .5 .1 .6 .7 0 |
| 3 | Orchard Band Latte (seasonal) | 6.00 | seasonal, espresso | Apple butter, brown butter, cinnamon. September through November, or until Theo runs out of apples. | .75 .2 .8 .4 .5 .8 |
| 4 | Drip of the Day | 3.00 | — | Whatever Theo roasted Tuesday. Honest, hot, refillable. | .1 .6 .1 .6 .3 0 |
| 5 | Espresso | 3.25 | espresso | Two ounces of cocoa, cherry, and conviction. | 0 .8 0 .9 .4 0 |
| 6 | Cortado | 4.25 | espresso | Equal parts espresso and steamed milk. The diplomat of the menu. | .2 .5 .5 .7 .2 0 |
| 7 | Cappuccino | 4.75 | espresso | Dry foam, cocoa dust, the posture of a drum major. | .2 .5 .6 .6 .1 .1 |
| 8 | Saturday Mocha | 5.50 | espresso | Dark chocolate ganache and a double shot. Pairs with brass music. | .8 .4 .7 .5 0 .1 |
| 9 | Porch Swing Chai | 5.00 | tea | House-simmered chai, black pepper, cardamom, a slow creak. | .6 .2 .7 .2 .1 .9 |
| 10 | Washed Ethiopia Pour-Over | 5.00 | — | Jasmine, lemon peel, bergamot. Coffee that thinks it's tea. | .2 .3 0 .4 .95 0 |
| 11 | Junior Varsity Steamer | 3.00 | kids | Vanilla steamed milk with a foam mustache guarantee. | .8 0 .9 0 0 .1 |
| 12 | Sugar Cream Bar | 4.25 | food | Indiana's sugar cream pie, reworked into a bar with a brown-butter crust. | — |
| 13 | The Early Docket | 7.50 | food | Egg, sharp cheddar, and chive on a toasted English muffin. Court is in session. | — |
| 14 | Cheddar-Chive Scone | 3.75 | food | Flaky, savory, and aggressively buttered. | — |
| 15 | **Courthouse Clock** ★ | 4.50 | signature, espresso | Double ristretto over a demerara cube with a twist of orange. Keeps better time than you do. | .3 .8 0 .95 .5 .1 |
| 16 | **White River Cold Brew** ★ | 5.25 | signature, cold | Steeped 18 hours, a splash of maple cream, slow as the current. | .4 .5 .5 .7 .2 0 |

Decoy: the $14 flight sits beside the $5.75 signature so the signature reads as the easy yes. Food has no vector and is excluded from the quiz and the pick.

## 6. Page structure & features

Single page. Semantic landmarks: `header` (nav), `main` (sections), `footer`. Skip link. One primary CTA per section (Hick's Law); the accent-colored CTA style is reserved for that one CTA (Von Restorff).

| # | Section id | Eyebrow | Content | Primary CTA |
|---|---|---|---|---|
| 1 | `hero` | Morning Edition | OGL latte-art canvas + kinetic headline "Find your corner." + tagline + live open badge | Bandit CTA → `#visit` |
| 2 | `today` | Today on the square | Open status, busy estimator, Barista's Pick | "See the menu" |
| 3 | `journey` | Features | Bean to Cup: pinned horizontal scroll, 5 panels (Farm → Roast → Grind → Pour → Your seat on the square), parallax layers, text reveals. Vertical stack without pin on mobile < 768px and reduced motion. | none (story) |
| 4 | `menu` | Classifieds | Filter chips, cards with hover/focus previews (tasting note + flavor bars), "Surprise me" | "Take the match quiz" |
| 5 | `quiz` | Public Opinion Poll | 5 questions → cosine match → reveal with flourish → "Make it yours" builder (milk: whole/oat/none, sweetness: 0–2, extra shot toggle) | "Come try it: hold my drink" |
| 6 | `letters` | Letters to the Editor | 4–5 reviews visibly marked "fictional letters", plus playful stats ("3 brass instruments, 1 very patient neighbor") | none |
| 7 | `punch` | Loyalty | 10-slot punch card starts 2/10 filled ("Two on the house for showing up"). Email join; on submit, 3rd punch animates in. Stored in localStorage | "Punch my card" |
| 8 | `hold` | Reservations | Hold-my-drink form: name, drink (prefilled from quiz), pickup time (within open hours, validated), table-for-N optional. Inline validation, success card. No network | "Hold it" |
| 9 | `visit` | Getting Here | Stylized SVG square (courthouse center, one corner glowing), links: Google Maps / Apple Maps search, parking tips (general, hedged: street parking around the square, check posted limits, bike racks, walk from the river trails). Hours table with today highlighted | "Get directions" |
| 10 | `finale` | Public Notice | Dusk-over-the-square scene, "See you on the corner." Peak-end moment | "Get directions" |

Global:
- **Sticky mobile bar** (< 768px): two ≥ 48px buttons, "Directions" (accent) and "Hold my drink". Safe-area padded. Hidden while `#visit`/`#finale` in view.
- **Custom cursor + magnetic buttons:** pointer: fine devices only, off under reduced motion. Native cursor stays for text inputs.
- **Page-load choreography:** logo draws → headline letters rise (split by char, `aria-hidden` split copy + intact `aria-label`) → canvas fades in → CTA. ≤ 1.2s, skipped under reduced motion.
- **Easter egg:** typing `sousa` anywhere (not in inputs) triggers a coffee-bean marching band parade across the screen + toast "Mags would be proud." Also reachable via tapping the logo 5 times (mobile).
- **Bandit:** Thompson sampling over 3 hero CTA variants: "Get directions", "Save me a seat on the square", "Point me to the corner". Beta(1+clicks, 1+misses) per arm; an impression is counted once per session. localStorage key `fc.bandit.v1`. The learning is per-browser (documented limitation).
- **Reduced motion:** Lenis off, no pin/scrub, no canvas animation (static latte-art frame), reveals become instant, cursor off.

## 7. Architecture

```
index.html                 # <!-- @include sections/x.html --> markers
vite.config.js             # ~10-line include plugin (transformIndexHtml)
sections/*.html            # one file per section (parallel-safe ownership)
public/                    # favicon.svg, og.png, robots.txt
src/main.js                # imports + init order
src/styles/tokens.css, base.css, <feature>.css
src/data/menu.js, content.js (hours, busy curves, quiz questions, bandit variants)
src/lib/*.js               # PURE: hours.js, busy.js, match.js, bandit.js, pick.js
src/js/*.js                # DOM features: hero-gl, motion (lenis/scrolltrigger/cursor/magnetic/reveals), journey, today, menu, quiz, punch, hold, visit, bandit-cta, easter, theme
test/*.test.js             # node --test on src/lib
```

Dependencies: `gsap`, `lenis`, `ogl`; dev: `vite`. Fonts via Google Fonts with `display=swap` + preconnect + size-adjusted fallbacks to avoid CLS. `hero-gl.js` dynamically imported after first paint; falls back to static SVG if WebGL is unavailable.

## 8. SEO / a11y / perf

- `CafeOrCoffeeShop` JSON-LD: name, description, `openingHoursSpecification`, `hasMenu` (Menu → MenuSection → MenuItem with offers in USD, generated to match menu.js), `servesCuisine`, `priceRange: "$"`, `address` with locality/region only (no fake street). Clear note in README that this is a fictional business.
- OG/Twitter tags, canonical, meta description, `lang="en"`, theme-color.
- WCAG AA: tokens verified above; visible `:focus-visible` ring (3px accent, offset 3px); all interactive ≥ 48px on touch; forms have labels + `aria-describedby` errors + `aria-live` status; quiz is a real `<form>` with radio groups; decorative canvas `aria-hidden`.
- Perf: WebGL DPR capped at 1.5, pauses when off-screen / tab hidden; ScrollTrigger only on desktop pin; no images > 100KB; inline SVG illustrations.

## 9. Out of scope

Online ordering, payments, real reservations/email, CMS, analytics, i18n, multi-page routing, server-side bandit aggregation.

## 10. Testing

- `node --test`: hours (open/closed/closing soon/next open across day and DST boundaries), busy interpolation and quietest-next, cosine ranking (known preference → expected drink), bandit (sampler returns [0,1]; arm with 50/0 beats 0/50 in > 95% of 1000 draws), daily pick deterministic.
- Browser: screenshots at 375 / 768 / 1440, console clean, keyboard pass, reduced-motion pass, Lighthouse mobile.
