/* eslint-disable */
/* global WebImporter */
/**
 * Parser for sidebar-nav (grouped hierarchical left-rail download navigation).
 * Base block: sidebar-nav (new project block).
 * Source: https://www.mongodb.com/try and /try/download/* (nav.css-1syg30y)
 * Generated: 2026-07-07
 *
 * Container block. Model blocks/sidebar-nav/_sidebar-nav.json:
 *   parent  sidebar-nav       -> ariaLabel (text)         : block-name row cell (no hint, collapses)
 *   child   sidebar-nav-item  -> text (richtext)          : one row per top-level nav item
 *
 * Block JS contract (blocks/sidebar-nav/sidebar-nav.js): each row's first cell
 * holds one item. Group items contain a heading element followed by a nested
 * <ul> of child links; leaf items contain just a link.
 *
 * xwalk field hint per row: text.
 */
export default function parse(element, { document }) {
  // Top-level nav structure: nav > div > [div (each = one top item)].
  const container = element.querySelector(':scope > div') || element;
  const topItems = [...container.children].filter((c) => c.tagName === 'DIV');

  if (!topItems.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  topItems.forEach((item) => {
    // The heading/top link is the first anchor in this item.
    const topLink = item.querySelector(':scope > a[href]');
    if (!topLink) return;

    const headingHref = topLink.getAttribute('href');
    const headingText = topLink.textContent.replace(/\s+/g, ' ').trim();

    // Child links live in the sibling container after the top link.
    const childLinks = [...item.querySelectorAll(':scope > div a[href]')];

    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:text '));

    if (childLinks.length) {
      // Group item: heading paragraph + nested list of child links.
      const headingP = document.createElement('p');
      const headingA = document.createElement('a');
      headingA.setAttribute('href', headingHref);
      headingA.textContent = headingText;
      headingP.appendChild(headingA);
      frag.appendChild(headingP);

      const ul = document.createElement('ul');
      childLinks.forEach((cl) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.setAttribute('href', cl.getAttribute('href'));
        a.textContent = cl.textContent.replace(/\s+/g, ' ').trim();
        li.appendChild(a);
        ul.appendChild(li);
      });
      frag.appendChild(ul);
    } else {
      // Leaf item: single link.
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', headingHref);
      a.textContent = headingText;
      p.appendChild(a);
      frag.appendChild(p);
    }

    cells.push([frag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'sidebar-nav', cells });
  element.replaceWith(block);
}
