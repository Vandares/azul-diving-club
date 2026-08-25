# Azul Diving Club

Landing page for Azul Diving Club — a PADI five-star dive center with its own training
pools, a private beach entry, and certified dive captains.

Static site: plain HTML, CSS, and vanilla JS. No build step, no framework, no dependencies.

## Structure

```
index.html        — English (LTR)
ar/index.html     — Arabic (RTL)
css/style.css     — design tokens, layout, responsive rules, RTL + Arabic overrides
js/main.js        — mobile nav, scroll reveals, depth-rail progress, canvas water animation
assets/           — logo and photography (pre-optimized JPEG/WebP)
```

## Languages

The site ships as two real HTML pages rather than a JS translation layer, so both
languages are indexable and work without JavaScript. They are linked to each other with
`hreflang` (including `x-default`) and both appear in `sitemap.xml`.

Both pages share one stylesheet and one script. The Arabic page carries `lang="ar"` and
`dir="rtl"`, which is all the CSS needs — two scoped blocks at the end of `css/style.css`
handle the rest:

- `[lang="ar"]` swaps the type system to IBM Plex Sans Arabic (Fraunces and Inter Tight
  have no Arabic coverage) and, critically, resets `letter-spacing` and `font-style`.
  Tracking breaks Arabic's cursive joins, and a synthetic italic reads as a rendering
  fault. Latin digits still resolve to IBM Plex Mono so depth readings keep their look.
- `[dir="rtl"]` mirrors the handful of directional rules — the depth rail, the mobile
  drawer, the hero scrim gradient, and the accent rules on the pull-quote and creeds.

No LTR rule was rewritten, so the English page is unaffected by either block.

**When editing content, change both pages.** They are deliberate duplicates; nothing
syncs them automatically. Section `id`s must stay identical in both, because `js/main.js`
looks sections up by `id` for the depth rail, the active-nav link, and the depth
attenuation.

## Run locally

Any static file server works, e.g.:

```
npx serve .
```

Then open the printed local URL.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, "Add New… → Project" and import the GitHub repo.
3. Framework preset: **Other** (static site). No build command, no output directory needed —
   `index.html` is already at the project root.
4. Deploy.
