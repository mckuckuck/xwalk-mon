import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const SELECTOR_LABELS = {
  versionLabel: 'Version',
  platformLabel: 'Platform',
  packageLabel: 'Package',
};

/**
 * Walks a cell's child nodes and groups its element children by the preceding
 * `<!-- field:name -->` hint comment. Elements before any hint (or when a cell
 * carries a single implicit field, e.g. an image) fall under `fallback`.
 *
 * @param {Element} cell The authored cell (`<div>` inside a row)
 * @param {string} fallback Field name to use for elements with no preceding hint
 * @returns {Array<{name: string, el: Element}>} Ordered field/element pairs
 */
function fieldsInCell(cell, fallback) {
  const fields = [];
  let current = fallback;
  for (let node = cell.firstChild; node; node = node.nextSibling) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const match = node.textContent.trim().match(/^field:(\w+)/);
      if (match) current = match[1];
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      fields.push({ name: current, el: node });
    }
  }
  return fields;
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
  const isGithub = /view on github/i.test(text);
  const span = document.createElement('span');
  span.textContent = text || 'Download';
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

  [...row.children].forEach((cell) => {
    const fallback = cell.querySelector('picture, img') ? 'image' : 'text';
    fieldsInCell(cell, fallback).forEach(({ name, el }) => {
      const text = (el.textContent || '').trim();
      if (name === 'image') {
        image.append(el);
      } else if (SELECTOR_LABELS[name]) {
        if (text) selectors.append(buildSelector(name, text));
      } else if (name === 'downloadLink') {
        // downloadText is a collapsed field: the button label is the anchor's
        // own text, not a separate cell.
        const link = el.querySelector('a') || (el.tagName === 'A' ? el : null);
        if (link) {
          downloadHref = link.getAttribute('href') || '#';
          downloadText = (link.textContent || '').trim();
          hasDownload = true;
        }
      } else {
        body.append(el);
      }
    });
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
  if (action) controls.append(action);

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
