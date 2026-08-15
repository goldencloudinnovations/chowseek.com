import { SITE, isConfiguredStoreUrl } from './config.js';
const menuButton = document.querySelector('[data-menu-button]');
const mobileMenu = document.querySelector('[data-mobile-menu]');
menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    mobileMenu?.toggleAttribute('data-open', !open);
});
mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
        menuButton?.setAttribute('aria-expanded', 'false');
        mobileMenu.removeAttribute('data-open');
    });
});
// Screenshot slots intentionally fail gracefully until real app screenshots are added.
document.querySelectorAll('img[data-screenshot]').forEach((image) => {
    const showImage = () => image.closest('[data-shot-frame]')?.setAttribute('data-loaded', 'true');
    if (image.complete && image.naturalWidth > 0)
        showImage();
    image.addEventListener('load', showImage);
    image.addEventListener('error', () => image.remove());
});
const appStoreLinks = document.querySelectorAll('[data-store="ios"]');
const playStoreLinks = document.querySelectorAll('[data-store="android"]');
appStoreLinks.forEach((link) => {
    if (isConfiguredStoreUrl(SITE.appStoreUrl))
        link.href = SITE.appStoreUrl;
});
playStoreLinks.forEach((link) => {
    if (isConfiguredStoreUrl(SITE.googlePlayUrl))
        link.href = SITE.googlePlayUrl;
});
// Keep unconfigured store buttons useful: send visitors to /app, which explains availability.
document.querySelectorAll('[data-store]').forEach((link) => {
    if (!link.href || link.getAttribute('href') === '#')
        link.href = '/app/';
});
const year = document.querySelector('[data-year]');
if (year)
    year.textContent = String(new Date().getFullYear());
