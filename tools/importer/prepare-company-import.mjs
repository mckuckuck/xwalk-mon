/**
 * Prepare company page for xwalk import:
 * 1. Convert DA HTML to EDS plain.html
 * 2. Copy referenced assets to drafts/media and tools/importer/assets
 * 3. Generate asset-mapping.json for aem-import-helper upload
 *
 * Usage: node tools/importer/prepare-company-import.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const DA_ROOT = join(ROOT, '..', 'da-mon');
const DA_HTML = join(DA_ROOT, 'content', 'company.html');
const DRAFTS_PLAIN = join(ROOT, 'drafts', 'company.plain.html');
const ASSETS_SRC = join(DA_ROOT, 'assets', 'media');
const DRAFTS_MEDIA = join(ROOT, 'drafts', 'media');
const IMPORTER_ASSETS = join(__dirname, 'assets');
const ASSET_MAPPING = join(__dirname, 'asset-mapping.json');

const SITE_NAME = 'xwalk-mon';
const DAM_FOLDER = 'xwalk-mon';
const AEM_AUTHOR = 'https://author-p92869-e1797231.adobeaemcloud.com';

mkdirSync(join(ROOT, 'drafts'), { recursive: true });
mkdirSync(DRAFTS_MEDIA, { recursive: true });
mkdirSync(IMPORTER_ASSETS, { recursive: true });

execSync(`node ${join(__dirname, 'to-eds-html.mjs')} ${DA_HTML} ${DRAFTS_PLAIN} --asset-prefix ./media`, {
  stdio: 'inherit',
});

const html = readFileSync(DA_HTML, 'utf-8');
const filenames = [...html.matchAll(/content\.da\.live\/[^/]+\/[^/]+\/media\/([^"']+)/g)]
  .map((m) => m[1])
  .filter((v, i, a) => a.indexOf(v) === i);

const mapping = {};
let copied = 0;
let missing = 0;

filenames.forEach((filename) => {
  const src = join(ASSETS_SRC, filename);
  const daUrl = `https://content.da.live/mckuckuck/da-mon/media/${filename}`;
  const damPath = `/content/dam/${DAM_FOLDER}/media/${filename}`;
  mapping[daUrl] = damPath;

  if (existsSync(src)) {
    copyFileSync(src, join(DRAFTS_MEDIA, filename));
    copyFileSync(src, join(IMPORTER_ASSETS, filename));
    copied += 1;
  } else {
    missing += 1;
    console.warn(`missing asset: ${filename}`);
  }
});

writeFileSync(ASSET_MAPPING, `${JSON.stringify(mapping, null, 2)}\n`, 'utf-8');

console.log('\nPrepared company import:');
console.log(`  plain.html: ${DRAFTS_PLAIN}`);
console.log(`  assets copied: ${copied}/${filenames.length} (${missing} missing)`);
console.log(`  asset-mapping: ${ASSET_MAPPING}`);
console.log('\nLocal preview: aem up --html-folder drafts');
console.log('\nGenerate JCR package: npm run generate:jcr');
console.log('\nUpload to AEM (requires AEM CS dev token from Cloud Manager):');
console.log(`  npm run aem-upload -- --token <token-file> --zip tools/importer/output/company-package.zip --asset-mapping tools/importer/output/asset-mapping.json --target ${AEM_AUTHOR} --local-assets tools/importer/assets`);
