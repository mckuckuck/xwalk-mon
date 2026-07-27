import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Pricing comparison table (Atlas plans).
 *
 * Authored as ONE flat block — a repeatable "Pricing Row" item (see
 * `_pricing-compare.json`), no nested blocks. Each row has a fixed 6-cell shape
 * in model order:
 *
 *   [type] [label] [tooltip] [valueFree] [valueFlex] [valueDedicated]
 *
 * `type` drives how the row renders:
 *   - `header`  → the sticky plan header; the three value cells hold each plan's
 *                 name/price/CTA content.
 *   - `section` → starts a collapsible accordion section (label = its name).
 *   - `feature` → a feature row: label (+ optional tooltip) and the three plan
 *                 values. A "✓"/"yes" value becomes a checkmark icon.
 *
 * Everything is real authored HTML (SSR by default). The JS only reorganizes the
 * already-rendered cells into a sticky header + <details> accordions + tooltips,
 * so it stays crawlable and degrades gracefully if JS/CSS fail.
 *
 * NOTE on hints: the `field:` comments that carry the cell→field mapping locally
 * are STRIPPED from published `.plain.html`. So map cells POSITIONALLY by model
 * order (below), falling back to hints only to confirm order on the dev server.
 *
 * @param {Element} block The block element
 */

const FIELD_ORDER = ['type', 'label', 'tooltip', 'valueFree', 'valueFlex', 'valueDedicated'];
const CHECK_VALUES = new Set(['✓', 'yes', 'true', 'included', 'check']);

function checkIcon() {
  const span = document.createElement('span');
  span.className = 'pricing-compare-check';
  span.setAttribute('role', 'img');
  span.setAttribute('aria-label', 'Included');
  span.innerHTML = '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M27 9L12.5 23.5L5 16" stroke="currentColor" stroke-width="2.5" '
    + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return span;
}

/** Read a row's cells into a field map by model order. */
function rowFields(row) {
  const cells = [...row.children];
  const fields = {};
  FIELD_ORDER.forEach((name, i) => { fields[name] = cells[i] || null; });
  return fields;
}

const cellText = (cell) => (cell ? (cell.textContent || '').trim() : '');

/** Build a value cell: "✓/yes" → checkmark icon; otherwise keep its content. */
function buildValue(cell) {
  const wrap = document.createElement('div');
  wrap.className = 'pricing-compare-value';
  if (CHECK_VALUES.has(cellText(cell).toLowerCase())) {
    wrap.append(checkIcon());
  } else if (cell && cellText(cell)) {
    // Only carry over content when the cell has real text — an unfilled richtext
    // field renders as an empty <p>, which we drop to keep the cell blank.
    wrap.append(...cell.childNodes);
  } else {
    wrap.classList.add('pricing-compare-value-empty');
  }
  return wrap;
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const table = document.createElement('div');
  table.className = 'pricing-compare-table';

  let currentGroup = null;
  let rowIndex = 0;

  const buildHeader = (f, srcRow) => {
    const header = document.createElement('div');
    header.className = 'pricing-compare-header';
    moveInstrumentation(srcRow, header);
    // Column 1 is the (usually empty) label slot; then the three plan cells.
    const labelCol = document.createElement('div');
    labelCol.className = 'pricing-compare-header-cell pricing-compare-header-label';
    if (f.label) labelCol.append(...f.label.childNodes);
    header.append(labelCol);
    ['valueFree', 'valueFlex', 'valueDedicated'].forEach((k) => {
      const col = document.createElement('div');
      col.className = 'pricing-compare-header-cell';
      if (f[k]) col.append(...f[k].childNodes);
      header.append(col);
    });
    table.append(header);
  };

  const buildSection = (f, srcRow) => {
    const details = document.createElement('details');
    details.className = 'pricing-compare-group';
    details.open = true;
    moveInstrumentation(srcRow, details);
    const summary = document.createElement('summary');
    summary.className = 'pricing-compare-group-heading';
    summary.textContent = cellText(f.label);
    details.append(summary);
    table.append(details);
    currentGroup = details;
  };

  const buildFeature = (f, srcRow) => {
    rowIndex += 1;
    const featureRow = document.createElement('div');
    featureRow.className = 'pricing-compare-row';
    moveInstrumentation(srcRow, featureRow);

    const label = document.createElement('div');
    label.className = 'pricing-compare-label';
    // A tooltip cell that only holds an empty <p> (the default for an unfilled
    // richtext field) has no text — treat it as "no tooltip".
    const hasTip = !!f.tooltip && !!cellText(f.tooltip);
    if (hasTip) {
      label.classList.add('pricing-compare-has-tooltip');
      const term = document.createElement('span');
      term.className = 'pricing-compare-term';
      term.tabIndex = 0;
      term.textContent = cellText(f.label);
      const tipId = `pc-row-${rowIndex}-tip`;
      term.setAttribute('aria-describedby', tipId);
      const tip = document.createElement('span');
      tip.className = 'pricing-compare-tooltip';
      tip.id = tipId;
      tip.setAttribute('role', 'tooltip');
      tip.innerHTML = f.tooltip.innerHTML;
      label.append(term, tip);
    } else {
      label.textContent = cellText(f.label);
    }
    featureRow.append(label);
    ['valueFree', 'valueFlex', 'valueDedicated'].forEach((k) => featureRow.append(buildValue(f[k])));

    (currentGroup || table).append(featureRow);
  };

  rows.forEach((row) => {
    const f = rowFields(row);
    const type = (cellText(f.type) || 'feature').toLowerCase();
    if (type === 'header') buildHeader(f, row);
    else if (type === 'section') buildSection(f, row);
    else buildFeature(f, row);
  });

  block.replaceChildren(table);
}
