/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero.
 * Base block: hero.
 * Source: https://www.mongodb.com/try and /try/download/* (section.w-full.css-1x76i0b)
 * Generated: 2026-07-07
 *
 * Hero library structure: 1 column, up to 3 rows.
 *   Row 1: block name (added by createBlock)
 *   Row 2: background image (optional)
 *   Row 3: title (heading) + subheading + optional CTA link
 *
 * xwalk field hints (model blocks/hero/_hero.json):
 *   image  -> reference (background image)
 *   text   -> richtext (heading + description + CTA)
 * imageAlt collapses into the <img alt> attribute (no hint — hinting Rule 3).
 */
export default function parse(element, { document }) {
  // Background/hero image is a direct child <img> of the section.
  const image = element.querySelector(':scope > img, img');

  // Heading: h1 on /try, may be h2 on download pages.
  const heading = element.querySelector('h1, h2, [class*="bqi6cz"]');

  // Description paragraph.
  const descEl = element.querySelector('.css-1r84kvf, .css-4i53ku, p');

  // Optional CTA link (e.g. "Explore all our products", "Try MongoDB Atlas").
  const ctaSource = element.querySelector('a[href]');

  if (!heading && !descEl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (optional). Field hint: image.
  if (image) {
    const imgFrag = document.createDocumentFragment();
    imgFrag.appendChild(document.createComment(' field:image '));
    imgFrag.appendChild(image);
    cells.push([imgFrag]);
  }

  // Row 3: text content (heading + subheading + CTA). Field hint: text.
  const contentFrag = document.createDocumentFragment();
  contentFrag.appendChild(document.createComment(' field:text '));

  if (heading) {
    const h = document.createElement('h1');
    h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    contentFrag.appendChild(h);
  }
  if (descEl) {
    const p = document.createElement('p');
    p.textContent = descEl.textContent.replace(/\s+/g, ' ').trim();
    contentFrag.appendChild(p);
  }
  if (ctaSource) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', ctaSource.getAttribute('href'));
    a.textContent = ctaSource.textContent.replace(/\s+/g, ' ').trim();
    p.appendChild(a);
    contentFrag.appendChild(p);
  }
  cells.push([contentFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
