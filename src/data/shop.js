// Shop facts. Fourth Corner Coffee is FICTIONAL; the street address is deliberately a placeholder.
export const SHOP = {
  name: 'Fourth Corner Coffee',
  tagline: 'Est. on the square. Loud on Saturdays.',
  timeZone: 'America/Indiana/Indianapolis',
  locality: 'Noblesville',
  region: 'IN',
  addressNote: 'On the square, Noblesville, IN · street address is a placeholder: Fourth Corner is a fictional shop.',
  mapsQuery: 'Noblesville downtown square, Noblesville, IN',
  googleMaps: 'https://www.google.com/maps/search/?api=1&query=Noblesville+downtown+square+Noblesville+IN',
  appleMaps: 'https://maps.apple.com/?q=Noblesville+downtown+square&near=Noblesville,IN'
};

// Opening hours in shop-local minutes since midnight, keyed by JS weekday (0 = Sunday).
export const HOURS = {
  0: { open: 8 * 60, close: 14 * 60 },
  1: { open: 6 * 60 + 30, close: 18 * 60 },
  2: { open: 6 * 60 + 30, close: 18 * 60 },
  3: { open: 6 * 60 + 30, close: 18 * 60 },
  4: { open: 6 * 60 + 30, close: 18 * 60 },
  5: { open: 6 * 60 + 30, close: 18 * 60 },
  6: { open: 7 * 60, close: 20 * 60 }
};

// Hand-authored "typical day" busyness, 0–1, indexed by hour 0–23 (value applies at hh:00;
// interpolate between). Zero outside open hours. This is an ESTIMATE, not live data.
export const BUSY = {
  weekday:  [0,0,0,0,0,0,.35,.85,.95,.7,.5,.45,.7,.6,.35,.3,.4,.45,0,0,0,0,0,0],
  saturday: [0,0,0,0,0,0,0,.4,.75,.95,1,.9,.8,.65,.5,.45,.5,.6,.7,.55,0,0,0,0],
  sunday:   [0,0,0,0,0,0,0,0,.5,.8,.95,.85,.6,.4,0,0,0,0,0,0,0,0,0,0]
};
