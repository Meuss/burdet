# CLAUDE.md

## Project

Wedding website for Stéphanie & Jérémy (domain: stephanie-jeremy.ch). Single-page static site in French with an RSVP form. Full spec in [PLAN.md](PLAN.md) — treat it as the source of truth for scope, fields, and flow.

## Stack

- **Nuxt 4** in static-generation mode (`nuxt generate`). App code lives in [app/](app/) per Nuxt 4 conventions (not `src/` or root).
- **Tailwind CSS** via `@nuxtjs/tailwindcss`.
- **`@nuxt/image`** for the couple photo and any other imagery.
- **Netlify** hosting + **Netlify Functions** (TypeScript) for the RSVP submit handler.
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

## RSVP form — non-obvious bits

- Three redundant submission sinks run in parallel via `Promise.allSettled` in the Netlify Function: Google Sheets (primary), Resend email, and Netlify Forms. Success if _any_ of sheet/email succeeds. See [PLAN.md](PLAN.md) §"Submission flow".
- Netlify Forms needs a **static hidden HTML form** registered at build time (because the real form is JS-submitted). Don't skip this — it's the third independent backup.
- Honeypot field on the form — server must reject submissions where it's non-empty.
- `GOOGLE_PRIVATE_KEY` env var: watch newline escaping when loading into the function.

## What not to do

- Don't switch to SSR — this is statically generated on purpose.
- Don't delete the hidden Netlify Forms registration form thinking it's dead code.
- Don't add a database or CMS. Three form backends is the whole backend.
- Don't run `npm` or `yarn` commands — they will error by design.
