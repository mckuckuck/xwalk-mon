/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: MongoDB Try/Download site-wide cleanup.
 *
 * Removes non-authorable page chrome and widget/noise nodes so the import
 * contains only page-level authorable content (promo banner, hero, main).
 *
 * All selectors verified against the captured DOM:
 *   - migration-work/cleaned.html               (/try/download/community)
 *   - migration-work/try-signup/cleaned.html     (/try)
 *
 * Verified in captured DOM:
 *   nav.css-1ek23uy       -> site header nav (auto-populated, non-authorable)
 *   footer.css-1j19lrv    -> site footer (auto-populated, non-authorable)
 *   #mdb-icon-font-library-> hidden icon font sprite library (noise)
 *   iframe                -> Optimizely internal frame (noise)
 *   noscript / script     -> tracking/analytics noise (CHEQ etc.)
 *
 * NOTE: Cookie/consent (#onetrust-consent-sdk), reCAPTCHA badge iframes and
 * Intercom widgets described in the site shell are NOT present in the captured
 * DOM (already stripped by the scraper), so no selectors are added for them.
 * Per the DOM-only rule, only verified selectors are used here. If a future
 * capture contains those nodes, add their verified selectors to the
 * beforeTransform block below.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Widgets / overlays / noise that could interfere with block parsing.
    // Verified in captured DOM: hidden icon-font sprite div, Optimizely iframe.
    WebImporter.DOMUtils.remove(element, [
      '#mdb-icon-font-library',
      'iframe',
    ]);

    // Cookie-consent / privacy overlay. Present on the live page (injected by
    // OneTrust) but absent from the scraper-cleaned DOM. Never authorable.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#ot-sdk-btn-floating',
      '.onetrust-pc-dark-filter',
      '.ot-sdk-container',
    ]);

    // Live pages (imported directly, not from the scraper-cleaned DOM) inject
    // third-party tracking pixels/ad beacons. Two problems:
    //  1) Some URLs contain literal/encoded square brackets (usbrowserspeed.com /
    //     dpmsrv.com "...s[019f...]..."). html2md feeds these into new RegExp()
    //     and throws "Range out of order in character class", aborting the import.
    //  2) The rest are invisible 1x1 beacons (adnxs, bing, mathtag, adsrvr,
    //     googleadservices, trkn, etc.) that pollute the authored content with
    //     junk <img> tags.
    // None are authorable, so strip any <img>/<a>/<source> pointing at a known
    // beacon domain or carrying bracket characters.
    const BEACON_HOSTS = /(usbrowserspeed\.com|dpmsrv\.com|adnxs\.com|adsrvr\.org|mathtag\.com|bat\.bing\.com|googleadservices\.com|secure\.adnxs\.com|trkn\.us|insight\.adsrvr\.org|pixel\.mathtag\.com|cookielaw\.org|doubleclick\.net|facebook\.com\/tr|px\.ads\.|intercomcdn\.com|intercom\.io)/i;
    element.querySelectorAll('img[src], a[href], source[src], source[srcset], img[srcset]').forEach((node) => {
      const url = node.getAttribute('src') || node.getAttribute('href') || node.getAttribute('srcset') || '';
      if (/[[\]]/.test(url) || /%5b|%5d/i.test(url) || BEACON_HOSTS.test(url)) {
        node.remove();
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome. Verified in captured DOM:
    //   nav.css-1ek23uy  = site header/utility nav (search + menu)
    //   footer.css-1j19lrv = site footer
    WebImporter.DOMUtils.remove(element, [
      'nav.css-1ek23uy',
      'footer.css-1j19lrv',
      '#mdb-icon-font-library',
      'iframe',
      'script',
      'noscript',
      'link',
      // Collapsed mobile version of the download sidebar (a single selected-item
      // label + chevron). The desktop rail (.css-17fcl61 nav) is the authored
      // source; this mobile clone would otherwise leak a stray label into the
      // content. Verified: .css-7moep3 wraps only the mobile nav on all pages.
      '.css-7moep3',
    ]);
  }
}
