# QA checklist (integrator, final pass)

Run against `npm run build && npx vite preview` at 375, 768, 1440 px, light and dark, with and without `prefers-reduced-motion: reduce` (DevTools > Rendering > Emulate CSS media feature).

## 1. Keyboard path (no mouse)
- [ ] First Tab shows "Skip to content"; Enter moves focus to `#main`.
- [ ] Header: logo link, nav links, theme toggle (`[data-theme-toggle]`) reachable; toggle works with Enter and Space and announces its state (`aria-pressed` or label change).
- [ ] Hero: bandit CTA reachable, goes to `#visit`. Canvas is not focusable.
- [ ] Today: "See the menu" reachable. Sparkline is not a tab stop.
- [ ] Journey: all 5 panels' content readable while tabbing; the pinned section never traps focus; focus never lands on an off-screen panel.
- [ ] Menu: filter chips are buttons with `aria-pressed`; "Surprise me" works; card hover previews (tasting note + flavor bars) also appear on `:focus-within`; "Take the match quiz" reachable.
- [ ] Quiz: real `<form>`; each question is a `fieldset`/`legend` radio group; arrow keys move within a group; submit reveals the match and moves focus to (or announces) the result; builder controls (milk radios, sweetness 0–2, extra-shot toggle) all keyboard-operable; "hold my drink" CTA reachable.
- [ ] Letters: no interactive traps; "fictional letters" label is visible text.
- [ ] Punch: email field labeled; submit with Enter; 3rd punch appears; status announced.
- [ ] Hold: name, drink (prefilled after quiz), pickup time, party size all labeled; invalid submit focuses the first invalid field; errors tied via `aria-describedby`; success card receives focus or is announced.
- [ ] Visit: Google Maps / Apple Maps links reachable; external links say so (text or `aria-label`); today's hours row distinguishable without color alone.
- [ ] Finale + footer: "Get directions" reachable.
- [ ] Sticky mobile bar (< 768px): both buttons reachable and ≥ 48px; hidden (and removed from tab order via `hidden`/`inert`) while `#visit`/`#finale` in view.
- [ ] Easter egg: typing `sousa` outside inputs fires parade + toast; typing it inside a form field does not. Toast is in an `aria-live` region and does not steal focus.

## 2. Focus visible
- [ ] Every interactive element shows the `:focus-visible` ring (3px accent, 3px offset) in light and dark.
- [ ] Ring is not clipped by `overflow: hidden` on cards, chips, the punch card, or the pinned journey track.
- [ ] Custom cursor never hides the focus ring; native cursor shows in text inputs.

## 3. Landmarks and headings
- [ ] Exactly one `header`, one `main#main`, one `footer`; nav is a `<nav>` with a label.
- [ ] One `<h1>` (hero "Find your corner."). Each section is `<section id aria-labelledby="{id}-title">` with an `<h2 id="{id}-title">`. Sub-items (menu cards, journey panels, letters) use `<h3>`. No skipped levels (axe "heading-order" clean).
- [ ] The SplitText headline keeps an intact accessible name (`aria-label` on the heading, split chars `aria-hidden`). Screen reader reads "Find your corner." once, not letter by letter.

## 4. Live regions
- [ ] `[data-open-status]` updates are polite (`aria-live="polite"`), not announced every tick.
- [ ] Busy estimator level, quiz result, punch-card status, hold form status/success, easter-egg toast: each has a polite live region that exists in the DOM before its text changes.
- [ ] Nothing uses `aria-live="assertive"` except form errors, if any.

## 5. Reduced motion (per feature)
- [ ] Lenis off (native scroll); anchor jumps are instant.
- [ ] Journey: no pin/scrub; vertical stack (same as < 768px).
- [ ] `[data-reveal]` elements visible immediately (no opacity 0 left behind).
- [ ] Hero: static latte-art frame, no rAF loop running (Performance panel shows idle).
- [ ] Page-load choreography skipped; headline visible on first paint.
- [ ] Custom cursor and magnetic buttons off.
- [ ] Punch 3rd-punch animation and quiz reveal flourish become instant state changes.
- [ ] Easter-egg parade: skipped or reduced to the toast only.
- [ ] Toggle the media query at runtime: no errors, no stuck half-animated states.

## 6. Contrast pairs (spec §4; spot-check with DevTools)
- [ ] `--fg` on `--bg` / `--bg-2`, both themes (≥ 13:1).
- [ ] `--accent` text on `--bg`, both themes (≥ 6:1); `--on-accent` on `--accent` buttons (≥ 6:1).
- [ ] `--muted` on `--bg` and on `--card` (≥ 4.5:1), both themes.
- [ ] Brass is never used for text in light theme (2.08:1). Check eyebrows, badges, punch slots, sparkline "now" label, visit map labels.
- [ ] Chip selected vs. unselected differ by more than color (weight, border, or check glyph in SVG).
- [ ] Disabled/placeholder text in forms ≥ 4.5:1, or not relied on for instructions.

## 7. Touch targets (375px)
- [ ] All buttons, chips, radio labels, links in nav/footer ≥ 48×48 CSS px (or 48px tall with ≥ 8px spacing).
- [ ] Punch slots are not buttons; the join form submit is.
- [ ] No horizontal scroll at 375px (check `document.documentElement.scrollWidth === innerWidth`).
- [ ] Page end has padding for the ~72px sticky bar + `env(safe-area-inset-bottom)`; footer text not covered.

## 8. CLS risks
- [ ] Fonts: `display=swap` + size-adjusted fallbacks; no visible reflow of the hero headline on swap.
- [ ] Hero canvas container has fixed aspect/size before `hero-gl` loads; static fallback occupies the same box.
- [ ] `[data-open-status]`, busy level, Barista's Pick, bandit CTA text: reserve space (min-width/min-height) so JS fill-in does not shift layout. Bandit variants differ in length; CTA must not change the hero height.
- [ ] Journey pin spacer is created before first scroll; no jump when ScrollTrigger refreshes after fonts load.
- [ ] Theme script in `<head>` prevents theme flash (no light→dark flip after load).
- [ ] Lighthouse CLS < 0.1 (target ≤ 0.02).

## 9. Console and network
- [ ] Console clean at 375/768/1440, both themes, reduced motion on and off, and with WebGL disabled (`--disable-webgl` or `chrome://flags`) so the SVG fallback path runs.
- [ ] Console clean with localStorage blocked (private window / third-party storage blocked): theme, bandit, punch, hold all degrade without throwing.
- [ ] `hero-gl` is its own JS chunk in `dist/assets/` and loads after first paint.
- [ ] No asset over 100KB except fonts; no external images.
- [ ] Canvas pauses when scrolled off-screen and when the tab is hidden.

## 10. SEO
- [ ] `dist/index.html` has one `application/ld+json` block that parses; Rich Results Test / schema.org validator shows CafeOrCoffeeShop with hours, 16 menu items, address without `streetAddress`.
- [ ] Meta description ≤ 155 chars; title unique; `lang="en"`.
- [ ] OG image `/og.png` is 1200×630 and renders in a card preview; twitter card is `summary_large_image`.
- [ ] Before deploy: make canonical, `og:url`, `og:image` absolute (comment in `index.html`).
- [ ] `/robots.txt` and `/favicon.svg` served from `dist/`.

## 11. Lighthouse (mobile, preview build)
- [ ] Performance ≥ 90 (LCP < 2.5s, TBT < 200ms, CLS < 0.1).
- [ ] Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- [ ] axe DevTools: zero serious/critical issues.
