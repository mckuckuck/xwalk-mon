/**
 * Generate company page JCR package for AEM upload.
 * Usage: node tools/importer/generate-jcr-package.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJcrPackage, createPage } from '@adobe/helix-importer-jcr-packaging';
import { plainHtmlToJcrXml } from './plain-html-to-jcr-xml.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const PLAIN_HTML = join(ROOT, 'drafts', 'company.plain.html');
const OUT_DIR = join(__dirname, 'output');
const SITE_PATH = '/content/xwalk-mon';
const DAM_PATH = '/content/dam/xwalk-mon';
const PAGE_PATH = '/company';
const PAGE_URL = 'https://www.mongodb.com/company';

const plainHtml = readFileSync(PLAIN_HTML, 'utf-8');
const jcrXml = plainHtmlToJcrXml(plainHtml, { damPrefix: DAM_PATH });

const assetUrls = [...plainHtml.matchAll(/(?:src|image)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => u.includes('/media/'))
  .map((u) => {
    const filename = u.replace(/^.*\/media\//, '');
    return `https://content.da.live/mckuckuck/da-mon/media/${filename}`;
  });

const page = createPage(PAGE_PATH, jcrXml, PAGE_URL);

await createJcrPackage(OUT_DIR, [page], [...new Set(assetUrls)], SITE_PATH, DAM_PATH, 'company-package');

console.log(`JCR package written to ${join(OUT_DIR, 'company-package.zip')}`);
console.log(`Asset mapping written to ${join(OUT_DIR, 'asset-mapping.json')}`);
