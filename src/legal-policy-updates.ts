export type LegalPolicyKey = 'terms' | 'privacy';

export interface LegalPolicyVersion {
  revision: number;
  version: string;
  publishedAt: string;
  effectiveAt: string;
  url: string;
  isCurrent: boolean;
}

export interface LegalPolicySummary {
  name: string;
  currentRevision: number;
  lastUpdatedAt: string;
  effectiveAt: string;
  currentUrl: string;
  historyUrl: string;
  versions: LegalPolicyVersion[];
}

export interface LegalPolicyManifest {
  schemaVersion: number;
  lastUpdatedAt: string;
  notification: {
    id: string;
    updatedAt: string;
    title: string;
    body: string;
    policies: LegalPolicyKey[];
  };
  policies: Record<LegalPolicyKey, LegalPolicySummary>;
}

export interface LegalPolicyUpdateDecision {
  manifest: LegalPolicyManifest;
  notificationId: string;
  shouldNotify: boolean;
  isFirstCheck: boolean;
}

/**
 * Fetch the current legal-policy manifest without relying on a cached response.
 * Native/mobile apps can use the same endpoint and comparison logic even if
 * they do not import this browser-oriented helper directly.
 */
export async function checkForLegalPolicyUpdate(
  lastSeenNotificationId: string | null,
  manifestUrl = 'https://chowseek.com/legal/versions.json',
): Promise<LegalPolicyUpdateDecision> {
  const url = new URL(manifestUrl);
  url.searchParams.set('_', String(Date.now()));

  const response = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Unable to check legal policy versions (${response.status})`);
  }

  const manifest = (await response.json()) as LegalPolicyManifest;
  const notificationId = manifest.notification.id;
  const isFirstCheck = lastSeenNotificationId === null;

  return {
    manifest,
    notificationId,
    isFirstCheck,
    // First launch seeds the current ID without showing an "update" notice.
    shouldNotify: !isFirstCheck && lastSeenNotificationId !== notificationId,
  };
}
