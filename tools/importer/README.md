# xwalk-mon Content Importer

Tools to convert da-mon DA HTML into xwalk EDS markup and AEM CS JCR packages.

## Company page workflow

```bash
# 1. Convert DA HTML + copy assets for local preview
npm run prepare:company

# 2. Preview locally
aem up --html-folder drafts
# Open http://localhost:3000/company

# 3. Generate JCR content package
npm run generate:jcr
# Output: tools/importer/output/company-package.zip
#         tools/importer/output/asset-mapping.json

# 4. Upload to AEM CS (requires dev token from Cloud Manager Developer Console)
npm run aem-upload -- \
  --token /path/to/aem-dev-token.txt \
  --zip tools/importer/output/company-package.zip \
  --asset-mapping tools/importer/output/asset-mapping.json \
  --target https://author-p92869-e1797231.adobeaemcloud.com \
  --local-assets tools/importer/assets \
  --images-to-png false
```

## Files

| File | Purpose |
|------|---------|
| `to-eds-html.mjs` | DA table HTML → EDS `div` block markup |
| `plain-html-to-jcr-xml.mjs` | EDS plain.html → Franklin JCR page XML |
| `generate-jcr-package.mjs` | Builds installable JCR zip via `@adobe/helix-importer-jcr-packaging` |
| `prepare-company-import.mjs` | End-to-end prep: convert, copy 25 assets, write asset-mapping |
| `asset-mapping.json` | DA media URLs → `/content/dam/xwalk-mon/media/` paths |
| `import.js` | Optional import rules for `aem-import-helper import` (xwalk API) |
| `urls.txt` | Source URL list for bulk import via Import as a Service |

## Asset paths

- Local preview: `drafts/media/` (referenced as `./media/` in plain.html)
- AEM DAM: `/content/dam/xwalk-mon/media/`
- JCR page: `/content/xwalk-mon/company`

## Notes

- DA `content.da.live` URLs are remapped to DAM paths during JCR generation.
- Section metadata tables become `div.section-metadata` blocks (handled by `aem.js`).
- Page metadata tables become `div.metadata` at the end of plain.html.
- AEM upload requires an **AEM CS local development token** (not a DA token).
