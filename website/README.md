# truex marketing website

A standalone, responsive marketing site that carries the product's clean blue aesthetic into a public-facing experience. It reuses the colors, typography, agent tints, dotted surfaces and glass objects from `design/join-tenant-v3-capabilities.html` and `design/truex-design-spec.html`.

## Preview

From the repository root:

```sh
python3 -m http.server 5173
```

Open [localhost:5173/website/](http://localhost:5173/website/). No package installation or build step is required.

## Files

- `index.html` — complete page, content and metadata.
- `styles.css` — page layout, theme, responsive styling and accessibility states.
- `board.css` — capability board styling.
- `board.html` — source fragment for the capability board; the homepage is the preview entry point.
- `site.js` — client-side interactions and the illustrative product walkthrough.
- `fonts/` — self-hosted variable fonts and their open-source licenses.
- `favicon.svg` — the product spark mark.
- `social-card.svg` / `social-card.png` — editable sharing image and raster export.

The capability board fragment is included in `index.html`; update both if changing its markup.

The walkthrough is a static illustration. It does not run agents, call a product backend, or represent live activity. Contact buttons open an email draft to `ashokjoe@gmail.com`; the website does not submit or store contact details.

## Before launch

Confirm the company name, product availability, capability descriptions, contact address and any required legal copy. Set the final domain, canonical URL and social image URL in the page metadata. Product examples are illustrative; add customer logos, testimonials, metrics or certifications only after they are verified and approved.

## Validation

Checked desktop and phone rendering, 320px/390px/768px/1280px layout overflow, keyboard tab navigation, mobile menu/Escape, persistent light/dark themes, dialog focus and the encoded email draft. `node --check website/site.js` passes.
