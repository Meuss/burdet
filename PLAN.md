# Wedding Website — Project Spec

## Overview

A single-page wedding website with an RSVP form. Static-generated Nuxt site hosted on Netlify, with form submissions captured redundantly across three independent systems to ensure no data loss.

Domain will be [stephanie-jeremy.ch](http://stephanie-jeremy.ch)

## Stack

- **Framework:** Nuxt 4 (static mode via `nuxt generate`)
- **Hosting:** Netlify
- **Domain:** Registered at Infomaniak, DNS pointed to Netlify (nameservers stay at Infomaniak, add A/CNAME records)
- **Serverless:** Netlify Functions (TypeScript)
- **Form backend (primary):** Google Sheets via Sheets API v4, authenticated with a service account
- **Form backup 1:** Netlify Forms (built-in submission capture)
- **Form backup 2:** Transactional email on every submission (Resend recommended — clean API, generous free tier)
- **Spam protection:** Honeypot field + Netlify's built-in filtering
- **Styling:** Tailwind CSS

## Site structure

Single page (`pages/index.vue`) with sections:

- Hero / couple names / date
- Practical info
- RSVP form

Static generation: no SSR needed. Build output is pure HTML/CSS/JS plus the serverless function.

## Design / Content

Website will be in french. Clean, simple, and effective design. White background, black text, and gold lettering for the titles.

We will probably add one photo of the couple.

Have a look at the pictures in the `infos/` directory: there is the invitation there, and some information that they want to share on the website.

## RSVP form

### Fields

- Nom et prénom (required)
- Nom et prénom de l'accompagnant·e (optional)
- Adresse (required)
- Localité (required)
- Téléphone (required)
- Adresse e-mail (optional)
- Enfants : nombre (optional, numeric)
- Restrictions alimentaires (free text)
- Déplacement avec votre propre véhicule ? (oui / non — required)
- Message pour les mariés (optional)
- Honeypot field (hidden, must be empty on submit)

### Submission flow

1. User submits the form on the client.
2. Form POSTs to `/.netlify/functions/submit-rsvp` **and** is captured by Netlify Forms in parallel (via `data-netlify="true"` on the form element, or a separate hidden form registration trick for JS-submitted forms — see implementation note below).
3. The Netlify Function runs three operations, ideally in parallel with `Promise.allSettled` so one failure doesn't block the others:
    - Append a row to the Google Sheet
    - Send a notification email with the full payload to the couple (and optionally to you as project owner)
    - Log the submission so that netlify saves the form submission data
4. Return a success response to the client if at least the email _or_ the sheet write succeeded. Surface a friendly error if all backends failed.
5. Client shows a thank-you state.

### Why three backends

- **Google Sheets** — primary, easy for the couple to browse and sort.
- **Netlify Forms** — independent of our code; survives bugs in the function.
- **Email** — immutable inbox record; survives everything else including account loss on Google or Netlify.

Losing one is fine. Losing two still leaves a full record. Losing all three requires simultaneous failures across three independent providers, which is acceptable for a wedding RSVP.

## Google Sheets setup

- Create a Google Cloud project.
- Enable the Google Sheets API.
- Create a service account; download the JSON key.
- Create the target Google Sheet; share it with the service account email (editor access).
- Store the service account credentials in Netlify environment variables:
    - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
    - `GOOGLE_PRIVATE_KEY` (watch out for newline escaping)
    - `GOOGLE_SHEET_ID`
- In the function, use `googleapis` (official library) or `google-auth-library` + a direct Sheets API call.
- Sheet columns should match form fields, plus a timestamp and a submission ID (UUID) for traceability.

## Email setup (Resend)

- Sign up at resend.com, verify a sending domain (can be a subdomain of the wedding domain, e.g. `mail.thewedding.tld`).
- Add SPF/DKIM records at Infomaniak DNS.
- Store `RESEND_API_KEY` in Netlify environment variables.
- Email template: subject line includes the guest name and attending status; body contains the full submission payload as a readable block.
- Send to: the couple's email(s) + optionally yours as a belt-and-braces backup.

Alternatives if you prefer: Postmark, SendGrid, Mailgun. Resend is the simplest.

## Netlify Forms capture

For a JS-submitted form (which ours is, since we're calling a function), Netlify needs a static HTML form registered at build time to recognize submissions. Two options:

1. Include a hidden static form in the HTML with the same name and fields — Netlify scans it at build time and registers it. Then POST to `/` with `form-name` as a field in addition to calling the function.
2. Or, drop Netlify Forms and rely on the email + sheet only. Acceptable downgrade if it's annoying to wire up.

Recommended: do option 1. The extra wiring is small and the third backup is worth having.

## DNS setup (Infomaniak → Netlify)

- Keep nameservers at Infomaniak (don't delegate to Netlify).
- In Infomaniak DNS panel, add:
    - `A` record for apex (`@`) pointing to Netlify's load balancer IP (Netlify will give you the current one)
    - `CNAME` for `www` pointing to the Netlify site URL (`your-site.netlify.app`)
- In Netlify, add the custom domain and let it provision a Let's Encrypt cert.
- Add DNS records for Resend (SPF, DKIM) once you set up the sending domain.

## Environment variables (Netlify)

```
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEET_ID
RESEND_API_KEY
RESEND_FROM_ADDRESS
NOTIFICATION_RECIPIENTS  (comma-separated: couple + you)
```

## Project layout

```
/
├── nuxt.config.ts
├── package.json
├── pages/
│   └── index.vue
├── components/
│   ├── RsvpForm.vue
│   └── [other section components]
├── netlify/
│   └── functions/
│       └── submit-rsvp.ts
├── public/
│   └── [images, favicon]
└── netlify.toml
```

## Build and deploy

- `netlify.toml` declares build command (`npm run generate`), publish directory (`.output/public` or `dist/` depending on Nuxt version), and functions directory (`netlify/functions`).
- Connect the GitHub repo to Netlify for auto-deploy on push.
