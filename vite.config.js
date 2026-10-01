import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { buildJsonLd } from './src/seo/jsonld.js';

// Stitches <!-- @include sections/x.html --> into index.html at dev and build time,
// so each section lives in its own file but ships as plain static HTML (good for SEO).
const include = () => ({
  name: 'html-include',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) =>
      html.replace(/<!--\s*@include\s+(\S+)\s*-->/g, (_, file) =>
        readFileSync(new URL(file, import.meta.url), 'utf8'))
  },
  handleHotUpdate({ file, server }) {
    if (file.includes('/sections/')) server.ws.send({ type: 'full-reload' });
  }
});

// Injects CafeOrCoffeeShop JSON-LD built from src/data (menu + hours), so it can't drift.
// ponytail: config-time import, so data edits need a dev-server restart to refresh the JSON-LD.
const jsonLd = () => ({
  name: 'json-ld',
  transformIndexHtml: () => [{
    tag: 'script',
    attrs: { type: 'application/ld+json' },
    children: JSON.stringify(buildJsonLd()).replace(/</g, '\\u003c'),
    injectTo: 'head'
  }]
});

export default defineConfig({
  // GitHub Pages serves from /fourth-corner-coffee/; the deploy workflow sets BASE_PATH. Local dev stays at /.
  base: process.env.BASE_PATH || '/',
  plugins: [include(), jsonLd()],
  build: { target: 'es2020' }
});
