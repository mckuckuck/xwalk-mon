/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-download (repeating download panels).
 * Base block: cards (container) — project block cards-download.
 * Source: https://www.mongodb.com/try/download/community (div.css-eeqf)
 *
 * The instance selector matches a single download panel; the importer invokes
 * this parser once per panel, so each invocation emits one card row.
 *
 * xwalk mapping requirement (see hinting.md): md2jcr aligns each authored CELL
 * to one model field, so we emit ONE cell per non-collapsed field of the
 * `cards-download-card` item model, in model order. Fields ending in a collapsed
 * suffix (`Alt`, `Text`) are NOT their own cells — they fold into a sibling
 * field's HTML:
 *   image / imageAlt        -> <img src alt>            (1 cell: image)
 *   tag                     -> product tag              (1 cell)
 *   heading                 -> main heading             (1 cell)
 *   text                    -> richtext description     (1 cell)
 *   codeSnippet             -> optional code snippet    (1 cell)
 *   versionLabel            -> selected version value   (1 cell)
 *   platformLabel           -> selected platform value  (1 cell)
 *   packageLabel            -> selected package value   (1 cell)
 *   downloadLink / downloadText -> <a href>text</a>     (1 cell: downloadLink)
 * => 9 cells. downloadText is the anchor's text, never its own cell.
 *
 * Empty optional fields (e.g. no code snippet, or a Kubernetes panel with no
 * version selectors) still emit their cell — empty, no hint — so every card row
 * has the same 9 columns and stays aligned with the model.
 */
export default function parse(element, { document }) {
  const icon = element.querySelector(':scope > img, img.mdb_backup, img');
  const tag = element.querySelector('h3, [class*="169n5o2"]');
  const heading = element.querySelector('h1, [class*="1bqc6bb"]');
  const descWrap = element.querySelector('.css-1otypu5 > div, .css-1otypu5');

  if (!heading && !tag) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cell = (hint, build) => {
    const div = document.createElement('div');
    if (build) {
      const content = build();
      if (content) {
        if (hint) div.appendChild(document.createComment(` field:${hint} `));
        div.appendChild(content);
      }
    }
    return div;
  };

  // 1. image (icon). imageAlt collapses into the <img alt> — no separate cell.
  const imageCell = cell('image', () => {
    if (!icon) return null;
    const img = document.createElement('img');
    img.setAttribute('src', icon.getAttribute('src'));
    if (icon.getAttribute('alt')) img.setAttribute('alt', icon.getAttribute('alt'));
    const pic = document.createElement('picture');
    pic.appendChild(img);
    return pic;
  });

  // 2. tag
  const tagCell = cell('tag', () => {
    if (!tag) return null;
    const h3 = document.createElement('h3');
    h3.textContent = tag.textContent.replace(/\s+/g, ' ').trim();
    return h3;
  });

  // 3. heading
  const headingCell = cell('heading', () => {
    if (!heading) return null;
    const h1 = document.createElement('h1');
    h1.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    return h1;
  });

  // 4. text (rich description): paragraphs not inside the code <pre>.
  const textCell = cell('text', () => {
    if (!descWrap) return null;
    const paras = [...descWrap.querySelectorAll('p')].filter((p) => !p.closest('pre'));
    if (!paras.length) return null;
    const frag = document.createElement('div');
    paras.forEach((p) => frag.appendChild(p.cloneNode(true)));
    return frag;
  });

  // 5. codeSnippet (optional)
  const codeArea = element.querySelector('pre textarea[id^="codesnippet"], pre textarea');
  const codeCell = cell('codeSnippet', () => {
    if (!codeArea) return null;
    const raw = (codeArea.value || codeArea.textContent || '').replace(/\n\s+/g, '\n').trim();
    if (!raw) return null;
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = raw;
    pre.appendChild(code);
    return pre;
  });

  const selectedValue = (id) => {
    const btn = element.querySelector(`#${id}`);
    if (!btn) return '';
    const val = btn.querySelector(':scope > span, span');
    return val ? val.textContent.replace(/\s+/g, ' ').trim() : '';
  };

  // 6. versionLabel  7. platformLabel  8. packageLabel
  const labelCell = (hint, id) => cell(hint, () => {
    const v = selectedValue(id);
    if (!v) return null;
    const p = document.createElement('p');
    p.textContent = v;
    return p;
  });
  const versionCell = labelCell('versionLabel', 'download-version');
  const platformCell = labelCell('platformLabel', 'download-platform');
  const packageCell = labelCell('packageLabel', 'download-package');

  // 9. downloadLink. downloadText collapses into the anchor's text.
  const downloadCell = cell('downloadLink', () => {
    const dl = element.querySelector('.css-162tvoi a[href], a.css-1s626b1, a[href*="repo.mongodb"], a[href*="download"]');
    if (!dl) return null;
    const a = document.createElement('a');
    a.setAttribute('href', dl.getAttribute('href'));
    a.textContent = (dl.textContent.replace(/\s+/g, ' ').trim()) || 'Download';
    return a;
  });

  const cells = [[
    imageCell,
    tagCell,
    headingCell,
    textCell,
    codeCell,
    versionCell,
    platformCell,
    packageCell,
    downloadCell,
  ]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-download', cells });
  element.replaceWith(block);
}
