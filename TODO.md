# TODO — Next steps

Things that still need to happen outside the codebase (accounts, credentials, DNS, content). Work through roughly top-to-bottom — each section notes what depends on what.

---

## 1. Content to confirm with Stéphanie & Jérémy

The site renders, but a few pieces of copy are either placeholders or guesses from the scanned `infos/`. Ask them to sign off or fill in:

- [ ] **Apéritif** — section currently says "Plus d'informations à venir prochainement." The invitation scan had "Apéritif ???" so they probably haven't decided. Add location + time when known. Edit [SectionProgramme.vue](app/components/SectionProgramme.vue).
- [ ] **Taxi Viman phone number** — currently rendered as `079 …`. Get the real number. Edit [SectionInfos.vue](app/components/SectionInfos.vue).
- [ ] **Marco Gorgoni's phone number** — same, `079 …` placeholder. Edit [SectionContacts.vue](app/components/SectionContacts.vue).
- [ ] **Reception address** — scan says "Chemin du Claru 4, Marly-le-Grand." Double-check the street name spelling (is it Claru or Claruz?) and the town (Marly vs Marly-le-Grand — "Marly-le-Grand" is the old name for part of Marly, worth checking what they want printed).
- [ ] **Church address** — "Église Saint-Jean, Planche-Supérieure 9, 1700 Fribourg." Verify. Quick Google Maps check should settle it.
- [ ] **Couple photo** — plan mentions they "will probably add one photo." Once they send it:
    - drop the file into [public/](public/) (e.g. `public/couple.jpg`)
    - add an `<NuxtImg src="/couple.jpg" … />` block in the appropriate section (probably between Intro and Programme)

---

## 2. Netlify site

- [ ] Sign up / log into [Netlify](https://app.netlify.com/).
- [ ] Push this repo to GitHub (private repo is fine).
- [ ] In Netlify: **Add new site → Import from Git**, select the repo. Netlify will read [netlify.toml](netlify.toml) — build command and publish dir are already configured.
- [ ] First build will fail (or succeed but the function won't work) until env vars are set — that's expected. Come back after the rest of the setup.

---

## 3. Google Sheets (primary form sink)

- [ ] Create a new Google Sheet. Name the tab something boring like `rsvp`.
- [ ] First row = headers. Match the order the function writes (see `SHEET_COLUMNS` in [submit-rsvp.ts](netlify/functions/submit-rsvp.ts)):
    ```
    submittedAt | submissionId | fullName | plusOne | address | phone | email | transportBus | transportTaxi | transportSelf | dietary | message
    ```
- [ ] Copy the **Sheet ID** from the URL (`https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`) — save it for env vars.
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/) → **Create a new project** (e.g. `stephanie-jeremy-rsvp`).
- [ ] In that project: **APIs & Services → Library → Google Sheets API → Enable**.
- [ ] **IAM & Admin → Service accounts → Create service account**:
    - Name: `rsvp-writer` (or similar)
    - No role needed at the project level for this use case
    - Create → **Keys tab → Add key → JSON** → download the file. Keep it safe; you'll copy two values out of it.
- [ ] Open the downloaded JSON. Grab:
    - `client_email` → goes into `GOOGLE_SERVICE_ACCOUNT_EMAIL`
    - `private_key` → goes into `GOOGLE_PRIVATE_KEY` (includes `-----BEGIN PRIVATE KEY-----` etc.)
- [ ] Back in the Google Sheet: **Share** → add the service account's `client_email` as **Editor**. The function can't write otherwise.

---

## 4. Resend (email backup)

- [ ] Sign up at [resend.com](https://resend.com/).
- [ ] **Domains → Add Domain** — use a subdomain of `stephanie-jeremy.ch`, e.g. `mail.stephanie-jeremy.ch`. (Keeps the apex domain's reputation clean.)
- [ ] Resend will show SPF, DKIM, (optional) DMARC records to add at Infomaniak. Keep that tab open — you'll add those in the DNS step below.
- [ ] **API Keys → Create API Key** with send-only permission. Save the value for `RESEND_API_KEY`.
- [ ] Decide on the **from** address — e.g. `rsvp@mail.stephanie-jeremy.ch`. That's your `RESEND_FROM_ADDRESS`.
- [ ] Decide on **recipients** — at minimum, the couple's email(s), plus your own for a belt-and-braces backup. Comma-separated list → `NOTIFICATION_RECIPIENTS`.

---

## 5. DNS at Infomaniak

Do this once the Netlify site exists and you know the sending subdomain.

- [ ] **Keep nameservers at Infomaniak** — don't delegate to Netlify.
- [ ] In Infomaniak's DNS panel for `stephanie-jeremy.ch`, add:
    - `A` record for apex `@` → Netlify's load balancer IP (`75.2.60.5` currently, but copy whatever the Netlify dashboard tells you under **Domain management → DNS → External DNS**).
    - `CNAME` for `www` → the Netlify site URL (`<your-site>.netlify.app`).
- [ ] Add the Resend records from step 4:
    - `TXT` for SPF on the sending subdomain
    - `CNAME` (or `TXT`, depending on Resend's instructions) for DKIM
    - optional `TXT` for DMARC
- [ ] Wait for DNS propagation. `dig stephanie-jeremy.ch` should return the Netlify IP.
- [ ] In Netlify: **Domain management → Add custom domain** → `stephanie-jeremy.ch`. Add `www.stephanie-jeremy.ch` as an alias. Let Netlify provision the Let's Encrypt cert automatically.
- [ ] Back in Resend, click **Verify** on the domain once DNS is live.

---

## 6. Netlify environment variables

Settings → **Environment variables** → add **all six**:

| Name                           | Value                                                                |
| ------------------------------ | -------------------------------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON key                                     |
| `GOOGLE_PRIVATE_KEY`           | `private_key` from the JSON key — **paste as-is with real newlines** |
| `GOOGLE_SHEET_ID`              | ID from the Sheet URL                                                |
| `RESEND_API_KEY`               | from Resend dashboard                                                |
| `RESEND_FROM_ADDRESS`          | e.g. `rsvp@mail.stephanie-jeremy.ch`                                 |
| `NOTIFICATION_RECIPIENTS`      | comma-separated: couple's emails + yours                             |

Notes:

- **Newline gotcha on `GOOGLE_PRIVATE_KEY`**: Netlify's UI handles real multi-line values fine — paste the key exactly as it appears in the JSON (including the literal `\n` escape sequences that are already in the JSON string). The function calls `rawKey.replace(/\\n/g, '\n')` to unescape them, so either "real newlines" or the `\n`-escaped single-line form works. If auth errors show up at runtime, this is the first thing to re-check.
- After adding vars, trigger a redeploy (**Deploys → Trigger deploy → Clear cache and deploy**) so the function picks them up.

---

## 7. End-to-end test

Once it's deployed and DNS is live:

- [ ] Visit the live site. Submit a real RSVP (use your own data).
- [ ] Verify a row appeared in the Google Sheet.
- [ ] Verify you received the notification email.
- [ ] In Netlify: **Forms → rsvp**. Confirm the submission is listed there too (third backup).
- [ ] Check **Functions → submit-rsvp → Logs** — should show one `rsvp submission` log with `sheet: fulfilled`, `email: fulfilled`, `netlifyForms: fulfilled`.
- [ ] **Honeypot test:** in the browser console on the live site, `document.querySelector('input[name=website]').value = 'bot'` then submit. The function should return 200 silently without writing to any sink. Check the sheet / email / forms to confirm nothing landed.

---

## 8. Nice-to-haves (optional)

- [ ] OG image for social sharing — drop a nicely designed 1200×630 image at `public/og.jpg` and add a `<meta property="og:image">` in [nuxt.config.ts](nuxt.config.ts).
- [ ] Favicon — the default Nuxt one is in [public/favicon.ico](public/favicon.ico). Replace with something monogram-ish (`S&J` in gold on white) if the couple cares.
- [ ] Add a "save the date" calendar link (ICS file or Google Calendar deep link) on the hero CTA.
- [ ] Once the photo is in, consider a soft background tint or a vertical gold line divider between sections for a bit more warmth.
- [ ] Analytics — Netlify has built-in analytics ($9/mo). Free alternative: Plausible or Umami. Skip entirely if the couple doesn't care.

---

## 9. Before launch

- [ ] Reread every section on a phone. Wedding guests will mostly open this on mobile.
- [ ] Try the form on Safari iOS specifically — text inputs with underline borders can render oddly.
- [ ] Spell-check the French copy one more time (accents on `é`, `à`, `ç`, typographic apostrophes `’` not straight `'`).
- [ ] Send the URL to the couple for sign-off.
- [ ] Make sure the Google Sheet is shared with the couple as viewers/editors so they can see responses roll in.
