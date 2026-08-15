import { SITE, isConfiguredStoreUrl } from './config.js';
function detectPlatform() {
    const ua = navigator.userAgent || navigator.vendor || '';
    const isIOS = /iPad|iPhone|iPod/i.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS)
        return 'ios';
    if (/Android/i.test(ua))
        return 'android';
    return 'other';
}
const platform = detectPlatform();
const appStoreReady = isConfiguredStoreUrl(SITE.appStoreUrl);
const playStoreReady = isConfiguredStoreUrl(SITE.googlePlayUrl);
// Automatic redirect only when the destination has actually been configured.
if (platform === 'ios' && appStoreReady) {
    window.location.replace(SITE.appStoreUrl);
}
else if (platform === 'android' && playStoreReady) {
    window.location.replace(SITE.googlePlayUrl);
}
const status = document.querySelector('[data-app-status]');
if (status) {
    if (platform === 'ios' && !appStoreReady) {
        status.textContent = 'The iOS App Store link has not been configured yet.';
    }
    else if (platform === 'android' && !playStoreReady) {
        status.textContent = 'The Google Play link has not been configured yet.';
    }
    else {
        status.textContent = 'Choose your platform to continue.';
    }
}
const iosLink = document.querySelector('[data-app-ios]');
const androidLink = document.querySelector('[data-app-android]');
if (iosLink) {
    iosLink.href = appStoreReady ? SITE.appStoreUrl : '#';
    iosLink.toggleAttribute('aria-disabled', !appStoreReady);
    iosLink.classList.toggle('store-button--disabled', !appStoreReady);
    if (!appStoreReady)
        iosLink.addEventListener('click', (event) => event.preventDefault());
}
if (androidLink) {
    androidLink.href = playStoreReady ? SITE.googlePlayUrl : '#';
    androidLink.toggleAttribute('aria-disabled', !playStoreReady);
    androidLink.classList.toggle('store-button--disabled', !playStoreReady);
    if (!playStoreReady)
        androidLink.addEventListener('click', (event) => event.preventDefault());
}
