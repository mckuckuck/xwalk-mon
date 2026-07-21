import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Normalize a path for comparison: drop a trailing slash and a `.html`
 * extension so `/try/download/community.html` and `/try/download/community/`
 * both reduce to `/try/download/community`.
 */
function normalize(p) {
  return (p || '').replace(/\.html$/, '').replace(/\/$/, '');
}

/**
 * Sidebar download navigation (left-rail).
 *
 * Expected authored structure — each row is one top-level nav entry whose cell
 * holds a `<p><a>` group/heading link, optionally followed by a `<ul>` of child
 * `<li><a>` links:
 *
 *   <div class="sidebar-nav">
 *     <div><div><p><a href="/try">MongoDB Atlas</a></p></div></div>
 *     <div><div>
 *       <p><a href="/try/download/enterprise-advanced">MongoDB Enterprise Advanced</a></p>
 *       <ul><li><a href="/try/download/enterprise">MongoDB Enterprise Server</a></li> …</ul>
 *     </div></div>
 *     …
 *   </div>
 *
 * Renders as an accordion: each row becomes a group (heading + collapsible list
 * of children). Like the source site, expansion is driven by the URL — only the
 * group whose heading or one of whose children matches the current page stays
 * expanded; all other groups collapse to just their heading. The matching link
 * gets the `is-active` state (bold + green accent bar). Groups with no children
 * (e.g. "MongoDB Atlas") render as a plain heading.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // In Universal Editor, each row is an instrumented `sidebar-nav-item` whose
  // cell carries the editable richtext (`data-aue-prop`). The full decoration
  // below detaches the heading/child links from those cells to rebuild the nav,
  // which strips the instrumentation and makes the block un-authorable (the
  // rail renders but nothing is selectable/editable). When instrumentation is
  // present, skip the destructive rebuild and leave the authored rows intact so
  // authors can edit each item; the published site (no instrumentation) still
  // gets the full accordion decoration.
  const inEditor = block.hasAttribute('data-aue-resource')
    || [...block.children].some((row) => row.hasAttribute('data-aue-resource'));
  if (inEditor) {
    block.classList.add('sidebar-nav-editing');
    return;
  }

  const nav = document.createElement('nav');
  nav.className = 'sidebar-nav-list';
  nav.setAttribute('aria-label', 'Download products');

  const currentPath = normalize(window.location.pathname);
  const hrefPath = (link) => normalize(link.getAttribute('href') || '');
  // A link matches the current page when their normalized paths are equal OR the
  // current path ends with the link's path. The latter handles environments
  // that serve the site under a prefix (e.g. the AEM author path
  // `/content/xwalk-mon/try/download/community`) where nav hrefs stay root-
  // relative (`/try/download/community`).
  const isCurrent = (link) => {
    const href = hrefPath(link);
    if (!href) return false;
    return currentPath === href || currentPath.endsWith(href);
  };

  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;

    const nestedList = cell.querySelector('ul, ol');
    const headingLink = cell.querySelector(':scope > p a, :scope > a');
    if (!headingLink) return;

    const group = document.createElement('div');
    group.className = 'sidebar-nav-group';
    // Preserve Universal Editor instrumentation: each authored row is an
    // editable `sidebar-nav-item`, so carry its data-aue-* attributes onto the
    // group element that replaces it — otherwise the rebuilt nav has nothing
    // for UE to select and the canvas renders blank in edit mode.
    moveInstrumentation(row, group);

    headingLink.classList.add('sidebar-nav-heading');
    if (isCurrent(headingLink)) headingLink.classList.add('is-active');
    group.append(headingLink);

    const childLinks = nestedList
      ? [...nestedList.querySelectorAll(':scope > li > a')]
      : [];

    // A group is expanded when the current page is its heading or one of its
    // children (accordion: exactly the active group is open).
    let activeInGroup = isCurrent(headingLink);

    if (childLinks.length) {
      const childList = document.createElement('div');
      childList.className = 'sidebar-nav-children';
      childLinks.forEach((link) => {
        link.classList.add('sidebar-nav-child');
        if (isCurrent(link)) {
          link.classList.add('is-active');
          activeInGroup = true;
        }
        childList.append(link);
      });
      group.append(childList);
      group.classList.toggle('is-expanded', activeInGroup);
    }

    if (activeInGroup) {
      const active = group.querySelector('.is-active');
      if (active) active.setAttribute('aria-current', 'page');
    }

    nav.append(group);
  });

  block.replaceChildren(nav);

  initScrollSpy(nav);
}

/**
 * Normalizes a label to a set of comparison tokens: lowercase words, with the
 * generic filler words that differ between nav labels and card headings removed
 * (e.g. nav "MongoDB Community Server" vs card "MongoDB Community Server
 * Download"). Two labels match when the nav label's tokens are a subset of the
 * card heading's tokens.
 */
function tokenize(text) {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !['download', 'the', 'for', 'and', 'a'].includes(w)),
  );
}

function isSubset(sub, sup) {
  if (!sub.size) return false;
  return [...sub].every((t) => sup.has(t));
}

/**
 * Scroll-spy: on pages that stack multiple download cards (cards-download), the
 * nav links point elsewhere but each card corresponds to a nav item by name.
 * As a card scrolls into view we mark its matching nav link `is-current` (bold),
 * so the rail reflects the section the reader is looking at. No-op on pages
 * without cards (e.g. the /try signup page).
 *
 * @param {HTMLElement} nav The decorated nav element
 */
function initScrollSpy(nav) {
  if (!('IntersectionObserver' in window)) return;

  let observer = null;
  let didInitialScroll = false;

  const build = () => {
    // Cards may be assembled asynchronously (see cards-download.js), so this can
    // run multiple times — tear down any prior observer first.
    if (observer) { observer.disconnect(); observer = null; }

    const cards = [...document.querySelectorAll('.cards-download-panel:not(.cards-download-placeholder)')];
    if (cards.length < 2) return; // single/no card → nothing to spy on

    const links = [...nav.querySelectorAll('a')];
    const linkTokens = links.map((a) => ({ link: a, tokens: tokenize(a.textContent) }));

    // Map each card to the nav link whose label tokens are a subset of the
    // card heading tokens (prefer the most specific / largest matching label).
    const pairs = cards
      .map((card) => {
        // Each card body has an h3 "tag" (product family, identical across
        // cards) followed by the h1/h2 title (unique). Prefer the title so cards
        // map to distinct nav items; the h3 tag is a last-resort fallback.
        const body = card.querySelector('.cards-download-card-body') || card;
        const headingEl = body.querySelector('h1')
          || body.querySelector('h2')
          || body.querySelector('h3');
        const headTokens = tokenize(headingEl && headingEl.textContent);
        let best = null;
        linkTokens.forEach(({ link, tokens }) => {
          if (isSubset(tokens, headTokens) && (!best || tokens.size > best.size)) {
            best = { link, size: tokens.size };
          }
        });
        return best ? { card, link: best.link } : null;
      })
      .filter(Boolean);

    if (!pairs.length) return;

    // Serving prefix: nav hrefs are root-relative (`/try/download/x`) but the page
    // may be served under a prefix (dev `/content/xwalk-mon/...`). Derive it from
    // this page's own nav item so pushed URLs stay within the current environment.
    const currentPathRaw = normalize(window.location.pathname);
    const ownLink = pairs
      .map((p) => normalize(p.link.getAttribute('href') || ''))
      .find((h) => h && currentPathRaw.endsWith(h));
    const prefix = ownLink ? currentPathRaw.slice(0, currentPathRaw.length - ownLink.length) : '';

    // Clicking a nav item whose card is on THIS page should scroll to that card
    // rather than navigating away, and update the URL to that item's path via
    // history.pushState (no reload). On a later refresh the URL then points at
    // the clicked item, and the initial-scroll logic below lands on its card.
    // Items with no matching card keep their normal link behavior (other pages).
    pairs.forEach(({ card, link }) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && window.history && window.history.pushState) {
          window.history.pushState({}, '', `${prefix}${normalize(href)}`);
        }
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // On a multi-card page the scroll-spy is the SINGLE source of highlight.
    // Clear the static `is-active` (current-page) marker so it doesn't render a
    // second accent bar alongside the spy's `is-current` one.
    links.forEach((a) => {
      a.classList.remove('is-active');
      a.removeAttribute('aria-current');
    });

    const setCurrent = (link) => {
      links.forEach((a) => {
        a.classList.remove('is-current');
        a.removeAttribute('aria-current');
      });
      if (link) {
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'true');
      }
    };

    // Seed the highlight on the current page's own item so there's exactly one
    // bar before any scrolling happens.
    const currentPair = pairs.find((p) => {
      const href = normalize(p.link.getAttribute('href') || '');
      const cur = normalize(window.location.pathname);
      return href && (cur === href || cur.endsWith(href));
    });
    setCurrent(currentPair ? currentPair.link : null);

    const visible = new Set();
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      // Highlight the topmost visible card's matching nav link.
      const topCard = pairs
        .filter((p) => visible.has(p.card))
        .sort((a, b) => a.card.getBoundingClientRect().top - b.card.getBoundingClientRect().top)[0];
      if (topCard) setCurrent(topCard.link);
    }, {
      // Activation band is a thin strip across the vertical middle of the
      // viewport (45%–55%): a card becomes "current" once it reaches roughly the
      // center of the screen, and the topmost card overlapping that strip wins.
      rootMargin: '-45% 0px -55% 0px',
      threshold: 0,
    });

    pairs.forEach((p) => observer.observe(p.card));

    // Scroll to the card matching the CURRENT URL so the reader lands on the
    // right download — whether they navigated to `/…/community` directly or
    // refreshed after the nav updated the URL to a sibling (see the click
    // handler's pushState). Runs once, but only after real (non-placeholder)
    // sibling cards exist so the target position is final; deferred a frame so
    // layout settles before scrolling (scrolling mid-reflow gets reset to 0).
    if (!didInitialScroll) {
      const currentPath = normalize(window.location.pathname);
      const own = pairs.find((p) => {
        const href = normalize(p.link.getAttribute('href') || '');
        return href && (currentPath === href || currentPath.endsWith(href));
      });
      const realCards = pairs.filter((p) => !p.card.classList.contains('cards-download-placeholder'));
      if (own && pairs.indexOf(own) > 0 && realCards.length === pairs.length) {
        didInitialScroll = true;
        requestAnimationFrame(() => {
          own.card.scrollIntoView({ behavior: 'auto', block: 'start' });
        });
      }
    }
  };

  // Cards are decorated asynchronously; wait a frame so their headings exist,
  // then rebuild whenever the cards-download block finishes assembling siblings.
  requestAnimationFrame(build);
  document.addEventListener('cards-download:assembled', build);
}
