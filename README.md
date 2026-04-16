# Burdet

Wedding website for Stéphanie & Jérémy — [stephanie-jeremy.ch](https://stephanie-jeremy.ch).

Static-generated Nuxt 4 site hosted on Netlify, with an RSVP form backed by Google Sheets, Resend email, and Netlify Forms as redundant sinks. Full spec in [PLAN.md](PLAN.md).

## Requirements

- Node `>= 24`
- pnpm `>= 10`

## Development

```bash
# http://localhost:3000
pnpm install
pnpm dev
```

## Build

```bash
# static output in .output/public
pnpm generate
pnpm preview
```
