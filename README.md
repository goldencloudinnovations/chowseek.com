# Chowseek website

A responsive TypeScript marketing site for **https://chowseek.com**. It includes:

- One-page mobile SaaS landing page
- `/app/` device detection and App Store / Google Play redirect
- Desktop `/app/` fallback with both store buttons
- `/privacy/` Privacy Policy starter page
- `/terms/` Terms & Conditions starter page
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

That makes direct visits work cleanly on GitHub Pages without a client-side router/SPA 404 hack.

## 6. Privacy Policy / Terms review

The legal pages are intentionally marked as **starter language**. They were drafted around functionality visible in the supplied Chowseek source (account auth, location-based recommendations, saved data, subscriptions, device integrity/security signals, and third-party place/map/payment services).

Before public launch, have counsel review at least:

- Exact legal entity/company name
- Business/contact address if required
- Governing law and dispute terms
- Subscription, cancellation, refund, and trial rules
- Final third-party vendors and analytics
- Data retention/deletion behavior
- Children/minimum-age handling
- California/US state privacy disclosures, GDPR/UK GDPR, or other regional terms if applicable
- Apple App Privacy and Google Play Data Safety disclosures for consistency with the policy

The current contact email is `support@chowseek.com`. Change it in the HTML/legal text if that mailbox is not the one you want to publish.

## 7. Main files

```text
index.html                     Main landing page
app/index.html                 Smart store redirect / desktop chooser
privacy/index.html             Privacy Policy
terms/index.html               Terms & Conditions
src/config.ts                  Store URLs + screenshot paths
src/main.ts                    Landing page behavior
src/app.ts                     iOS/Android detection + redirects
src/styles.css                 Full responsive design
public/screenshots/            Drop your app screenshots here
public/CNAME                   chowseek.com custom domain
.github/workflows/             GitHub Pages deploy action
```

## 8. Optional copy edits

The landing-page copy is based on the current app behavior in the archive: natural-language food search, map-based recommendations, saved searches/places/notes/reminders, and richer recommendation signals. Update any marketing claims before launch if production behavior changes.
