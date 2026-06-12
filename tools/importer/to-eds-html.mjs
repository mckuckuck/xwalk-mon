/**
 * Convert DA source HTML (blocks as <table>) into EDS plain.html (blocks as <div class>).
 * Inverse of da-mon/tools/importer/to-da-html.mjs.
 *
 * Usage:
 *   node tools/importer/to-eds-html.mjs <in.html> <out.plain.html> [--asset-prefix <url>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const args = process.argv.slice(2);
const assetPrefixIdx = args.indexOf('--asset-prefix');
const assetPrefix = assetPrefixIdx >= 0 ? args[assetPrefixIdx + 1] : './media';
const positional = args.filter((a, i) => {
  if (a === '--asset-prefix') return false;
  if (assetPrefixIdx >= 0 && i === assetPrefixIdx + 1) return false;
  return true;
});
const [inPath, outPath] = positional;

if (!inPath || !outPath) {
  console.error('usage: node to-eds-html.mjs <in.html> <out.plain.html> [--asset-prefix <url>]');
  process.exit(1);
}

const DA_MEDIA_RE = /https:\/\/content\.da\.live\/[^/]+\/[^/]+\/media\//g;

function toClassName(text) {
  return text
    .toLowerCase()
    .replace(/[^0-9a-z]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "Hero (split)" -> ["hero", "split"] */
function parseBlockClasses(headerText) {
  const trimmed = headerText.trim();
  const match = trimmed.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/);
  if (!match) return [toClassName(trimmed)];
  const base = toClassName(match[1].trim());
  const variants = match[2]
    ? match[2].split(',').map((v) => toClassName(v.trim())).filter(Boolean)
    : [];
  return [base, ...variants];
}

function remapAssets(root) {
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && DA_MEDIA_RE.test(src)) {
      const filename = src.replace(DA_MEDIA_RE, '');
      img.setAttribute('src', `${assetPrefix.replace(/\/$/, '')}/${filename}`);
      DA_MEDIA_RE.lastIndex = 0;
    }
  });
}

function moveChildren(from, to) {
  while (from.firstChild) {
    to.appendChild(from.firstChild);
  }
}

function tableToBlockDiv(table, doc) {
  const rows = [...table.querySelectorAll('tr')];
  if (!rows.length) return null;

  const headerText = rows[0].querySelector('td')?.textContent?.trim() || '';
  const blockName = headerText.toLowerCase();

  if (blockName === 'section metadata') {
    const meta = doc.createElement('div');
    meta.className = 'section-metadata';
    rows.slice(1).forEach((row) => {
      const cells = [...row.querySelectorAll('td')];
      if (cells.length < 2) return;
      const metaRow = doc.createElement('div');
      const keyCell = doc.createElement('div');
      const valCell = doc.createElement('div');
      keyCell.textContent = cells[0].textContent.trim();
      moveChildren(cells[1], valCell);
      if (!valCell.childNodes.length) valCell.textContent = cells[1].textContent.trim();
      metaRow.append(keyCell, valCell);
      meta.append(metaRow);
    });
    return meta;
  }

  if (blockName === 'metadata') {
    return null;
  }

  const block = doc.createElement('div');
  block.className = parseBlockClasses(headerText).join(' ');

  rows.slice(1).forEach((row) => {
    const cells = [...row.querySelectorAll('td')];
    const rowDiv = doc.createElement('div');
    if (cells.length <= 1) {
      const cell = cells[0] || row;
      moveChildren(cell, rowDiv);
    } else {
      cells.forEach((cell) => {
        const cellDiv = doc.createElement('div');
        moveChildren(cell, cellDiv);
        rowDiv.append(cellDiv);
      });
    }
    block.append(rowDiv);
  });

  return block;
}

function extractPageMetadata(table) {
  const meta = {};
  [...table.querySelectorAll('tr')].slice(1).forEach((row) => {
    const cells = [...row.querySelectorAll('td')];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim();
    meta[key] = cells[1].innerHTML.includes('<')
      ? cells[1].innerHTML
      : cells[1].textContent.trim();
  });
  return meta;
}

const html = readFileSync(inPath, 'utf-8');
const { window } = new JSDOM(html);
const { document } = window;
const main = document.querySelector('main');
if (!main) {
  console.error('No <main> found in input');
  process.exit(1);
}

const outBody = document.createElement('div');
let pageMeta = null;

[...main.children].forEach((section) => {
  const sectionDiv = document.createElement('div');
  [...section.childNodes].forEach((node) => {
    if (node.nodeType === 1 && node.tagName === 'TABLE') {
      const header = node.querySelector('tr td')?.textContent?.trim().toLowerCase() || '';
      if (header === 'metadata') {
        pageMeta = extractPageMetadata(node);
        return;
      }
      const block = tableToBlockDiv(node, document);
      if (block) sectionDiv.appendChild(block);
    } else if (node.nodeType === 1) {
      sectionDiv.appendChild(node);
    } else if (node.nodeType === 3 && node.textContent.trim()) {
      sectionDiv.appendChild(node.cloneNode());
    }
  });
  if (sectionDiv.childNodes.length) outBody.appendChild(sectionDiv);
});

remapAssets(outBody);

if (pageMeta) {
  const metaBlock = document.createElement('div');
  metaBlock.className = 'metadata';
  Object.entries(pageMeta).forEach(([key, value]) => {
    const row = document.createElement('div');
    const k = document.createElement('div');
    const v = document.createElement('div');
    k.textContent = key;
    if (value.includes('<')) {
      v.innerHTML = value;
    } else {
      v.textContent = value;
    }
    row.append(k, v);
    metaBlock.append(row);
  });
  outBody.appendChild(metaBlock);
}

const serialized = `${outBody.innerHTML}\n`;
writeFileSync(outPath, serialized, 'utf-8');
console.log(`converted ${inPath} -> ${outPath}`);
if (pageMeta) console.log('page metadata:', pageMeta);
