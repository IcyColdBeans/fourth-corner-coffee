// Builds the CafeOrCoffeeShop JSON-LD from the same data the page renders, so it can't drift.
// Used by the Vite plugin in vite.config.js at dev and build time.
import { MENU } from '../data/menu.js';
import { SHOP, HOURS } from '../data/shop.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// Group weekdays that share the same hours into one spec (Mon–Fri collapses to one entry).
function openingHours() {
  const groups = new Map();
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const h = HOURS[d];
    if (!h) continue;
    const key = `${h.open}-${h.close}`;
    if (!groups.has(key)) groups.set(key, { ...h, days: [] });
    groups.get(key).days.push(`https://schema.org/${DAYS[d]}`);
  }
  return [...groups.values()].map((g) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: g.days,
    opens: hhmm(g.open),
    closes: hhmm(g.close)
  }));
}

const item = (m) => ({
  '@type': 'MenuItem',
  name: m.name,
  description: m.note,
  offers: { '@type': 'Offer', price: m.price.toFixed(2), priceCurrency: 'USD' }
});

export function buildJsonLd() {
  const isFood = (m) => m.tags.includes('food');
  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: SHOP.name,
    description: `${SHOP.tagline} A fictional neighborhood coffee shop on the downtown square in Noblesville, Indiana: house-roasted coffee, sugar cream bars, and a brass trio on Saturday mornings.`,
    url: SHOP.siteUrl,
    image: SHOP.siteUrl + 'og.png',
    priceRange: '$',
    servesCuisine: ['Coffee', 'Pastries'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: SHOP.locality,
      addressRegion: SHOP.region,
      addressCountry: 'US'
    },
    openingHoursSpecification: openingHours(),
    hasMenu: {
      '@type': 'Menu',
      name: `${SHOP.name} menu`,
      hasMenuSection: [
        { '@type': 'MenuSection', name: 'Drinks', hasMenuItem: MENU.filter((m) => !isFood(m)).map(item) },
        { '@type': 'MenuSection', name: 'Food', hasMenuItem: MENU.filter(isFood).map(item) }
      ]
    }
  };
}
