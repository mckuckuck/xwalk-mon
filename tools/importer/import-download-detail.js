/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsParser from './parsers/columns.js';
import heroParser from './parsers/hero.js';
import sidebarNavParser from './parsers/sidebar-nav.js';
import cardsDownloadParser from './parsers/cards-download.js';

// TRANSFORMER IMPORTS
import mongodbCleanupTransformer from './transformers/mongodb-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'columns': columnsParser,
  'hero': heroParser,
  'sidebar-nav': sidebarNavParser,
  'cards-download': cardsDownloadParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  mongodbCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'download-detail',
  description: 'Download page with left sidebar navigation and a main column containing download hero, version/platform/package selectors, download button, and secondary download sections with release links',
  urls: [
    'https://www.mongodb.com/try/download/community',
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
      // Every page has exactly two section.w-full: the hero (css-1x76i0b,
      // stable) and the main content section (hash varies per page). Target the
      // main section as "the w-full section that is NOT the hero" so selectors
      // are independent of the per-page hash. Desktop rail = .css-17fcl61 nav.
      name: 'sidebar-nav',
      instances: ['section.w-full:not(.css-1x76i0b) .css-17fcl61 nav.css-1syg30y'],
      section: 'download',
    },
    {
      name: 'cards-download',
      instances: ['section.w-full:not(.css-1x76i0b) div.css-eeqf'],
      section: 'download',
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
 *   section 1: promo banner + hero          (full width)
 *   section 2: sidebar-nav + download panels (two columns)
 *
 * The two-column layout is applied by CSS targeting the section that contains a
 * .sidebar-nav-wrapper (see styles.css), so no section metadata is needed.
 *
 * Runs BEFORE parsing (parsers hold element references, so moving is safe). Only
 * <hr>s that are DIRECT children of main become section breaks, hence hoisting.
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
    ...byName('cards-download'),
  ];
  if (!ordered.length) return;

  main.textContent = '';
  ordered.forEach((el) => {
    if (el === sidebar) main.append(document.createElement('hr'));
    main.append(el);
  });
}

/**
 * Every download URL in a group serves the SAME multi-panel source page (the
 * URL only controls which panel you scroll to). To give each page a single,
 * distinct card we scope the cards-download to the ONE source panel that belongs
 * to this page — selected by INDEX (the page's position within its group's
 * ordered child list). Index-based selection is robust to the source's messy /
 * inconsistent panel container ids.
 *
 * GROUPS lists each group's ordered child slugs, matching the live sidebar nav.
 * A group LANDING page (the group heading slug, e.g. `tools`) is NOT in its
 * children list → it gets ALL panels (full group view).
 */
const GROUPS = {
  'enterprise-advanced': ['enterprise', 'ops-manager', 'enterprise-kubernetes-operator'],
  'community-edition': ['community', 'community-kubernetes-operator', 'search-in-community'],
  tools: [
    'shell', 'compass', 'atlascli', 'atlas-kubernetes-operator', 'mongocli',
    'mongosync', 'relational-migrator', 'database-tools', 'bi-connector',
  ],
  'sql-interface': ['power-bi-connector', 'tableau-connector', 'jdbc-driver', 'odbc-driver'],
};

function slugOf(originalURL) {
  return new URL(originalURL).pathname.replace(/\.html$/, '').replace(/\/$/, '').split('/').pop();
}

/**
 * Returns the 0-based index of the panel this page should keep, or -1 to keep
 * ALL panels (group landing pages, or unknown slugs → full group view).
 */
function scopedPanelIndex(originalURL) {
  const slug = slugOf(originalURL);
  // A landing page's slug is a GROUPS key → keep all panels.
  if (GROUPS[slug]) return -1;
  // Otherwise find the group whose children include this slug → its index.
  const children = Object.values(GROUPS).find((c) => c.includes(slug));
  return children ? children.indexOf(slug) : -1;
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * The cards-download block is scoped to this page's own panel by index (see
 * scopedPanelIndex); landing pages keep all panels.
 */
function findBlocksOnPage(document, template, originalURL) {
  const panelIndex = scopedPanelIndex(originalURL);
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [...document.querySelectorAll(selector)];
      if (blockDef.name === 'cards-download' && panelIndex >= 0) {
        // Keep only this page's own panel.
        elements = elements[panelIndex] ? [elements[panelIndex]] : [];
      }
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

    // 2. Find blocks (cards-download scoped to this page's own panel)
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL);

    // 2b. Reparent block source elements into two top-level sections (promo +
    // hero, then sidebar + download panels) BEFORE parsing, so the <hr> section
    // break is a direct child of main. Parsers hold element references.
    arrangeSections(main, document, pageBlocks);

    // Note: the version/platform/package release matrix is NOT available here —
    // the importer strips <script> before this transform runs. It is captured
    // separately (tools/importer/capture-download-options.mjs) and injected into
    // each page's .plain.html as a download-options block post-import.

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
