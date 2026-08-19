# Chowseek website

A responsive TypeScript marketing site for **https://chowseek.com**. It includes:

- One-page mobile SaaS landing page
- `/app/` device detection and App Store / Google Play redirect
- Desktop `/app/` fallback with both store buttons
- `/privacy/` full Privacy Policy (Last Updated August 1, 2026)
- `/terms/` full Terms & Conditions (Effective August 1, 2026)
- `/cookie/` full Cookie Policy (Effective August 1, 2026)
- Site-wide cookie consent banner, category preferences, Global Privacy Control handling, and California sale/sharing opt-out controls
- Screenshot placeholders that automatically switch to your real app screenshots
- GitHub Pages deployment workflow
- `CNAME` preconfigured for `chowseek.com`

## 1. Before launch: set the store URLs

Open:

`src/config.ts`

Replace:

```ts
appStoreUrl: 'REPLACE_WITH_APP_STORE_URL',
googlePlayUrl: 'REPLACE_WITH_GOOGLE_PLAY_URL',
```

with your real URLs, for example:

```ts
appStoreUrl: 'https://apps.apple.com/app/id1234567890',
googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.example.chowseek',
```

After that:

- `https://chowseek.com/app` on iPhone/iPad redirects to the App Store.
- `https://chowseek.com/app` on Android redirects to Google Play.
- Desktop/other devices see a nice chooser with both links.

If a store URL is still a placeholder, Chowseek intentionally **does not redirect to a broken URL**. The button is shown disabled instead.

## 2. App screenshots: exactly what to capture

The home page has three phone slots. Put screenshots in:

`public/screenshots/`

using **exactly** these names:

### `search.png`
Take this from Chowseek's main map screen **before** a result is selected.

Good capture:
- Map visible
- Search bar visible
- A natural query typed, such as `vegan ramen open late` or `coffee with wifi`
- Avoid exposing your real home/current location

### `results.png`
Take this immediately after a recommendation finishes.

Good capture:
- Map pins visible
- Recommendation/result strip visible at the bottom
- Use a visually interesting but non-personal demo area

### `details.png`
Open one recommended place and take a screenshot of the place-detail view.

Good capture:
- Restaurant/place name visible
- Match/recommendation details visible
- Any useful details that communicate *why* Chowseek picked it

### Screenshot consistency

For the cleanest website:

- Use the same phone/platform for all 3 screenshots.
- Use portrait orientation.
- Native modern phone screenshots are ideal; roughly 9:19–9:20 aspect ratio.
- Use the same light/dark theme across all screenshots.
- Keep personal email, exact home location, billing data, and other private information out of the captures.

You do **not** need to edit HTML. The website tries to load those PNG files and automatically removes the placeholder when they exist.

## 3. Run locally

Requirements: Node.js 20+ (Node 22 recommended). The only development dependency is TypeScript; there is no frontend framework or runtime dependency.

```bash
npm install
npm run dev
```

The built-in local server will print the preview URL (default: `http://localhost:4173`).

To test the production build:

```bash
npm run build
npm run preview
```

## 4. Deploy to GitHub Pages

### New repository

1. Create a GitHub repository (for example `chowseek-site`).
2. Copy this folder into the repository.
3. Commit and push it to the `main` branch.
4. In GitHub go to **Settings → Pages**.
5. Under **Build and deployment → Source**, choose **GitHub Actions**.
6. The included `.github/workflows/deploy-pages.yml` builds and deploys automatically.

### Custom domain: `chowseek.com`

`public/CNAME` already contains:

```text
chowseek.com
```

In GitHub **Settings → Pages**, set the custom domain to `chowseek.com` and enable **Enforce HTTPS** after DNS is valid.

At your DNS provider, configure the records GitHub currently documents for an apex custom domain. GitHub can change its recommended DNS records, so use the current GitHub Pages custom-domain documentation rather than copying old IP addresses from this README.

If you also want `www.chowseek.com`, configure `www` as GitHub recommends and redirect it to the apex domain at your DNS/domain provider if desired.

## 5. Route behavior on GitHub Pages

This project is multi-page rather than relying on SPA history routing. The build creates real files for:

- `/index.html` → `chowseek.com`
- `/app/index.html` → `chowseek.com/app`
- `/privacy/index.html` → `chowseek.com/privacy`
- `/terms/index.html` → `chowseek.com/terms`
- `/cookie/index.html` → `chowseek.com/cookie`

That makes direct visits work cleanly on GitHub Pages without a client-side router/SPA 404 hack.

## 6. Legal policies and cookie consent

The repository now contains the supplied final legal policies as native HTML pages:

- `/privacy/` — Chowseek Privacy Policy, last updated August 1, 2026
- `/terms/` — Chowseek Terms and Conditions, effective August 1, 2026
- `/cookie/` — Chowseek Cookie Policy, effective August 1, 2026

The pages preserve the source policy wording and structure, including subsection emphasis, the Privacy Policy California information table, the italicized Cookie Policy home-page consent statement, and links to referenced policies, providers, browser cookie instructions, and contact email addresses.

### Cookie controls

`src/cookies.ts` provides the site-wide consent interface. On a first visit it shows:

- **Accept All**
- **Reject Non-Essential**
- **Manage Preferences**

The preference dialog exposes **Necessary**, **Functional**, **Analytics**, and **Advertising** categories. Necessary is always enabled. Consent is stored in local storage under `chowseek.cookieConsent.v1`.

The script also:

- honors a browser Global Privacy Control (`GPC`) signal by keeping advertising/sale-sharing opted out;
- provides persistent **Cookie Settings** controls in site footers;
- provides a **Do Not Sell or Share My Personal Information** control;
- dispatches a `chowseek:consentchange` browser event when consent changes; and
- exposes `window.ChowseekConsent` with `getPreferences()`, `isGranted(category)`, and `openPreferences()`.

### Gate future non-essential scripts

There are no Google Analytics, Microsoft Clarity, advertising pixels, or other non-essential tracking scripts enabled in this repository today. If you add one, do not insert it as an immediately executable script. Mark it as consent-gated instead:

```html
<script
  type="text/plain"
  data-consent-category="analytics"
  data-src="https://example.com/analytics.js"
></script>
```

Supported categories are `functional`, `analytics`, and `advertising` (`necessary` is also recognized for completeness). `cookies.ts` activates a gated script only after the required category has been granted. A consent-gated iframe can use `data-consent-category` together with `data-consent-src`.

If a provider has its own consent/revocation API, wire that API to the `chowseek:consentchange` event as well, because a JavaScript file that has already executed cannot be unloaded from a page.

### Registration and subscription checkout

The current marketing site does not contain a website account-registration flow or a website subscription checkout, so no fake acceptance/checkout UI has been added. If either flow is added later, keep it consistent with the published Terms: show Terms & Conditions and Privacy Policy links at registration, and collect the separate affirmative acknowledgment required for automatically renewing subscriptions in addition to general Terms acceptance.

### Source-document structure note

The supplied Terms PDF has a Table of Contents with 20 entries while the body is organized into 16 Roman-numeral sections, with Governing Law, Assignment, Severability, and Contact Us under Section XVI, Miscellaneous. The HTML preserves the supplied Table of Contents wording and the supplied body structure rather than silently rewriting the legal document. The Table of Contents links point to the closest corresponding body anchors.

## 7. Main files

```text
index.html                     Main landing page
app/index.html                 Smart store redirect / desktop chooser
privacy/index.html             Privacy Policy
terms/index.html               Terms & Conditions
cookie/index.html              Cookie Policy
src/config.ts                  Store URLs + screenshot paths
src/main.ts                    Landing page behavior
src/app.ts                     iOS/Android detection + redirects
src/cookies.ts                 Cookie consent, GPC, preference controls, gated-resource activation
src/styles.css                 Full responsive design
public/screenshots/            Drop your app screenshots here
public/CNAME                   chowseek.com custom domain
.github/workflows/             GitHub Pages deploy action
```

## 8. Optional copy edits

The landing-page copy is based on the current app behavior in the archive: natural-language food search, map-based recommendations, saved searches/places/notes/reminders, and richer recommendation signals. Update any marketing claims before launch if production behavior changes.
