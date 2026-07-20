/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns (promo pencil banner).
 * Base block: columns.
 * Source: https://www.mongodb.com/try (.pencil-banner-no-underline)
 * Generated: 2026-07-07
 *
 * Source is a horizontal promo bar: a "BLOG" pill label, a promo sentence and an
 * inline "Read blog >" link. Rendered as a 2-column columns block:
 *   [ BLOG pill , promo sentence + link ]
 * Columns blocks use default content only — NO field hints (see hinting Rule 4).
 */
export default function parse(element, { document }) {
  // The banner wraps everything in a single anchor. The first visible promo item
  // is the first .css-828kth / .css-1a6vxsk group. Extract the pill + sentence.
  const link = element.querySelector('a[href]');
  const href = link ? link.getAttribute('href') : null;

  // Pill label (e.g. "BLOG")
  const pill = element.querySelector('.css-183cktd, [class*="cktd"], span');
  const pillText = (pill && pill.textContent.trim()) || 'BLOG';

  // Promo sentence: the first sentence group only. The banner duplicates the
  // sentence (a full and a truncated ">>" variant) for responsive display, so
  // take the first inner <span> of the first .css-1oanqc5 group.
  const sentenceSpan = element.querySelector('.css-1oanqc5 > span, .css-1oanqc5 span, .css-1oanqc5');
  let sentenceText = '';
  if (sentenceSpan) {
    sentenceText = sentenceSpan.textContent.replace(/\s+/g, ' ').trim();
    // Drop any trailing call-to-action marker ("Read blog >" / ">>").
    sentenceText = sentenceText.replace(/\s*Read blog\s*>+.*$/i, '').replace(/\s*>{2,}\s*$/, '').trim();
  }

  if (!sentenceText && !pillText) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Column 1: the pill label.
  const cell1 = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = pillText;
  cell1.append(strong);

  // Column 2: promo sentence wrapped as a link to the blog post ("Read blog >").
  const cell2 = document.createElement('p');
  if (href) {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = sentenceText || pillText;
    cell2.append(a);
  } else {
    cell2.textContent = sentenceText;
  }

  const cells = [[cell1, cell2]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
