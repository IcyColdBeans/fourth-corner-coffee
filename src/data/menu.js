// Single source of truth for the menu. Array order = display order (serial position:
// strongest items first and last). Flavor vector dims (FLAVOR_DIMS order), each 0–1.
// Food has vector: null and is excluded from the quiz and the daily pick.
export const FLAVOR_DIMS = ['sweet', 'bitter', 'creamy', 'strong', 'fruity', 'spice'];

export const MENU = [
  { id: 'fourth-corner', name: 'The Fourth Corner', price: 5.75, tags: ['signature', 'espresso'],
    note: 'Honey-oat latte, a pinch of sea salt, brass-gold honey on top. Tastes like the first sunny bench of spring.',
    vector: [.6, .3, .8, .5, .1, .1] },
  { id: 'reserve-flight', name: 'Courthouse Reserve Flight', price: 14.00, tags: ['espresso'], anchor: true,
    note: 'Three single-origin pours side by side, with a tasting card. For the person who reads the plaque on every statue.',
    vector: [.1, .5, .1, .6, .7, 0] },
  { id: 'orchard-band', name: 'Orchard Band Latte', price: 6.00, tags: ['seasonal', 'espresso'],
    note: 'Apple butter, brown butter, cinnamon. September through November, or until Theo runs out of apples.',
    vector: [.75, .2, .8, .4, .5, .8] },
  { id: 'drip', name: 'Drip of the Day', price: 3.00, tags: [],
    note: 'Whatever Theo roasted Tuesday. Honest, hot, refillable.',
    vector: [.1, .6, .1, .6, .3, 0] },
  { id: 'espresso', name: 'Espresso', price: 3.25, tags: ['espresso'],
    note: 'Two ounces of cocoa, cherry, and conviction.',
    vector: [0, .8, 0, .9, .4, 0] },
  { id: 'cortado', name: 'Cortado', price: 4.25, tags: ['espresso'],
    note: 'Equal parts espresso and steamed milk. The diplomat of the menu.',
    vector: [.2, .5, .5, .7, .2, 0] },
  { id: 'cappuccino', name: 'Cappuccino', price: 4.75, tags: ['espresso'],
    note: 'Dry foam, cocoa dust, and the posture of a drum major.',
    vector: [.2, .5, .6, .6, .1, .1] },
  { id: 'saturday-mocha', name: 'Saturday Mocha', price: 5.50, tags: ['espresso'],
    note: 'Dark chocolate ganache and a double shot. Pairs well with brass music.',
    vector: [.8, .4, .7, .5, 0, .1] },
  { id: 'porch-swing-chai', name: 'Porch Swing Chai', price: 5.00, tags: ['tea'],
    note: 'House-simmered chai with black pepper and cardamom, plus a slow creak.',
    vector: [.6, .2, .7, .2, .1, .9] },
  { id: 'ethiopia-pour-over', name: 'Washed Ethiopia Pour-Over', price: 5.00, tags: [],
    note: 'Jasmine, lemon peel, bergamot. Coffee that thinks it is tea.',
    vector: [.2, .3, 0, .4, .95, 0] },
  { id: 'jv-steamer', name: 'Junior Varsity Steamer', price: 3.00, tags: ['kids'],
    note: 'Vanilla steamed milk. Foam mustache guaranteed.',
    vector: [.8, 0, .9, 0, 0, .1] },
  { id: 'sugar-cream-bar', name: 'Sugar Cream Bar', price: 4.25, tags: ['food'],
    note: 'Indiana sugar cream pie, reworked into a bar with a brown-butter crust.', vector: null },
  { id: 'early-docket', name: 'The Early Docket', price: 7.50, tags: ['food'],
    note: 'Egg, sharp cheddar, and chive on a toasted English muffin. Court is in session.', vector: null },
  { id: 'cheddar-scone', name: 'Cheddar-Chive Scone', price: 3.75, tags: ['food'],
    note: 'Flaky, savory, aggressively buttered.', vector: null },
  { id: 'courthouse-clock', name: 'Courthouse Clock', price: 4.50, tags: ['signature', 'espresso'],
    note: 'Double ristretto over a demerara cube with a twist of orange. Keeps better time than you do.',
    vector: [.3, .8, 0, .95, .5, .1] },
  { id: 'white-river-cold-brew', name: 'White River Cold Brew', price: 5.25, tags: ['signature', 'cold'],
    note: 'Steeped 18 hours, finished with a splash of maple cream. Slow as the current.',
    vector: [.4, .5, .5, .7, .2, 0] }
];

export const DRINKS = MENU.filter((m) => m.vector);
