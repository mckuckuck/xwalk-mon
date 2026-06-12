import { moveInstrumentation } from '../../scripts/scripts.js';

function isMediaRow(row) {
  return row?.querySelector('picture, img');
}

function isTextRow(row) {
  return row?.querySelector('h1, h2, h3, p');
}

/**
 * Split hero: text left, image right (company page layout).
 * AEM authoring renders each model field as its own row; this merges them into
 * the single two-cell row that hero.css expects.
 * @param {Element} block
 */
export default function decorate(block) {
  if (!block.classList.contains('split')) return;

  const rows = [...block.children];

  // Document-based / imported markup: already one row, two cells.
  if (rows.length === 1 && rows[0].children.length >= 2) {
    const cells = [...rows[0].children];
    const textIdx = cells.findIndex((c) => isTextRow(c));
    const mediaIdx = cells.findIndex((c) => isMediaRow(c));
    if (textIdx > -1 && mediaIdx > -1 && textIdx > mediaIdx) {
      rows[0].prepend(cells[textIdx]);
    }
    return;
  }

  const textRow = rows.find((r) => isTextRow(r));
  const mediaRow = rows.find((r) => isMediaRow(r));
  if (!textRow || !mediaRow || textRow === mediaRow) return;

  const wrapper = document.createElement('div');
  const textCell = document.createElement('div');
  const mediaCell = document.createElement('div');

  moveInstrumentation(textRow, textCell);
  moveInstrumentation(mediaRow, mediaCell);

  while (textRow.firstElementChild) textCell.append(textRow.firstElementChild);
  while (mediaRow.firstElementChild) mediaCell.append(mediaRow.firstElementChild);

  wrapper.append(textCell, mediaCell);
  block.replaceChildren(wrapper);
}
