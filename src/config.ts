export const SITE = {
  name: 'Chowseek',
  domain: 'https://chowseek.com',
  supportEmail: 'support@chowseek.com',
  // Replace these two values before launch. The /app page uses them for redirects.
  appStoreUrl: 'REPLACE_WITH_APP_STORE_URL',
  googlePlayUrl: 'REPLACE_WITH_GOOGLE_PLAY_URL',
  screenshots: {
    search: '/screenshots/search.png',
    results: '/screenshots/results.png',
    details: '/screenshots/details.png',
  },
} as const;

export function isConfiguredStoreUrl(value: string): boolean {
  return /^https:\/\//i.test(value) && !value.includes('REPLACE_WITH_');
}
