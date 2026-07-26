# Burdet

Wedding website for Stéphanie & Jérémy — [stephanie-jeremy.ch](https://stephanie-jeremy.ch).

The wedding took place on 18 July 2026. The site is now a single static thank-you page: the photo and a message. The RSVP form and its three submission backends (Google Sheets, Resend, Netlify Forms) were removed once the day had passed — see the history before commit `5c2fded` if you ever need them back.

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

## Deployment

Push to the `master` branch to trigger Netlify deployment. The site is live at [stephanie-jeremy.ch](https://stephanie-jeremy.ch).
