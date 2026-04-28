# Burdet

Wedding website for Stéphanie & Jérémy — [stephanie-jeremy.ch](https://stephanie-jeremy.ch).

Static-generated Nuxt 4 site hosted on Netlify, with an RSVP form backed by three redundant sinks.

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

## Deployment
Push to the `master` branch to trigger Netlify deployment. The site is live at [stephanie-jeremy.ch](https://stephanie-jeremy.ch).

## RSVP submission

The form is JS-submitted. To avoid losing a guest's response to a single point of failure, three independent sinks run in parallel:

1. **Google Sheets** (primary log) — the Netlify Function appends a row via the Sheets API. Column order lives in `SHEET_COLUMNS` in [submit-rsvp.ts](netlify/functions/submit-rsvp.ts); the live sheet's header row must match it.
2. **Resend email** — notification sent from `no-reply@stephanie-jeremy.ch` to the address in `NOTIFICATION_TO`.
3. **Netlify Forms** — a hidden static form ([NetlifyFormShim.vue](app/components/NetlifyFormShim.vue)) is registered at build time so the submission is captured by Netlify Forms too. The client posts to it on success as a fire-and-forget third backup.

The Netlify Function returns `200` if either (1) or (2) succeeds. (3) is best-effort.

A hidden honeypot field is silently 200'd by both the function and Netlify Forms.

### Failure alerts

If anything goes wrong, an alert email goes to `OPS_ALERT_TO` with the error and the full submission payload:

- One sink failed → `⚠️ RSVP partial failure` (data is still safe via the surviving sink)
- Both sinks failed → `🚨 RSVP COMPLETELY LOST` (data only lives in Netlify Forms / function logs)
- Handler crashed → `🚨 RSVP function crash`

Blind spot: if Resend itself is the failure mode, the alert email can't get through. Netlify Forms captures the submission as the fallback and the error appears in Netlify function logs.

### Required environment variables

| Var                            | Purpose                                               |
| ------------------------------ | ----------------------------------------------------- |
| `RESEND_API_KEY`               | Resend API key for notification + alert emails        |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account with edit access to the sheet         |
| `GOOGLE_PRIVATE_KEY`           | Service account private key (escape newlines as `\n`) |
| `GOOGLE_SHEET_ID`              | ID of the spreadsheet to write to                     |
