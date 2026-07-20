/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsParser from './parsers/columns.js';
import heroParser from './parsers/hero.js';
import sidebarNavParser from './parsers/sidebar-nav.js';
import formParser from './parsers/form.js';

// TRANSFORMER IMPORTS
import mongodbCleanupTransformer from './transformers/mongodb-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'columns': columnsParser,
  'hero': heroParser,
  'sidebar-nav': sidebarNavParser,
  'form': formParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  mongodbCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'try-signup',
  description: 'Product intro page with hero heading, description, explore-products link, left sidebar navigation, and an account signup form in the main column',
  urls: [
    'https://www.mongodb.com/try',
  ],
  blocks: [
    {
      name: 'columns',
      instances: ['.pencil-banner-no-underline'],
      section: 'banner-green',
    },
    {
      name: 'hero',
      instances: ['section.w-full.css-1x76i0b'],
    },
    {
      name: 'sidebar-nav',
      instances: ['section.w-full.css-11phdyl .css-17fcl61 nav.css-1syg30y'],
      section: 'signup',
    },
    {
      name: 'form',
      instances: ['#atlas-form'],
      section: 'signup',
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Remove any anchors/images whose URL contains square brackets.
 * Third-party tracking pixels (usbrowserspeed.com / dpmsrv.com etc.) inject
 * URLs like "...puid=dpmpixc[1164]a[NA]s[019f...]" that html2md feeds into
 * new RegExp(), throwing "Range out of order in character class" and aborting
 * the whole import. Run this as the final step so nodes created by the
 * WebImporter background-image/url rules are also scrubbed.
 */
function stripBracketUrlNodes(root) {
  root.querySelectorAll('a[href], img[src], img[srcset], source[src], source[srcset]').forEach((node) => {
    const url = node.getAttribute('href') || node.getAttribute('src') || node.getAttribute('srcset') || '';
    // Match literal OR URL-encoded square brackets (%5B / %5D), which break
    // html2md's new RegExp(), plus known tracking-beacon domains.
    if (/[[\]]/.test(url)
      || /%5b|%5d/i.test(url)
      || /usbrowserspeed\.com|dpmsrv\.com/i.test(url)) {
      node.remove();
    }
  });
}

/**
 * Reparents the discovered block SOURCE elements to main's top level, in a fixed
 * order, with an <hr> section break before the sidebar so the page renders as:
 *   section 1: promo banner + hero  (full width)
 *   section 2: sidebar-nav + form   (two columns)
 *
 * The two-column layout is applied by CSS targeting the section that contains a
 * .sidebar-nav-wrapper (see styles.css), so no section metadata is needed.
 *
 * Runs BEFORE parsing. Parsers receive element references directly, so moving
 * the elements first is safe. Only <hr>s that are DIRECT children of main become
 * section breaks, which is why the elements must be hoisted to the top level.
 *
 * @param {Element} main The document body
 * @param {Document} document
 * @param {Array} pageBlocks Discovered blocks from findBlocksOnPage
 */
function arrangeSections(main, document, pageBlocks) {
  const byName = (name) => pageBlocks
    .filter((b) => b.name === name)
    .map((b) => b.element)
    .filter((el) => el && el.parentNode);

  const sidebar = byName('sidebar-nav')[0];
  if (!sidebar) return;

  const ordered = [
    ...byName('columns'),
    ...byName('hero'),
    ...byName('sidebar-nav'),
    ...byName('form'),
  ];
  if (!ordered.length) return;

  main.textContent = '';
  ordered.forEach((el) => {
    if (el === sidebar) main.append(document.createElement('hr'));
    main.append(el);
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 2b. Reparent block source elements into two top-level sections (promo +
    // hero, then sidebar + form) BEFORE parsing, so the <hr> section break is a
    // direct child of main. Parsers hold element references, so this is safe.
    arrangeSections(main, document, pageBlocks);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5b. Final scrub of tracking-pixel URLs with square brackets (must run
    // after the WebImporter rules, which can re-introduce such nodes).
    stripBracketUrlNodes(main);

    // 6. Sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
