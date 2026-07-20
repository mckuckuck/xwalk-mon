/**
 * Capture the MongoDB download release matrix (version × platform × package →
 * URL) for each download page and inject it into the imported .plain.html as a
 * `download-options` block placed right after each `cards-download` block.
 *
 * WHY a separate script: the content importer strips <script> tags before its
 * transform runs, so the embedded release matrix (a large inline JSON blob on
 * the live page) is not reachable during import. This script visits each live
 * page with Playwright — where the script is intact — extracts the matrix, and
 * writes the authored option rows into the already-imported content.
 *
 * Re-run this whenever MongoDB ships new releases to refresh the matrix.
 *
 * Usage:
 *   node tools/importer/capture-download-options.mjs <url> [<url> ...]
 *   node tools/importer/capture-download-options.mjs --urls tools/importer/urls-community-edition.txt
 *
 * Requires Playwright from the content-import skill's node_modules.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../..');
const CONTENT_DIR = join(REPO_ROOT, 'content');

// Playwright lives in the content-import skill's node_modules.
const IMPORT_SCRIPTS = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const require = createRequire(join(IMPORT_SCRIPTS, 'package.json'));
const { chromium } = require('playwright');

/** Parse CLI args into a list of URLs. */
function parseArgs(argv) {
  const urls = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--urls') {
      const file = argv[i + 1];
      i += 1;
      readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean).forEach((u) => urls.push(u));
    } else if (argv[i].startsWith('http')) {
      urls.push(argv[i]);
    }
  }
  return urls;
}

/**
 * In-page extractor: pull every version×platform×package→url combo out of the
 * embedded release-matrix script, grouped per download card panel. Runs in the
 * browser context (has access to the live inline scripts).
 *
 * Returns an array (one entry per card panel, in DOM order):
 *   { heading, hasSelectors, options: [{version, platform, package, url}] }
 */
function inPageExtract() {
  const scriptEl = [...document.querySelectorAll('script:not([src])')]
    .find((s) => /"platforms":\{/.test(s.textContent));

  // Each product/card has its OWN matrix. The embedded data holds one or more
  // consecutive `"platforms":{…}` objects PER product (one per version of that
  // product), in the same order the selector-bearing cards appear on the page.
  // Parse each object into a combo group, then coalesce consecutive groups that
  // belong to the same product. Products are delimited by a change in the URL's
  // product signature (path segment / filename stem), so e.g. all mongosh
  // versions group together and are distinct from compass.
  const matrixGroups = [];
  if (scriptEl) {
    const t = scriptEl.textContent;
    let idx = 0;
    const rawBlocks = [];
    while (true) {
      const p = t.indexOf('"platforms":{', idx);
      if (p < 0) break;
      let i = p + '"platforms":'.length;
      let depth = 0;
      const start = i;
      for (; i < t.length; i += 1) {
        if (t[i] === '{') depth += 1;
        else if (t[i] === '}') { depth -= 1; if (depth === 0) { i += 1; break; } }
      }
      idx = i;
      let platforms = null;
      try { platforms = JSON.parse(t.slice(start, i)); } catch (e) { platforms = null; }
      if (!platforms) continue;
      const combos = [];
      Object.entries(platforms).forEach(([platform, pkgs]) => {
        Object.entries(pkgs).forEach(([pkg, url]) => {
          const vm = String(url).match(/(\d+\.\d+\.\d+)/);
          combos.push({ version: vm ? vm[1] : '', platform, package: pkg, url });
        });
      });
      // Product signature: strip version numbers + platform tokens from a
      // representative URL so different versions of the same product match.
      const sig = (combos[0] ? combos[0].url : '')
        .replace(/\d+\.\d+(\.\d+)?/g, '')
        .replace(/(amd64|arm64|aarch64|x86_64|x64|arm|osx|win32|windows|linux|macos|ubuntu\d*|debian\d*|rhel\d*|suse\d*|amazon\d*|amzn\d*|el\d+|focal|jammy|noble|bookworm|bullseye)/gi, '')
        .replace(/[^a-z]/gi, '');
      rawBlocks.push({ sig, combos });
    }
    // Coalesce consecutive raw blocks sharing a product signature.
    rawBlocks.forEach((b) => {
      const last = matrixGroups[matrixGroups.length - 1];
      if (last && last.sig === b.sig) last.combos.push(...b.combos);
      else matrixGroups.push({ sig: b.sig, combos: b.combos });
    });
  }

  // Signature of a download URL with version/platform tokens stripped, so URLs
  // for the same product (across versions/platforms) collapse to one key.
  const productSig = (url) => (url || '')
    .replace(/\d+\.\d+(\.\d+)?/g, '')
    .replace(/(amd64|arm64|aarch64|x86_64|x64|ppc64le|s390x|arm|osx|darwin|win32|windows|linux|macos|ubuntu\d*|debian\d*|rhel\d*|suse\d*|amazon\d*|amzn\d*|el\d+|focal|jammy|noble|bookworm|bullseye|readonly|isolated|signed)/gi, '')
    .replace(/[^a-z]/gi, '');

  // Associate each selector-bearing panel with the matrix group whose URLs match
  // the panel's OWN current Download button href (most reliable: the live button
  // already points into that card's matrix). Fall back to ordinal if no href.
  // Keyword tokens (>=3 chars) from a heading, minus generic words, used to
  // disambiguate which matrix group a card belongs to by matching against URLs.
  const headingTokens = (heading) => heading.toLowerCase()
    .replace(/mongodb|download|the|for|and|edition|server|community|enterprise/gi, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);

  const panels = [...document.querySelectorAll('div.css-eeqf')];
  const usedGroups = new Set();
  return panels.map((panel) => {
    const headingEl = [...panel.querySelectorAll('h1, h5')].find((h) => /Download/i.test(h.textContent))
      || panel.querySelector('h1, h5');
    const heading = headingEl ? headingEl.textContent.trim() : '';
    const hasSelectors = !!panel.querySelector('#download-version, [id^="download-"]');
    let options = [];
    if (hasSelectors) {
      // The card's currently-selected version (e.g. "8.3.4 (current)").
      const verBtn = panel.querySelector('#download-version, [id^="download-version"]');
      const verText = verBtn ? verBtn.textContent : '';
      const vm = verText.match(/(\d+\.\d+\.\d+)/);
      const wantVersion = vm ? vm[1] : null;

      // (1) Prefer matching by the card's own resolvable download href.
      const dl = [...panel.querySelectorAll('a[href]')]
        .map((a) => a.getAttribute('href'))
        .find((h) => /fastdl\.mongodb|repo\.mongodb|downloads\.mongodb|mongodb\.org/.test(h || ''));
      const wantSig = dl ? productSig(dl) : null;
      let group = wantSig
        ? matrixGroups.find((g) => !usedGroups.has(g) && g.combos.some((c) => productSig(c.url) === wantSig))
        : null;

      // (2) Else match a group that contains the selected version AND whose URLs
      // share a heading keyword (disambiguates same-version products). Fall back
      // to version-only when the heading yields no usable keywords.
      if (!group && wantVersion) {
        const tokens = headingTokens(heading);
        const candidates = matrixGroups.filter((g) => !usedGroups.has(g)
          && g.combos.some((c) => c.version === wantVersion));
        group = candidates.find((g) => tokens.length
          && g.combos.some((c) => tokens.some((tok) => c.url.toLowerCase().includes(tok))))
          || (candidates.length === 1 ? candidates[0] : null);
      }

      if (group) {
        usedGroups.add(group);
        options = group.combos.map(({ version, platform, package: pkg, url }) => ({
          version, platform, package: pkg, url,
        }));
      }
    }
    return { heading, hasSelectors, options };
  });
}

/** Build the download-options block HTML (rows of version/platform/package/url). */
function optionsBlockHtml(options) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows = options.map((o) => (
    '<div>'
    + `<div>${esc(o.version)}</div>`
    + `<div>${esc(o.platform)}</div>`
    + `<div>${esc(o.package)}</div>`
    + `<div><a href="${esc(o.url)}">${esc(o.url)}</a></div>`
    + '</div>'
  )).join('');
  return `<div class="download-options">${rows}</div>`;
}

/**
 * Build the download-options block as a markdown gridtable (the format md2jcr
 * consumes). Header row is the block name; each option is a 4-column row
 * (version | platform | package | [url](url)). Column widths are computed so
 * the +---+ borders align, which remark-gridtable requires.
 */
function optionsBlockMd(options) {
  const cells = options.map((o) => [o.version, o.platform, o.package, `[${o.url}](${o.url})`]);
  const widths = [0, 0, 0, 0];
  cells.forEach((r) => r.forEach((c, i) => { widths[i] = Math.max(widths[i], c.length); }));
  // Block name header spans full width; ensure it fits.
  const inner = widths.reduce((a, w) => a + w + 3, 0) - 1; // borders/padding
  const nameLen = Math.max(inner, 'Download Options'.length + 2);
  const border = (ch) => `+${'-'.repeat(nameLen)}+`;
  const colBorder = (ch) => `+${widths.map((w) => ch.repeat(w + 2)).join('+')}+`;
  const pad = (s, w) => ` ${s}${' '.repeat(w - s.length)} `;
  const line = (r) => `|${r.map((c, i) => pad(c, widths[i])).join('|')}|`;
  const nameRow = `|${` Download Options${' '.repeat(nameLen - 'Download Options'.length - 1)}`}|`;
  const out = [];
  out.push(border('-'));
  out.push(nameRow);
  out.push(colBorder('='));
  cells.forEach((r, i) => {
    out.push(line(r));
    out.push(colBorder('-'));
  });
  return out.join('\n');
}

/** Map a live URL to its imported content path (without extension). */
function contentPathBase(url) {
  const slugPath = new URL(url).pathname.replace(/\/$/, '');
  return join(CONTENT_DIR, slugPath);
}

/**
 * Inject download-options into the page's .plain.html (runtime render). Each
 * card panel with options gets one block inserted right after its
 * `cards-download` block, matched by heading text.
 */
function injectIntoPlainHtml(file, panelData) {
  if (!existsSync(file)) return 0;
  let html = readFileSync(file, 'utf8');
  if (html.includes('class="download-options"')) return 0; // already injected
  const withOptions = panelData.filter((p) => p.hasSelectors && p.options.length);
  let injected = 0;
  withOptions.forEach((panel) => {
    const headingEsc = panel.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(<div class="cards-download">(?:(?!<div class="cards-download">).)*?${headingEsc}.*?</div>\\s*</div>\\s*</div>)`, 's');
    if (re.test(html)) {
      html = html.replace(re, `$1${optionsBlockHtml(panel.options)}`);
      injected += 1;
    }
  });
  if (injected) writeFileSync(file, html, 'utf8');
  return injected;
}

/**
 * Inject download-options into the page's .md (JCR/AEM path). The block is
 * appended as a markdown gridtable after the cards-download gridtable that
 * contains the matching heading. Blocks in md are separated by `\n\n---\n\n`.
 */
function injectIntoMd(file, panelData) {
  if (!existsSync(file)) return 0;
  let md = readFileSync(file, 'utf8');
  if (/\|\s*Download Options\s*\|/.test(md)) return 0; // already injected
  const withOptions = panelData.filter((p) => p.hasSelectors && p.options.length);
  // Split into blocks on the horizontal-rule separators md2* uses.
  const parts = md.split(/\n---\n/);
  let injected = 0;
  withOptions.forEach((panel) => {
    const gridForCard = parts.findIndex((seg) => /\|\s*Cards Download\s*\|/.test(seg) && seg.includes(panel.heading));
    if (gridForCard >= 0) {
      parts[gridForCard] = `${parts[gridForCard].replace(/\s*$/, '')}\n\n${optionsBlockMd(panel.options)}\n`;
      injected += 1;
    }
  });
  if (injected) writeFileSync(file, parts.join('\n---\n'), 'utf8');
  return injected;
}

async function main() {
  const urls = parseArgs(process.argv.slice(2));
  if (!urls.length) {
    console.error('Usage: node capture-download-options.mjs <url> [...] | --urls <file>');
    process.exit(1);
  }

  let browser;
  const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] };
  try {
    browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
  } catch (e) {
    browser = await chromium.launch(launchOptions);
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  for (const url of urls) {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);
      const panelData = await page.evaluate(inPageExtract);
      const totalOptions = panelData.reduce((n, p) => n + p.options.length, 0);
      const base = contentPathBase(url);
      const injectedHtml = injectIntoPlainHtml(`${base}.plain.html`, panelData);
      // Also inject into .md when present (AEM/md2jcr path). The repo's own JCR
      // packager reads .plain.html; .md is injected only if produced elsewhere.
      const injectedMd = existsSync(`${base}.md`) ? injectIntoMd(`${base}.md`, panelData) : 0;
      console.log(`✓ ${url} → panels=${panelData.length} options=${totalOptions} injected(plain=${injectedHtml}, md=${injectedMd})`);
    } catch (e) {
      console.error(`✗ ${url}: ${e.message}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
  await browser.close();
}

main();
