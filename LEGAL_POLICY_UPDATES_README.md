# Updating Chowseek Terms & Privacy Policy versions

This file is the maintenance guide for the legal-policy version system.

The goal is simple:

- keep the current Terms and Privacy pages at their normal URLs;
- keep an immutable full HTML copy of every version that is actually published;
- list those versions in JSON;
- give the app one small JSON endpoint it can check whenever it opens; and
- let the app notify the user when the legal-policy notification ID changes.

Do **not** add placeholder, example, planned, or fake versions to any manifest. A version is added only when that exact policy has actually been published.

## Current files

Current policy pages:

```text
terms/index.html
privacy/index.html
```

Policy-specific version histories:

```text
terms/versions.json
privacy/versions.json
```

Immutable full-page archives:

```text
terms/versions/<VERSION-DATE>/index.html
privacy/versions/<VERSION-DATE>/index.html
```

Combined app-check manifest:

```text
public/legal/versions.json
```

The build copies these into `dist/`, so the deployed endpoints are:

```text
https://chowseek.com/legal/versions.json
https://chowseek.com/terms/versions.json
https://chowseek.com/privacy/versions.json
```

The current full archived documents are linked from the JSON manifests. Never overwrite an older archived version after it has been published.

## What the app should do on launch

The app only needs the combined endpoint:

```text
https://chowseek.com/legal/versions.json
```

On app open:

1. Fetch the endpoint without using a cached response.
2. Read `notification.id`.
3. Read the app's locally stored last-seen legal notification ID.
4. If no ID has ever been stored, store the current ID and do not show an "updated" notice on that first check.
5. If the stored ID is different from the fetched `notification.id`, show the notification.
6. Use `notification.policies` to know whether Terms, Privacy, or both changed.
7. Use each affected policy's `currentUrl` to open the current document.
8. After the notice has been shown or acknowledged, store the new `notification.id`.

`src/legal-policy-updates.ts` contains the same comparison logic for TypeScript clients and browser code.

## Timestamp and version rules

Use ISO 8601 UTC timestamps in JSON:

```text
YYYY-MM-DDTHH:MM:SSZ
```

The fields mean:

- `publishedAt`: when this exact version was published on Chowseek.
- `effectiveAt`: the date/time the policy says it becomes effective.
- `lastUpdatedAt`: the most recent `publishedAt` for that policy.
- top-level `lastUpdatedAt` in `public/legal/versions.json`: the newest legal publication timestamp across both policies.
- `notification.updatedAt`: when the legal update represented by the current notification ID was published.
- `version`: the publication date used in the archive folder and URL, formatted `YYYY-MM-DD`.
- `revision`: an integer that increases by one for that policy every time a real new version is published.

`publishedAt` and `effectiveAt` do not have to be the same.

## Updating only the Terms & Conditions

When a new Terms version is ready:

### 1. Finalize the live Terms page

Edit:

```text
terms/index.html
```

Make sure the policy wording and its displayed effective/updated date are final before archiving it.

### 2. Create the immutable archived copy

Create a new folder using the publication date:

```text
terms/versions/<VERSION-DATE>/
```

Copy the finalized `terms/index.html` into that folder as:

```text
terms/versions/<VERSION-DATE>/index.html
```

The archived HTML must contain the complete policy, not a redirect and not a summary.

Do not change any older folder under `terms/versions/`.

### 3. Update `terms/versions.json`

In:

```text
terms/versions.json
```

Do all of the following:

- increase `currentRevision` by `1`;
- set `lastUpdatedAt` to the new publication timestamp;
- set every old version's `isCurrent` to `false`;
- add the new version at the top of `versions`;
- give it the new revision number;
- set its `version`, `publishedAt`, `effectiveAt`, and permanent archive `url`;
- set the new entry's `isCurrent` to `true`.

Keep every previously published entry in the array.

### 4. Update `public/legal/versions.json`

Update the `policies.terms` object so it matches `terms/versions.json`.

Then update the top-level notification:

- change `notification.id` to a new unique value;
- set `notification.updatedAt` to the new publication timestamp;
- set `notification.policies` to only `terms`;
- adjust the notification title/body if needed;
- set top-level `lastUpdatedAt` to the newest publication timestamp across Terms and Privacy.

Do not change the Privacy revision just because Terms changed.

## Updating only the Privacy Policy

Use the same process, but with:

```text
privacy/index.html
privacy/versions/<VERSION-DATE>/index.html
privacy/versions.json
```

Then update only `policies.privacy` in:

```text
public/legal/versions.json
```

For the notification:

- create a new `notification.id`;
- set the new publication timestamp;
- set `notification.policies` to only `privacy`;
- update the title/body if needed;
- update the top-level `lastUpdatedAt`.

Do not change the Terms revision if the Terms did not change.

## Updating Terms and Privacy together

If both are actually published as new versions at the same time:

1. Update and archive the new Terms page.
2. Update and archive the new Privacy page.
3. Increment both policy revision numbers.
4. Update both policy-specific JSON manifests.
5. Update both policy objects inside `public/legal/versions.json`.
6. Create one new `notification.id` for that release.
7. Set `notification.policies` to both `terms` and `privacy`.
8. Set the top-level `lastUpdatedAt` to the newest publication timestamp.

A policy should only receive a new revision if its actual document changed.

## Notification ID rule

`notification.id` is the value the app compares on launch. It must change whenever you want already-installed apps to show a new legal-update notice.

It only needs to be unique and stable for that published legal update. Once deployed, do not reuse an old ID for a different update.

The current code treats the very first legal check on a fresh install as initialization: it stores the current ID without showing an update notification. Later ID changes trigger the notice.

## URLs must point to the complete archived policy

Every `versions[].url` must point directly to the full immutable HTML version for that entry.

Do not point historical entries at the live `/terms/` or `/privacy/` page, because those live pages will change later.

The current live page remains:

```text
https://chowseek.com/terms/
https://chowseek.com/privacy/
```

The archive URLs are what preserve exactly what a user would have agreed to or been shown for a specific revision.

## Check the JSON before deploying

From the project root, verify that all three JSON files parse:

```bash
node -e "JSON.parse(require('fs').readFileSync('terms/versions.json','utf8')); console.log('terms JSON OK')"
node -e "JSON.parse(require('fs').readFileSync('privacy/versions.json','utf8')); console.log('privacy JSON OK')"
node -e "JSON.parse(require('fs').readFileSync('public/legal/versions.json','utf8')); console.log('combined JSON OK')"
```

Also manually verify:

- there is exactly one `isCurrent: true` entry per policy;
- `currentRevision` equals that current entry's `revision`;
- every archived `url` has a matching local `index.html`;
- old revision entries were not removed;
- old archived HTML was not changed;
- `public/legal/versions.json` matches the two policy-specific manifests;
- `notification.policies` names only policies that actually changed; and
- the notification ID changed for the new release.

## Build and verify

Run:

```bash
npm run build
```

Then confirm these generated files exist:

```text
dist/legal/versions.json
dist/terms/versions.json
dist/privacy/versions.json
```

Also confirm the new archived policy exists under `dist`, for whichever policy was changed.

For a local production-style check:

```bash
npm run preview
```

Open the JSON endpoints and archived document URLs in the browser before deployment.

## Deploy

Deploy the site the same way as any other Chowseek website update. With the included GitHub Pages workflow, pushing the finished changes to the deployment branch triggers the build/deploy process configured for the repository.

After deployment, verify the live combined endpoint first:

```text
https://chowseek.com/legal/versions.json
```

Then verify:

- its `notification.id` is the new value;
- the updated policy revision is correct;
- the archive URL loads the complete policy;
- the normal `/terms/` and `/privacy/` URLs still load the current versions; and
- an app with the previous notification ID would see a mismatch.

## If you make a mistake before deployment

Fix the files normally before publishing.

## If you make a mistake after deployment

Do not silently replace an already-published archived legal version if users may already have received it. Publish a corrected new revision, archive it under a new version date, increment the revision, and issue a new notification ID.

That keeps the history honest and lets the app detect the correction like any other legal-policy update.
