# Fourth Corner Coffee: brand bible

Fourth Corner Coffee is a **fictional** shop on the downtown square in Noblesville, Indiana. Its people are made up too. The square, the courthouse, the White River and Hamilton County are real. Don't make up anything about real businesses, people, events or awards.

## Name and tagline
- **Name:** Fourth Corner Coffee. Short form "Fourth Corner" is fine. Never "4th Corner".
- **Tagline:** *Est. on the square. Loud on Saturdays.*

## Founding story
A downtown square has four sides, and people cross it. Marguerite "Mags" Pruitt spent 31 years as a high-school band director telling kids to "find your corner and hold it." When she retired she opened a shop with her nephew Theo, who roasts in small batches in the back. She named it for the corner the square was missing: the one where you stop. On Saturday mornings a brass trio plays, which is where "loud on Saturdays" comes from. (Mags, Theo and the trio are all fictional.)

## Voice: the small-town newspaper columnist
Warm, dry, proud of the town, and brief. Use at most one pun per section. Eyebrows use newspaper words: Morning Edition, Features, Classifieds, Public Opinion Poll, Letters to the Editor, Public Notice.

| Do | Don't |
|---|---|
| "Open until 6. The chairs by the window go first." | "Hurry! Seats are filling up fast!" |
| "Theo roasted Tuesday. It's good. He'd want you to know." | "Our artisanal, curated single-origin journey." |
| "Pick a drink and we'll hold it at the counter." | "Welcome to our website! Elevate your coffee experience." |
| "Closed for today. Opens at 7 on Saturday, brass trio included." | "Sorry, you missed us! Don't miss out next time." |
| "That's not a time we're open. Try between 6:30 and 6." | "Invalid input. Error: time out of range." |
| "Signed you up. Two punches on the house for showing up." | "You're not a real regular until you join." |

Banned: "Welcome to our website", "elevate", "curated", "artisanal", marketing uses of "journey", countdowns, fake scarcity, guilt, and emoji.

## Logo
- **Mark:** a square outline with the top-right corner block filled brass (`--brass`, #C79A3B). The outline uses `currentColor` (`--fg`) so it follows the theme.
- **Wordmark:** "Fourth Corner" in Playfair Display 700. Put the mark to its left, with a gap of about 0.6x the mark's width.
- Keep at least the width of the brass block as clear space on every side. The mark should be 20px or larger (16px is fine for the favicon).
- Brass is decoration on light backgrounds (2.08:1), so never use it for text there. On dark backgrounds it can be text (6.7:1).
- Don't rotate the mark, move the brass block to another corner, add a drop shadow, or put the logo on a photo.
- Files: `public/favicon.svg`, plus the inline SVG in `sections/header.html` (class `brand__mark`; the outline rect has `pathLength="1"` so it can be drawn in on load).

## Microcopy you can reuse
1. Loading status: "Checking the clock…"
2. Empty filter: "Nothing on the board matches that. Try fewer chips."
3. Form success: "Held. It'll be at the counter with your name on it."
4. Closed state: "Closed for now. The courthouse clock says we'll be back soon."
5. Closing soon: "Closing soon. Last call is a real thing here."
6. Email joined: "You're on the list. We'll write when something's worth writing about."
7. Field error: "We'll need a name for the cup."
8. Offline or no JS: "The fancy parts didn't load. The coffee is unaffected."
9. Busy estimate label: "Estimate based on typical days, not a live count."
10. 404 / lost: "This corner doesn't exist. The other three are around here somewhere."
