/**
 * Download Options — supplies the version/platform/package → URL release matrix
 * for a sibling download card. The adjacent cards-download block reads the parsed
 * matrix (exposed as `data-options`) to drive its functional Version / Platform /
 * Package dropdowns and Download button. This block renders nothing visible.
 *
 * Two authoring shapes are supported:
 *
 * 1. INLINE rows — each row is one combo (version, platform, package, url). Used
 *    by pages that still embed their full matrix.
 *
 * 2. SHEET reference — a single row holding a sheet path and a product key
 *    (e.g. `/downloads.json` · `community` · `community-server`). The matrix is
 *    fetched from the EDS spreadsheet and filtered to the product's rows. This
 *    keeps large release matrices in one author-managed sheet instead of a giant
 *    hidden table on every page. When the referenced sheet is multi-tab, the
 *    middle value selects the tab (family); the last value filters the
 *    `product` column within it.
 *
 * @param {Element} block The block element
 */

/** True when a string looks like a sheet path we should fetch (…\.json). */
function isSheetPath(value) {
  return /^\/.*\.json$/.test((value || '').trim());
}

/** Reads inline combo rows (version, platform, package, url). */
function readInlineRows(block) {
  const options = [];
  [...block.children].forEach((row) => {
    const [versionCell, platformCell, packageCell, urlCell] = [...row.children];
    const text = (el) => (el ? el.textContent.trim() : '');
    const link = urlCell ? urlCell.querySelector('a') : null;
    const option = {
      version: text(versionCell),
      platform: text(platformCell),
      package: text(packageCell),
      url: link ? link.getAttribute('href') : text(urlCell),
    };
    if (option.version && option.platform && option.package && option.url) {
      options.push(option);
    }
  });
  return options;
}

/**
 * Fetches the release matrix from an EDS spreadsheet. `sheetPath` is the
 * published JSON; `sheetName` selects a tab in a multi-sheet workbook (ignored
 * for single-sheet); `product` filters the `product` column.
 */
async function readSheet(sheetPath, sheetName, product) {
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
        version: r.version,
        platform: r.platform,
        package: r.package,
        url: r.url,
      }))
      .filter((o) => o.version && o.platform && o.package && o.url);
  } catch (e) {
    return [];
  }
}

export default async function decorate(block) {
  const firstRow = block.firstElementChild;
  const firstCellText = firstRow?.firstElementChild?.textContent.trim() || '';

  let options;
  if (isSheetPath(firstCellText)) {
    const cells = [...firstRow.children].map((c) => c.textContent.trim());
    const [sheetPath, sheetName, product] = cells;
    options = await readSheet(sheetPath, sheetName, product);
  } else {
    options = readInlineRows(block);
  }

  block.dataset.options = JSON.stringify(options);
  block.setAttribute('aria-hidden', 'true');
}
