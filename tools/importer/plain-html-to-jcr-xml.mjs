/**
 * Convert EDS plain.html fragment to Franklin JCR page XML for xwalk import.
 */
import { JSDOM } from 'jsdom';
import he from 'he';

const NS = 'xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0"';

function escHtml(html) {
  return he.encode(he.decode(html), { useNamedReferences: false, decimal: true });
}

function imgToDam(src, damPrefix) {
  if (!src) return '';
  const filename = src.replace(/^\.\/media\//, '').replace(/^.*\/media\//, '');
  return `${damPrefix}/media/${filename}`;
}

function innerHtml(el) {
  return [...el.childNodes].map((n) => n.outerHTML || n.textContent).join('');
}

function blockIndex(section, name) {
  section.blockCount = section.blockCount || {};
  section.blockCount[name] = (section.blockCount[name] || 0) + 1;
  const n = section.blockCount[name];
  return n === 1 ? 'block' : `block_${n - 1}`;
}

function heroBlockXml(blockEl, damPrefix, id) {
  const classes = [...blockEl.classList].filter((c) => c !== 'hero');
  const row = blockEl.firstElementChild;
  const cells = row ? [...row.children] : [];
  const textCell = cells[0] || blockEl;
  const mediaCell = cells[1];
  const img = mediaCell?.querySelector('img');
  const attrs = [
    `sling:resourceType="core/franklin/components/block/v1/block"`,
    'jcr:primaryType="nt:unstructured"',
    `name="Hero"`,
    'model="hero"',
    'modelFields="[classes,image,imageAlt,text]"',
    classes.length ? `classes="[${classes.join(',')}]"` : '',
    `text="${escHtml(innerHtml(textCell))}"`,
    img ? `image="${imgToDam(img.getAttribute('src'), damPrefix)}"` : '',
    img ? `imageAlt="${he.encode(img.getAttribute('alt') || '')}"` : '',
  ].filter(Boolean);
  return `<${id} ${attrs.join(' ')} />`;
}

function cardsBlockXml(blockEl, damPrefix, id) {
  const classes = [...blockEl.classList].filter((c) => c !== 'cards');
  const rows = [...blockEl.children];
  const items = rows.map((row, i) => {
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('img')) || cells[0];
    const bodyCell = cells.find((c) => c !== imageCell) || cells[1] || cells[0];
    const img = imageCell?.querySelector('img');
    return `<item_${i} sling:resourceType="core/franklin/components/block/v1/block/item" jcr:primaryType="nt:unstructured" name="Card" model="card" modelFields="[image,text]" image="${imgToDam(img?.getAttribute('src'), damPrefix)}" text="${escHtml(innerHtml(bodyCell))}" />`;
  }).join('\n                ');
  const attrs = [
    `sling:resourceType="core/franklin/components/block/v1/block"`,
    'jcr:primaryType="nt:unstructured"',
    'name="Cards"',
    'filter="cards"',
    'model="cards"',
    'modelFields="[classes]"',
    classes.length ? `classes="[${classes.join(',')}]"` : '',
  ].filter(Boolean).join(' ');
  return `<${id} ${attrs}>${items ? `\n                ${items}\n            ` : ''}</${id}>`;
}

function slalomBlockXml(blockEl, damPrefix, id) {
  const classes = [...blockEl.classList].filter((c) => c !== 'slalom');
  const rows = [...blockEl.children];
  const rowXml = rows.map((row, ri) => {
    const cells = [...row.children];
    const cellXml = (cells.length ? cells : [row]).map((cell, ci) => {
      const img = cell.querySelector('img');
      const content = img
        ? `<picture><img src="${imgToDam(img.getAttribute('src'), damPrefix)}" alt="${he.encode(img.getAttribute('alt') || '')}" /></picture>`
        : innerHtml(cell);
      return `<cell_${ci} jcr:primaryType="nt:unstructured" text="${escHtml(content)}" />`;
    }).join('\n                    ');
    return `<row_${ri} jcr:primaryType="nt:unstructured">\n                    ${cellXml}\n                </row_${ri}>`;
  }).join('\n                ');
  const attrs = [
    `sling:resourceType="core/franklin/components/block/v1/block"`,
    'jcr:primaryType="nt:unstructured"',
    'name="Slalom"',
    'model="slalom"',
    'modelFields="[classes]"',
    classes.length ? `classes="[${classes.join(',')}]"` : '',
  ].filter(Boolean).join(' ');
  return `<${id} ${attrs}>${rowXml ? `\n                ${rowXml}\n            ` : ''}</${id}>`;
}

function defaultContentXml(el, section, type) {
  const html = innerHtml(el);
  if (!html.trim()) return '';
  const id = `${type}_${section.idx}`;
  section.idx += 1;
  if (el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H1') {
    const level = el.tagName.toLowerCase();
    return `<${id} sling:resourceType="core/franklin/components/title/v1/title" jcr:primaryType="nt:unstructured" title="${he.encode(el.textContent)}" type="${level}" />`;
  }
  return `<${id} sling:resourceType="core/franklin/components/text/v1/text" jcr:primaryType="nt:unstructured" text="${escHtml(html)}" />`;
}

export function plainHtmlToJcrXml(plainHtml, { title, description, damPrefix = '/content/dam/xwalk-mon' } = {}) {
  const dom = new JSDOM(`<body>${plainHtml}</body>`);
  const { document } = dom.window;
  const sections = [...document.body.children].filter((el) => !el.classList?.contains('metadata'));

  const sectionXml = sections.map((sectionEl, si) => {
    const meta = [...sectionEl.children].find((el) => el.classList?.contains('section-metadata'));
    let styleAttr = '';
    if (meta) {
      const styleRow = [...meta.children].find((row) => row.children[0]?.textContent.trim() === 'style');
      const styleVal = styleRow?.children[1]?.textContent.trim();
      if (styleVal) styleAttr = ` style="${he.encode(styleVal)}"`;
    }

    const ctx = { idx: 0, blockCount: {} };
    const children = [];

    [...sectionEl.childNodes].forEach((node) => {
      if (node.nodeType !== 1) return;
      const el = node;
      if (el.classList?.contains('section-metadata')) return;

      if (el.classList?.contains('hero')) {
        children.push(heroBlockXml(el, damPrefix, blockIndex(ctx, 'block')));
      } else if (el.classList?.contains('cards')) {
        children.push(cardsBlockXml(el, damPrefix, blockIndex(ctx, 'block')));
      } else if (el.classList?.contains('slalom')) {
        children.push(slalomBlockXml(el, damPrefix, blockIndex(ctx, 'block')));
      } else {
        const content = defaultContentXml(el, ctx, 'text');
        if (content) children.push(content);
      }
    });

    return `            <section_${si} sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured"${styleAttr}>
                ${children.join('\n                ')}
            </section_${si}>`;
  }).join('\n');

  const metaEl = document.querySelector('.metadata');
  let pageTitle = title || 'Company';
  let pageDescription = description || '';
  if (metaEl) {
    [...metaEl.children].forEach((row) => {
      const key = row.children[0]?.textContent.trim();
      const val = row.children[1]?.textContent.trim();
      if (key === 'Title') pageTitle = val;
      if (key === 'Description') pageDescription = val;
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root ${NS} jcr:primaryType="cq:Page">
    <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="${he.encode(pageTitle)}" jcr:description="${he.encode(pageDescription)}" modelFields="[jcr:title,jcr:description]">
        <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
${sectionXml}
        </root>
    </jcr:content>
</jcr:root>`;
}
