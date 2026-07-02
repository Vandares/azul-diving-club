# Azul Diving Club

Landing page for Azul Diving Club — a PADI five-star dive center with its own training
pools, a private beach entry, and certified dive captains.

Static site: plain HTML, CSS, and vanilla JS. No build step, no framework, no dependencies.

## Structure

```
index.html
css/style.css     — design tokens, layout, responsive rules
js/main.js        — mobile nav, scroll reveals, depth-rail progress, canvas water animation
assets/           — logo and photography (pre-optimized JPEG/WebP)
```

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
