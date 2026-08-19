export {};

type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'advertising';
type ConsentSource =
  | 'accept-all'
  | 'reject-non-essential'
  | 'manage-preferences'
  | 'do-not-sell-share'
  | 'gpc-adjustment';

type ConsentPreferences = {
  version: 1;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
  saleSharingOptOut: boolean;
  updatedAt: string;
  source: ConsentSource;
};

type ConsentApi = {
  getPreferences: () => ConsentPreferences | null;
  isGranted: (category: ConsentCategory) => boolean;
  openPreferences: () => void;
};

declare global {
  interface Window {
    ChowseekConsent?: ConsentApi;
  }
}

const STORAGE_KEY = 'chowseek.cookieConsent.v1';
const CONSENT_VERSION = 1 as const;

const gpcEnabled =
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

let currentPreferences: ConsentPreferences | null = readPreferences();
let banner: HTMLElement | null = null;
let dialog: HTMLDialogElement | null = null;
let functionalInput: HTMLInputElement | null = null;
let analyticsInput: HTMLInputElement | null = null;
let advertisingInput: HTMLInputElement | null = null;
let dialogStatus: HTMLElement | null = null;
let gpcNotice: HTMLElement | null = null;

init();

function init(): void {
  buildConsentUi();
  bindFooterControls();

  if (currentPreferences && gpcEnabled && currentPreferences.advertising) {
    currentPreferences = {
      ...currentPreferences,
      advertising: false,
      saleSharingOptOut: true,
      updatedAt: new Date().toISOString(),
      source: 'gpc-adjustment',
    };
    persistPreferences(currentPreferences);
  }

  applyConsentState(currentPreferences);

  if (!currentPreferences) {
    banner?.removeAttribute('hidden');
  }

  window.ChowseekConsent = {
    getPreferences: () => currentPreferences ? { ...currentPreferences } : null,
    isGranted: (category) => isCategoryGranted(category),
    openPreferences,
  };
}

function readPreferences(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (
      parsed.version !== CONSENT_VERSION ||
      parsed.necessary !== true ||
      typeof parsed.functional !== 'boolean' ||
      typeof parsed.analytics !== 'boolean' ||
      typeof parsed.advertising !== 'boolean' ||
      typeof parsed.saleSharingOptOut !== 'boolean' ||
      typeof parsed.updatedAt !== 'string' ||
      typeof parsed.source !== 'string'
    ) {
      return null;
    }

    return parsed as ConsentPreferences;
  } catch {
    return null;
  }
}

function persistPreferences(preferences: ConsentPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Consent still applies for this page even when storage is unavailable.
  }
}

function savePreferences(
  values: Pick<ConsentPreferences, 'functional' | 'analytics' | 'advertising'>,
  source: ConsentSource,
): void {
  const advertising = gpcEnabled ? false : values.advertising;
  const preferences: ConsentPreferences = {
    version: CONSENT_VERSION,
    necessary: true,
    functional: values.functional,
    analytics: values.analytics,
    advertising,
    saleSharingOptOut: gpcEnabled || !advertising,
    updatedAt: new Date().toISOString(),
    source,
  };

  currentPreferences = preferences;
  persistPreferences(preferences);
  applyConsentState(preferences);
  banner?.setAttribute('hidden', '');
  dialog?.close();
}

function applyConsentState(preferences: ConsentPreferences | null): void {
  const root = document.documentElement;
  root.dataset.consentNecessary = 'true';
  root.dataset.consentFunctional = String(preferences?.functional ?? false);
  root.dataset.consentAnalytics = String(preferences?.analytics ?? false);
  root.dataset.consentAdvertising = String(
    Boolean(preferences?.advertising && !preferences.saleSharingOptOut && !gpcEnabled),
  );
  root.dataset.saleSharingOptOut = String(
    Boolean(gpcEnabled || preferences?.saleSharingOptOut),
  );

  activateConsentResources();

  window.dispatchEvent(new CustomEvent('chowseek:consentchange', {
    detail: {
      preferences: preferences ? { ...preferences } : null,
      gpcEnabled,
    },
  }));
}

function isCategoryGranted(category: ConsentCategory): boolean {
  if (category === 'necessary') return true;
  if (!currentPreferences) return false;
  if (category === 'advertising') {
    return currentPreferences.advertising && !currentPreferences.saleSharingOptOut && !gpcEnabled;
  }
  return currentPreferences[category];
}

function activateConsentResources(): void {
  document
    .querySelectorAll<HTMLScriptElement>('script[type="text/plain"][data-consent-category]')
    .forEach((placeholder) => {
      if (placeholder.dataset.consentActivated === 'true') return;
      const category = parseCategory(placeholder.dataset.consentCategory);
      if (!category || !isCategoryGranted(category)) return;

      const active = document.createElement('script');
      for (const attribute of Array.from(placeholder.attributes)) {
        if (
          attribute.name === 'type' ||
          attribute.name === 'data-consent-category' ||
          attribute.name === 'data-consent-activated' ||
          attribute.name === 'data-src'
        ) continue;
        active.setAttribute(attribute.name, attribute.value);
      }

      const deferredSrc = placeholder.dataset.src;
      if (deferredSrc) active.src = deferredSrc;
      active.textContent = placeholder.textContent;
      placeholder.dataset.consentActivated = 'true';
      placeholder.after(active);
    });

  document
    .querySelectorAll<HTMLIFrameElement>('iframe[data-consent-category][data-consent-src]')
    .forEach((frame) => {
      const category = parseCategory(frame.dataset.consentCategory);
      if (!category) return;
      if (isCategoryGranted(category)) {
        const deferredSrc = frame.dataset.consentSrc;
        if (deferredSrc && !frame.src) frame.src = deferredSrc;
      } else if (frame.src) {
        frame.removeAttribute('src');
      }
    });
}

function parseCategory(value: string | undefined): ConsentCategory | null {
  if (
    value === 'necessary' ||
    value === 'functional' ||
    value === 'analytics' ||
    value === 'advertising'
  ) return value;
  return null;
}

function buildConsentUi(): void {
  if (document.querySelector('[data-cookie-banner]')) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <aside class="cookie-banner" data-cookie-banner hidden aria-label="Cookie choices">
      <div class="cookie-banner__inner">
        <div class="cookie-banner__copy">
          <strong>Cookie choices</strong>
          <p>Our website uses cookies and similar technologies. Choose “Accept All,” “Reject Non-Essential,” or “Manage Preferences” by category. For more information, read our <a href="/cookie/">Cookie Policy</a>.</p>
        </div>
        <div class="cookie-banner__actions">
          <button class="cookie-action cookie-action--accept" type="button" data-cookie-accept>Accept All</button>
          <button class="cookie-action cookie-action--reject" type="button" data-cookie-reject>Reject Non-Essential</button>
          <button class="cookie-action cookie-action--manage" type="button" data-cookie-manage>Manage Preferences</button>
        </div>
      </div>
    </aside>

    <dialog class="cookie-preferences" data-cookie-preferences aria-labelledby="cookie-preferences-title">
      <div class="cookie-preferences__panel">
        <button class="cookie-preferences__close" type="button" data-cookie-close aria-label="Close cookie preferences">×</button>
        <p class="cookie-preferences__eyebrow">Privacy controls</p>
        <h2 id="cookie-preferences-title">Cookie Preferences</h2>
        <p class="cookie-preferences__intro">Choose which non-essential technologies Chowseek may use on this website. Necessary technologies are always enabled because they support core functionality and security.</p>
        <p class="cookie-gpc-notice" data-cookie-gpc hidden><strong>Global Privacy Control detected.</strong> Advertising cookies and sale/sharing through cookies remain opted out while this browser signal is enabled.</p>

        <div class="cookie-preference-list">
          <label class="cookie-preference-row">
            <span><strong>Necessary</strong><small>Core site, account, preference, and security functionality.</small></span>
            <input type="checkbox" checked disabled aria-label="Necessary cookies always enabled" />
          </label>
          <label class="cookie-preference-row">
            <span><strong>Functional</strong><small>Features you request, including supported sign-in and routing functionality.</small></span>
            <input type="checkbox" data-consent-functional />
          </label>
          <label class="cookie-preference-row">
            <span><strong>Analytics</strong><small>Usage measurement and site-improvement tools, including analytics or session-replay tools when configured.</small></span>
            <input type="checkbox" data-consent-analytics />
          </label>
          <label class="cookie-preference-row">
            <span><strong>Advertising</strong><small>Marketing measurement and interest-based advertising technologies when configured.</small></span>
            <input type="checkbox" data-consent-advertising />
          </label>
        </div>

        <p class="cookie-preferences__status" data-cookie-status aria-live="polite"></p>

        <div class="cookie-preferences__actions">
          <button class="cookie-action cookie-action--accept" type="button" data-cookie-dialog-accept>Accept All</button>
          <button class="cookie-action cookie-action--reject" type="button" data-cookie-dialog-reject>Reject Non-Essential</button>
          <button class="cookie-action cookie-action--save" type="button" data-cookie-save>Save Preferences</button>
        </div>
        <p class="cookie-preferences__links"><a href="/cookie/">Cookie Policy</a> · <a href="/privacy/#california-residents">California Privacy Rights</a></p>
      </div>
    </dialog>
  `;

  while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

  banner = document.querySelector<HTMLElement>('[data-cookie-banner]');
  dialog = document.querySelector<HTMLDialogElement>('[data-cookie-preferences]');
  functionalInput = document.querySelector<HTMLInputElement>('[data-consent-functional]');
  analyticsInput = document.querySelector<HTMLInputElement>('[data-consent-analytics]');
  advertisingInput = document.querySelector<HTMLInputElement>('[data-consent-advertising]');
  dialogStatus = document.querySelector<HTMLElement>('[data-cookie-status]');
  gpcNotice = document.querySelector<HTMLElement>('[data-cookie-gpc]');

  document.querySelector('[data-cookie-accept]')?.addEventListener('click', acceptAll);
  document.querySelector('[data-cookie-reject]')?.addEventListener('click', rejectNonEssential);
  document.querySelector('[data-cookie-manage]')?.addEventListener('click', () => openPreferences());
  document.querySelector('[data-cookie-close]')?.addEventListener('click', () => dialog?.close());
  document.querySelector('[data-cookie-dialog-accept]')?.addEventListener('click', acceptAll);
  document.querySelector('[data-cookie-dialog-reject]')?.addEventListener('click', rejectNonEssential);
  document.querySelector('[data-cookie-save]')?.addEventListener('click', saveManagedPreferences);

  dialog?.addEventListener('click', (event) => {
    const activeDialog = dialog;
    if (activeDialog && event.target === activeDialog) activeDialog.close();
  });
}

function bindFooterControls(): void {
  document.querySelectorAll<HTMLElement>('[data-cookie-settings]').forEach((control) => {
    control.addEventListener('click', () => openPreferences());
  });

  document.querySelectorAll<HTMLElement>('[data-do-not-sell-share]').forEach((control) => {
    control.addEventListener('click', () => {
      const base = currentPreferences ?? defaultPreferences();
      savePreferences(
        {
          functional: base.functional,
          analytics: base.analytics,
          advertising: false,
        },
        'do-not-sell-share',
      );
      openPreferences('Advertising cookies are off and your sale/sharing opt-out has been saved.');
    });
  });
}

function defaultPreferences(): ConsentPreferences {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    functional: false,
    analytics: false,
    advertising: false,
    saleSharingOptOut: true,
    updatedAt: new Date().toISOString(),
    source: 'reject-non-essential',
  };
}

function acceptAll(): void {
  savePreferences(
    { functional: true, analytics: true, advertising: !gpcEnabled },
    'accept-all',
  );
}

function rejectNonEssential(): void {
  savePreferences(
    { functional: false, analytics: false, advertising: false },
    'reject-non-essential',
  );
}

function saveManagedPreferences(): void {
  savePreferences(
    {
      functional: Boolean(functionalInput?.checked),
      analytics: Boolean(analyticsInput?.checked),
      advertising: Boolean(advertisingInput?.checked),
    },
    'manage-preferences',
  );
}

function openPreferences(statusMessage = ''): void {
  if (!dialog) return;

  const base = currentPreferences ?? defaultPreferences();
  if (functionalInput) functionalInput.checked = base.functional;
  if (analyticsInput) analyticsInput.checked = base.analytics;
  if (advertisingInput) {
    advertisingInput.checked = gpcEnabled ? false : base.advertising;
    advertisingInput.disabled = gpcEnabled;
  }
  if (gpcNotice) gpcNotice.hidden = !gpcEnabled;
  if (dialogStatus) dialogStatus.textContent = statusMessage;

  banner?.setAttribute('hidden', '');
  if (!dialog.open) dialog.showModal();
}
