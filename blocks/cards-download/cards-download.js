import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const SELECTOR_LABELS = {
  versionLabel: 'Version',
  platformLabel: 'Platform',
  packageLabel: 'Package',
};

/**
 * The non-collapsed fields of the `cards-download-card` item model, in the exact
 * order the parser emits one cell per field. Used to map cells positionally when
 * `<!-- field:name -->` hint comments are unavailable (see below).
 */
const FIELD_ORDER = [
  'image', 'tag', 'heading', 'text', 'codeSnippet',
  'versionLabel', 'platformLabel', 'packageLabel', 'downloadLink', 'moreOptions',
];

/**
 * Walks a cell's child nodes and groups its element children by the preceding
 * `<!-- field:name -->` hint comment. Elements before any hint fall under
 * `fallback`.
 *
 * IMPORTANT: the AEM backend strips HTML comments from published `.plain.html`,
 * so the field hints exist only on the local dev server. On published pages the
 * caller must instead map cells positionally (see `fieldNameForCell`). This
 * function still honors hints when they ARE present (local/preview).
 *
 * @param {Element} cell The authored cell (`<div>` inside a row)
 * @param {string} fallback Field name to use for elements with no preceding hint
 * @returns {Array<{name: string, el: Element}>} Ordered field/element pairs
 */
function fieldsInCell(cell, fallback) {
  const fields = [];
  let current = fallback;
  let sawHint = false;
  for (let node = cell.firstChild; node; node = node.nextSibling) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const match = node.textContent.trim().match(/^field:(\w+)/);
      if (match) { current = match[1]; sawHint = true; }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      fields.push({ name: current, el: node });
    }
  }
  return { fields, sawHint };
}

/**
 * Chevron-down glyph used on the static selector pills, matching the source
 * dropdown affordance. Inline SVG keeps it dependency-free and themable.
 */
function chevron() {
  const span = document.createElement('span');
  span.className = 'cards-download-chevron';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M26.6668 10.6666L16.0049 21.3333L5.3335 10.6761" stroke="currentColor" '
    + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return span;
}

/**
 * Builds a static, dropdown-styled selector pill. Shows the current value
 * (large) above the field name (small) plus a chevron. Purely presentational —
 * no live version switching, matching the deferred behavior for this block.
 *
 * @param {string} name Field name (versionLabel/platformLabel/packageLabel)
 * @param {string} value The current value text
 * @returns {HTMLElement} The decorated pill element
 */
function buildSelector(name, value) {
  const pill = document.createElement('div');
  pill.className = 'cards-download-selector';
  pill.dataset.field = name;
  const val = document.createElement('span');
  val.className = 'cards-download-selector-value';
  val.textContent = value;
  const label = document.createElement('span');
  label.className = 'cards-download-selector-label';
  label.textContent = SELECTOR_LABELS[name] || '';
  pill.append(val, label, chevron());
  return pill;
}

/**
 * Builds the green primary download action, adding a download icon unless the
 * action is a "View on Github" link (Kubernetes Operator panel).
 *
 * @param {string} href Link target
 * @param {string} text Link label
 * @returns {HTMLElement} The decorated anchor
 */
function buildAction(href, text) {
  const action = document.createElement('a');
  action.className = 'button primary cards-download-action';
  action.href = href || '#';
  // Detect a GitHub link by the label OR the href — on published pages the
  // anchor text is the raw URL, so the label alone isn't reliable.
  const isGithub = /view on github/i.test(text) || /github\.com/i.test(href || '');
  const span = document.createElement('span');
  // Default label: "View on Github" for GitHub links, else "Download".
  span.textContent = text || (isGithub ? 'View on Github' : 'Download');
  action.append(span);
  if (!isGithub) {
    action.classList.add('cards-download-action-download');
    const icon = document.createElement('span');
    icon.className = 'cards-download-download-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M16 21.3V2.67M16 21.3l6.68-6.65M16 21.3l-6.67-6.62M2.67 21.33v5.35'
      + 'A2.65 2.65 0 0 0 5.33 29.33h21.34A2.65 2.65 0 0 0 29.33 26.68v-5.34" '
      + 'stroke="currentColor" stroke-width="2" stroke-linecap="round" '
      + 'stroke-linejoin="round"/></svg>';
    action.append(icon);
  }
  return action;
}

/** Copy icon glyph for the "Copy link" button. */
function copyIcon() {
  const span = document.createElement('span');
  span.className = 'cards-download-copy-icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M20 20h6.67A2.66 2.66 0 0 0 29.33 17.33V5.33A2.66 2.66 0 0 0 26.67 2.67'
    + 'H14.67A2.66 2.66 0 0 0 12 5.33V12M5.33 12h12A2.67 2.67 0 0 1 20 14.67v12'
    + 'A2.67 2.67 0 0 1 17.33 29.33h-12A2.67 2.67 0 0 1 2.67 26.67v-12'
    + 'A2.67 2.67 0 0 1 5.33 12Z" stroke="currentColor" stroke-width="2" '
    + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return span;
}

/**
 * Builds the "Copy link" button. Copies the CURRENT download href (the action
 * anchor, which the selectors keep in sync) to the clipboard. Purely client-side
 * — no authoring needed.
 *
 * @param {HTMLAnchorElement|null} action The download action anchor to read from
 * @returns {HTMLElement} The copy button
 */
function buildCopyLink(action) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cards-download-copy';
  const label = document.createElement('span');
  label.className = 'cards-download-copy-label';
  label.textContent = 'Copy link';
  btn.append(copyIcon(), label);
  btn.addEventListener('click', async () => {
    const href = action ? action.getAttribute('href') : '';
    if (!href || href === '#') return;
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.href).href);
      const prev = label.textContent;
      label.textContent = 'Copied!';
      btn.classList.add('is-copied');
      setTimeout(() => { label.textContent = prev; btn.classList.remove('is-copied'); }, 1500);
    } catch (e) { /* clipboard unavailable — no-op */ }
  });
  return btn;
}

/**
 * Builds the "More Options" popover from the authored `moreOptions` link list.
 * The cell holds a normal list of links (`<ul><li><a>…` or bare `<a>`s); each
 * becomes a menu item. Returns null when there are no links.
 *
 * @param {Element|null} cell The moreOptions field cell
 * @returns {HTMLElement|null} The More Options wrapper, or null if no links
 */
function buildMoreOptions(cell) {
  const anchors = cell ? [...cell.querySelectorAll('a[href]')] : [];
  if (!anchors.length) return null;

  const wrap = document.createElement('div');
  wrap.className = 'cards-download-more';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cards-download-more-toggle';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-haspopup', 'true');
  const label = document.createElement('span');
  label.textContent = 'More Options';
  const dots = document.createElement('span');
  dots.className = 'cards-download-more-dots';
  dots.setAttribute('aria-hidden', 'true');
  dots.textContent = '⋯'; // ⋯
  btn.append(label, dots);

  const menu = document.createElement('div');
  menu.className = 'cards-download-more-menu';
  menu.hidden = true;
  anchors.forEach((a) => {
    const item = document.createElement('a');
    item.className = 'cards-download-more-item';
    item.href = a.getAttribute('href');
    item.textContent = (a.textContent || '').trim();
    if (a.getAttribute('target')) item.target = a.getAttribute('target');
    else { item.target = '_blank'; item.rel = 'noopener'; }
    menu.append(item);
  });

  const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
  // Dismiss on outside click / Escape.
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  wrap.append(btn, menu);
  return wrap;
}

/** True when a string looks like a sheet path we should fetch (…\.json). */
function isSheetPath(value) {
  return /^\/.*\.json$/.test((value || '').trim());
}

/**
 * Fetches the release matrix from an EDS spreadsheet. `sheetName` selects a tab
 * in a multi-sheet workbook; `product` filters the `product` column.
 */
async function fetchSheetOptions(sheetPath, sheetName, product) {
  try {
    const resp = await fetch(sheetPath);
    if (!resp.ok) return [];
    const json = await resp.json();
    let rows = [];
    if (json[':type'] === 'multi-sheet') {
      const tab = sheetName && json[sheetName] ? json[sheetName] : json[json[':names']?.[0]];
      rows = tab?.data || [];
    } else {
      rows = json.data || [];
    }
    return rows
      .filter((r) => !product || r.product === product)
      .map((r) => ({
        version: r.version, platform: r.platform, package: r.package, url: r.url,
      }))
      .filter((o) => o.version && o.platform && o.package && o.url);
  } catch (e) {
    return [];
  }
}

/**
 * Reads a download-options block into a combo list. Supports two shapes: INLINE
 * rows ({version, platform, package, url} per row), or a SHEET reference (first
 * cell is a `…\.json` path, then tab name, then product key) that is fetched and
 * filtered. Returns [] if block is null.
 *
 * @param {Element|null} optionsBlock A `.download-options` element
 * @returns {Promise<Array<{version,platform,package,url}>>}
 */
async function readOptions(optionsBlock) {
  if (!optionsBlock) return [];
  const firstRow = optionsBlock.firstElementChild;
  const firstCellText = firstRow?.firstElementChild?.textContent.trim() || '';
  if (isSheetPath(firstCellText)) {
    const [sheetPath, sheetName, product] = [...firstRow.children].map((c) => c.textContent.trim());
    return fetchSheetOptions(sheetPath, sheetName, product);
  }
  return [...optionsBlock.children].map((row) => {
    const [v, p, pkg, u] = [...row.children];
    const text = (el) => (el ? el.textContent.trim() : '');
    const link = u ? u.querySelector('a') : null;
    return {
      version: text(v),
      platform: text(p),
      package: text(pkg),
      url: link ? link.getAttribute('href') : text(u),
    };
  }).filter((o) => o.version && o.platform && o.package && o.url);
}

/**
 * Builds a functional selector row (real <select>s for Version → Platform →
 * Package) wired to the combo matrix. Changing a select cascades the dependent
 * options and updates the download anchor's href to the matching combo URL.
 *
 * @param {Array} options Combo list from readOptions
 * @param {HTMLAnchorElement} action The download button to keep in sync
 * @returns {HTMLElement} The selectors container
 */
function buildFunctionalSelectors(options, action) {
  const wrap = document.createElement('div');
  wrap.className = 'cards-download-selectors';

  const uniq = (arr) => [...new Set(arr)];
  const makeSelect = (name) => {
    const field = document.createElement('label');
    field.className = 'cards-download-selector';
    field.dataset.field = name;
    const labelText = document.createElement('span');
    labelText.className = 'cards-download-selector-label';
    labelText.textContent = SELECTOR_LABELS[`${name}Label`] || name;
    const select = document.createElement('select');
    select.className = 'cards-download-select';
    select.name = name;
    field.append(select, labelText);
    return { field, select };
  };

  const version = makeSelect('version');
  const platform = makeSelect('platform');
  const pkg = makeSelect('package');

  const fill = (select, values, keep) => {
    const prev = keep && values.includes(select.value) ? select.value : values[0];
    select.innerHTML = '';
    values.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.append(opt);
    });
    select.value = prev;
  };

  const currentCombo = () => options.find((o) => o.version === version.select.value
    && o.platform === platform.select.value
    && o.package === pkg.select.value);

  const syncAction = () => {
    const combo = currentCombo();
    if (combo && action) action.setAttribute('href', combo.url);
  };

  const refreshPlatforms = (keep) => {
    const platforms = uniq(options
      .filter((o) => o.version === version.select.value)
      .map((o) => o.platform));
    fill(platform.select, platforms, keep);
  };
  const refreshPackages = (keep) => {
    const pkgs = uniq(options
      .filter((o) => o.version === version.select.value && o.platform === platform.select.value)
      .map((o) => o.package));
    fill(pkg.select, pkgs, keep);
  };

  fill(version.select, uniq(options.map((o) => o.version)), false);
  refreshPlatforms(false);
  refreshPackages(false);
  syncAction();

  version.select.addEventListener('change', () => {
    refreshPlatforms(true);
    refreshPackages(false);
    syncAction();
  });
  platform.select.addEventListener('change', () => {
    refreshPackages(true);
    syncAction();
  });
  pkg.select.addEventListener('change', syncAction);

  wrap.append(version.field, platform.field, pkg.field);
  return wrap;
}

/**
 * Builds a single download panel `<li>` from one authored row (a `<div>` whose
 * cells carry the image / body / controls fields, delimited by field hints).
 *
 * @param {Element} row The authored row element
 * @param {Array} [options] Optional release matrix; when present the static
 *   version/platform/package pills are replaced with functional <select>s.
 * @returns {HTMLElement|null} The decorated `<li>`, or null if the row is empty
 */
function buildPanel(row, options) {
  if (!row) return null;
  const li = document.createElement('li');
  li.className = 'cards-download-panel';
  moveInstrumentation(row, li);

  const image = document.createElement('div');
  image.className = 'cards-download-card-image';
  const body = document.createElement('div');
  body.className = 'cards-download-card-body';
  const controls = document.createElement('div');
  controls.className = 'cards-download-card-controls';
  const selectors = document.createElement('div');
  selectors.className = 'cards-download-selectors';

  let downloadHref = '';
  let downloadText = '';
  let hasDownload = false;
  let moreOptionsCell = null;

  const cells = [...row.children];

  // Whether ANY cell carries a `field:` hint comment. Present on the local dev
  // server; STRIPPED from published `.plain.html` by the backend. When absent we
  // map cells by POSITION (FIELD_ORDER) — the order the parser emits them.
  const hasHints = cells.some((c) => fieldsInCell(c, '').sawHint);

  cells.forEach((cell, i) => {
    // Field name: from the hint when present, else the cell's positional field.
    const fallback = cell.querySelector('picture, img') ? 'image' : 'text';
    const name = (hasHints ? fieldsInCell(cell, fallback).fields[0]?.name : FIELD_ORDER[i]) || fallback;
    // Element children of the cell (may be empty when the cell is bare text, e.g.
    // the tag/heading cells on published pages: `<div>MongoDB …</div>`).
    const els = [...cell.children];
    const text = (cell.textContent || '').trim();

    if (name === 'image') {
      els.forEach((el) => image.append(el));
    } else if (SELECTOR_LABELS[name]) {
      if (text) selectors.append(buildSelector(name, text));
    } else if (name === 'downloadLink') {
      // downloadText is a collapsed field: the button label is the anchor's own
      // text, not a separate cell.
      const link = cell.querySelector('a');
      if (link) {
        downloadHref = link.getAttribute('href') || '#';
        // downloadText is the button label. The `downloadText` field collapses
        // into the anchor's text — but on published pages the anchor text is the
        // raw URL (`<a href="…tgz">https://…tgz</a>`), not a label. Treat a
        // URL-like or href-matching label as "no label" so buildAction falls back
        // to the default "Download".
        const raw = (link.textContent || '').trim();
        downloadText = (!raw || /^https?:\/\//i.test(raw) || raw === downloadHref) ? '' : raw;
        hasDownload = true;
      }
    } else if (name === 'moreOptions') {
      // Captured for the footer row's "More Options" popover (built below).
      moreOptionsCell = cell;
    } else if (name === 'tag' || name === 'heading') {
      // Render the product tag and title as real headings. Published pages store
      // these as plain text fields (bare `<div>`/`<p>`, or a text-only cell),
      // losing the <h3>/<h1> the parser emitted — so (re)build the heading from
      // the cell's text. Real headings also let the sidebar-nav scroll-spy match
      // cards to nav items. Skip if the cell already contains a heading.
      if (text && !cell.querySelector('h1,h2,h3,h4,h5,h6')) {
        const h = document.createElement(name === 'tag' ? 'h3' : 'h1');
        h.textContent = text;
        body.append(h);
      } else {
        els.forEach((el) => body.append(el));
      }
    } else {
      els.forEach((el) => body.append(el));
    }
  });

  const action = hasDownload ? buildAction(downloadHref, downloadText) : null;

  // When a release matrix is supplied, replace the static pills with functional
  // <select>s wired to update the download button's href on change.
  const hasOptions = Array.isArray(options) && options.length > 0;
  if (hasOptions && action) {
    controls.append(buildFunctionalSelectors(options, action));
  } else if (selectors.children.length) {
    controls.append(selectors);
  }

  // Footer action row: primary Download/GitHub button, then Copy link, then the
  // More Options popover. Copy link only appears alongside a real download href.
  if (action) {
    const footer = document.createElement('div');
    footer.className = 'cards-download-actions';
    footer.append(action);
    const isGithub = /github\.com/i.test(downloadHref);
    if (!isGithub && downloadHref && downloadHref !== '#') {
      footer.append(buildCopyLink(action));
    }
    const more = buildMoreOptions(moreOptionsCell);
    if (more) footer.append(more);
    controls.append(footer);
  }

  if (image.children.length) li.append(image);
  li.append(body);
  if (controls.children.length) li.append(controls);

  li.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '96' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  return li;
}

/** Normalize a path: strip `.html` and a trailing slash for comparison. */
function normalizePath(p) {
  return (p || '').replace(/\.html$/, '').replace(/\/$/, '');
}

/**
 * True when a nav href points at the given (already-normalized) current path.
 * Handles environments that serve the site under a prefix (e.g. the AEM author
 * path) where nav hrefs stay root-relative.
 */
function hrefMatchesCurrent(href, currentPath) {
  const h = normalizePath(href);
  return !!h && (currentPath === h || currentPath.endsWith(h));
}

/**
 * Finds the sidebar-nav accordion group that contains the current page, and
 * returns its ordered child links. The sidebar-nav block decorates
 * asynchronously, so this polls briefly for the expanded group to appear.
 *
 * @param {string} currentPath Normalized current pathname
 * @returns {Promise<HTMLAnchorElement[]>} Ordered child links, or [] if none
 */
function waitForGroupLinks(currentPath) {
  return new Promise((resolve) => {
    let tries = 0;
    const attempt = () => {
      const children = [...document.querySelectorAll('.sidebar-nav .sidebar-nav-child')];
      const current = children.find((a) => hrefMatchesCurrent(a.getAttribute('href'), currentPath));
      if (current) {
        const group = current.closest('.sidebar-nav-group');
        const links = group ? [...group.querySelectorAll('.sidebar-nav-child')] : [current];
        resolve(links);
        return;
      }
      tries += 1;
      if (tries > 20) { // ~1s at 50ms; give up (no group → keep own card only)
        resolve([]);
        return;
      }
      setTimeout(attempt, 50);
    };
    attempt();
  });
}

/**
 * Assembles the full group's cards on a single-card page. Every download URL in
 * a group has its own page authoring only its own card; here we reserve one
 * sized placeholder per group item (in nav order) so the layout height is
 * established up front (no reflow), keep this page's own card in its slot, then
 * fetch each sibling page's `.plain.html`, extract its cards-download row, and
 * swap the real card into its placeholder in place.
 *
 * No-op when the page isn't part of a multi-item sidebar-nav group.
 *
 * @param {Element} block The cards-download block
 * @param {HTMLElement} ul The panel list
 * @param {HTMLElement[]} ownPanels This page's own decorated panel(s)
 */
async function assembleGroupCards(block, ul, ownPanels) {
  // Only the first cards-download block on the page drives assembly.
  if (document.querySelector('.cards-download') !== block) return;

  const currentPath = normalizePath(window.location.pathname);
  const links = await waitForGroupLinks(currentPath);
  if (links.length < 2) return; // not in a multi-item group → leave own card

  const currentIndex = links.findIndex(
    (a) => hrefMatchesCurrent(a.getAttribute('href'), currentPath),
  );
  if (currentIndex < 0) return;

  // Nav hrefs are root-relative (`/try/download/x`) but the page may be served
  // under a prefix (e.g. the dev server's `/content/xwalk-mon/...`). Derive that
  // prefix from the difference between the real current path and the current
  // nav href, then prepend it to sibling hrefs so their fetch resolves.
  const currentHref = normalizePath(links[currentIndex].getAttribute('href'));
  const prefix = currentPath.endsWith(currentHref)
    ? currentPath.slice(0, currentPath.length - currentHref.length)
    : '';

  // Reserve a slot per group item, in nav order. The current item gets this
  // page's own (already-decorated) panel; siblings get sized placeholders.
  ul.textContent = '';
  const slots = links.map((link, i) => {
    if (i === currentIndex && ownPanels[0]) {
      ul.append(ownPanels[0]);
      return { el: ownPanels[0], filled: true };
    }
    const ph = document.createElement('li');
    ph.className = 'cards-download-panel cards-download-placeholder';
    ph.setAttribute('aria-hidden', 'true');
    ul.append(ph);
    return { el: ph, filled: false, href: link.getAttribute('href') };
  });

  // Scroll to / anchor the current card now (its slot is already filled and all
  // sibling heights are reserved), so the target position stays stable as the
  // fetched cards fill in.
  document.dispatchEvent(new CustomEvent('cards-download:assembled'));

  // Fetch siblings in parallel and swap each into its placeholder in place.
  await Promise.all(slots.map(async (slot) => {
    if (slot.filled) return;
    try {
      const resp = await fetch(`${prefix}${normalizePath(slot.href)}.plain.html`);
      if (!resp.ok) throw new Error(`fetch ${slot.href} → ${resp.status}`);
      const text = await resp.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const srcBlock = doc.querySelector('.cards-download');
      const row = srcBlock && srcBlock.firstElementChild;
      // The sibling page's release matrix is the download-options block that
      // follows its cards-download block.
      const sibOptions = await readOptions(srcBlock && srcBlock.nextElementSibling
        && srcBlock.nextElementSibling.classList.contains('download-options')
        ? srcBlock.nextElementSibling
        : doc.querySelector('.download-options'));
      const panel = buildPanel(row, sibOptions);
      if (!panel) throw new Error('no card in sibling');
      slot.el.replaceWith(panel);
    } catch (e) {
      // Graceful: drop the placeholder so the page still shows its own card.
      slot.el.remove();
    }
  }));

  // Re-init scroll-spy now that all cards exist.
  document.dispatchEvent(new CustomEvent('cards-download:assembled'));
}

/**
 * Decorates the cards-download block.
 *
 * Each authored row becomes a stacked download panel (image / body / controls).
 * Each download page authors ONLY its own card; after decorating it, the block
 * assembles the rest of its sidebar-nav group's cards client-side (see
 * assembleGroupCards) so the full group is shown without reflow.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // The release matrix (if any) is authored as a sibling download-options block
  // placed immediately after this card block. Consume + remove it so it doesn't
  // render on its own.
  // The download-options block may sit as a direct sibling (raw import markup) OR,
  // once EDS wraps each block in its own `-wrapper`, as a sibling WRAPPER. Look in
  // both places, and fall back to the first one in the section/document.
  const optionsBlock = (block.nextElementSibling
    && block.nextElementSibling.classList.contains('download-options')
    && block.nextElementSibling)
    || (block.parentElement
      && block.parentElement.nextElementSibling
      && block.parentElement.nextElementSibling.querySelector(':scope > .download-options'))
    || (block.closest('.section') || document).querySelector('.download-options');
  const options = await readOptions(optionsBlock);
  if (optionsBlock) {
    // Remove the block's own wrapper too, so no empty `download-options-wrapper`
    // is left behind in the section grid.
    const wrapper = optionsBlock.closest('.download-options-wrapper');
    (wrapper || optionsBlock).remove();
  }

  const rows = [...block.children];
  const ownPanels = rows.map((row) => buildPanel(row, options)).filter(Boolean);

  const ul = document.createElement('ul');
  ownPanels.forEach((li) => ul.append(li));
  block.textContent = '';
  block.append(ul);

  await assembleGroupCards(block, ul, ownPanels);
}
