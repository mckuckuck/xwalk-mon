Let me diagnose the md2jcr mapping error by inspecting the model, parser, and imported markup.The model has 11 fields but the parser bundles them into 3 cells using field-hint comments. Let me look at the imported markup and the xwalk parser requirements to see the exact mismatch.Let me check the xwalk parser requirements doc to understand md2jcr's field-mapping rules.This is a blocking issue — `cards-download` is used by all download pages, so the md2jcr mapping must be fixed before migrating more. Let me read the field-hinting rules to build an accurate fix.# Fix Cards Download md2jcr Mapping, then Migrate Remaining Download Pages

## Immediate blocker: `cards-download` fails md2jcr
`md2jcr` reports **"Cards Download has errors! The content isn't mapping to the model correctly… every field must align with a column, even if empty."** This blocks JCR/upload for every download page, so it must be fixed before migrating more pages.

### Root cause (from the field-hinting rules)
The `cards-download-card` item model has 11 fields; the parser crams them into **3 cells** with multiple hints each. Two problems violate the xwalk hinting rules (`hinting.md`):

1. **Collapsed field emitted as its own hint.** `downloadText` ends in `Text` → it is a *collapsed* field (Rule 3): its value must become the **anchor text of `downloadLink`**, never its own `<!-- field:downloadText -->` cell. The current output emits `<!-- field:downloadText --><p>Download</p>`, which md2jcr can't map. (`imageAlt` is already correctly collapsed into `<img alt>`.)
2. **Cells don't align with model fields.** The model's fields share no underscore prefix, so md2jcr expects **one cell per (non-collapsed) field** — 9 cells. The parser produces only 3 grouped cells, so fields don't line up with columns → the reported error.

### The fix (recommended)
Emit **one cell per non-collapsed model field**, in model order, each with its single field hint; drop the `downloadText` hint (fold its label into the `downloadLink` anchor text). Net **9 cells**:

`image` · `tag` · `heading` · `text` · `codeSnippet` · `versionLabel` · `platformLabel` · `packageLabel` · `downloadLink`

(`imageAlt` and `downloadText` are collapsed → no cells.)

- **Block JS impact:** minimal. `cards-download.js` already reads fields by hint via `fieldsInCell` per cell, so more cells still render correctly. Only change: derive the download button label from the `downloadLink` anchor's own text instead of a separate `downloadText` field.
- **Alternative (not chosen):** rename selector fields with a shared prefix (`selector_version/platform/package`) to legitimately group them into one cell. More model churn; defer unless you prefer grouped columns.

### Why the earlier import "looked" fine
The `.plain.html` renders correctly in the browser (block JS reads hints regardless of cell count), so the visual pilots passed — but md2jcr's stricter model-column alignment rejects it. This is a content-model correctness fix, not a visual one.

## "Community not in upload options"
Likely a **symptom of the same failure**: because `cards-download` errors during md2jcr, the community download page can't be packaged, so it's absent from the JCR/upload manifest. Re-verify after the mapping fix; if still missing, inspect the JCR package generation list separately.

## Remaining pages to migrate (19)
Same single-card + client-side assembly model already used for Community Edition, applied per group:
- **Enterprise (4):** `enterprise-advanced`, `enterprise`, `ops-manager`, `enterprise-kubernetes-operator`
- **Tools (10):** `tools`, `shell`, `compass`, `atlascli`, `atlas-kubernetes-operator`, `mongocli`, `mongosync`, `relational-migrator`, `database-tools`, `bi-connector`
- **SQL Interface (5):** `sql-interface`, `power-bi-connector`, `tableau-connector`, `jdbc-driver`, `odbc-driver`

Each group's source must be confirmed to follow the Community pattern (every URL serves the same multi-panel page, each panel wrapped in a stable `#id`) so the per-page single-card scoping map (`PANEL_ID_BY_SLUG`) can be extended.

## Checklist

### Phase 1 — Fix cards-download md2jcr mapping (blocker)
- [ ] Re-read `_cards-download.json` model + `hinting.md` collapse rules to confirm the 9 non-collapsed fields
- [ ] Update `tools/importer/parsers/cards-download.js`: emit ONE cell per non-collapsed field (model order); drop the `downloadText` hint (fold label into `downloadLink` anchor text); keep `imageAlt` collapsed on `<img>`
- [ ] Update `blocks/cards-download/cards-download.js`: read the download button label from the `downloadLink` anchor text instead of a separate `downloadText` field
- [ ] Rebuild aggregated component JSON (`build:json` equivalent) and confirm no id collisions
- [ ] Re-import the 3 Community pages; verify each `.plain.html` has 9 aligned cells + single card
- [ ] Run md2jcr on `/try/download/community` → confirm **no mapping error**
- [ ] Confirm the community page now appears in the JCR/upload options
- [ ] 🧑 CHECKPOINT: confirm md2jcr passes before scaling to other groups

### Phase 2 — Confirm source shape per remaining group
- [ ] Inspect Enterprise, Tools, SQL Interface source pages: confirm shared-multi-panel pattern
- [ ] Capture each panel's stable `#id` and map URL slug → panel id (extend `PANEL_ID_BY_SLUG`)
- [ ] Note any group whose pages are genuinely distinct (would skip single-card scoping)

### Phase 3 — Import Enterprise group (4)
- [ ] Add the 4 URLs; import single-card per page via extended scoping map
- [ ] Verify 1 card per page + correct heading; md2jcr passes for each
- [ ] Verify accordion expands Enterprise group; assembly shows all 4 cards in nav order, no reflow

### Phase 4 — Import Tools group (10)
- [ ] Extend scoping map for the 10 Tools slugs; import single-card per page
- [ ] Verify 1 card per page; md2jcr passes; assembly + scroll-spy correct across 10 cards

### Phase 5 — Import SQL Interface group (5)
- [ ] Extend scoping map for the 5 SQL Interface slugs; import single-card per page
- [ ] Verify 1 card per page; md2jcr passes; assembly + scroll-spy correct

### Phase 6 — Full verification
- [ ] All 22 download pages: md2jcr passes, each in upload/JCR manifest
- [ ] Nav accordion opens the right group per page; single highlight bar; click-scroll + scroll-spy correct
- [ ] No-reflow assembly holds for the largest group (Tools, 10 cards)
- [ ] `npm run lint` (JS + CSS) and rebuild aggregated JSON clean

---
*This plan is for review. Execution (editing parser/block JS, re-import, rebuild JSON, md2jcr checks) requires switching to Execute mode.*
