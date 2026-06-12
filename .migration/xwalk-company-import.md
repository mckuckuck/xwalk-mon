# Company Page — xwalk Import Status

## Completed

- [x] Port hero, cards, slalom blocks + MongoDB brand CSS/fonts
- [x] UE models: `_hero.json`, `_cards.json`, `_slalom.json`, `_section.json`
- [x] `fstab.yaml` → `mckuckuck/xwalk-mon/main`
- [x] Convert `da-mon/content/company.html` → `drafts/company.plain.html`
- [x] Copy 25 company page assets to `drafts/media/` and `tools/importer/assets/`
- [x] Generate JCR package: `tools/importer/output/company-package.zip`

## Pending (requires AEM CS dev token)

- [ ] Run `npm run aem-upload` with token from Cloud Manager Developer Console
- [ ] Verify page at `/company` in Universal Editor (`?cmd=open`)
- [ ] Verify preview: `https://main--xwalk-mon--mckuckuck.aem.page/company`

## Local validation

```bash
npm run prepare:company
aem up --html-folder drafts
# http://localhost:3000/company
```
