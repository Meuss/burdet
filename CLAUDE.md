# CLAUDE.md

## Project

Wedding website for Stéphanie & Jérémy (domain: stephanie-jeremy.ch). The wedding happened on 18 July 2026; the site is now a single static thank-you page in French — the couple's photo and a message, nothing else. The RSVP form and its three submission backends were removed afterwards (see [README.md](README.md)).

## Stack

- **Nuxt 4** in static-generation mode (`nuxt generate`). App code lives in [app/](app/) per Nuxt 4 conventions (not `src/` or root).
- **Tailwind CSS** via `@nuxtjs/tailwindcss`.
- **`@nuxt/image`** for the couple photo.
- **Netlify** hosting (static only — no functions).
- **Infomaniak** DNS (nameservers stay there; A/CNAME records point to Netlify).

## Package manager

pnpm only. `engine-strict=true` in [.npmrc](.npmrc) and npm/yarn are aliased to error messages in [package.json](package.json). Node >= 24 (see [.nvmrc](.nvmrc)).

```bash
pnpm install
pnpm dev         # localhost:3000
pnpm generate    # static build → .output/public
pnpm preview
```

## Conventions

- **Formatting:** Prettier with `prettier-plugin-organize-imports` and `prettier-plugin-tailwindcss`. 4-space indent, 120 print width, single quotes, semicolons. Config in [.prettierrc](.prettierrc).
- **Language:** All user-facing copy is French. Keep code identifiers in English.
- **Design:** White background, black text, gold accents for titles. Clean and simple — resist the urge to over-style.
- **Content source:** [infos/](infos/) contains the invitation and reference material the couple provided. Pull copy from there rather than inventing it.

## What not to do

- Don't switch to SSR — this is statically generated on purpose.
- Don't re-add the RSVP form, a database, or a CMS. The event is over; this site is a static page.
- Don't reinstate the event details (programme, practical info, times) as if the wedding were still upcoming.
- Don't run `npm` or `yarn` commands — they will error by design.
