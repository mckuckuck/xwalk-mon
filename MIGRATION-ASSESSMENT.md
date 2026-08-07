# MongoDB.com — EDS Migration Block Assessment

**Date:** 2026-08-07
**Site:** https://www.mongodb.com
**Scope:** English locale only. Excludes `/docs` (~26,000 pages) and `/community/forums` (~24,400 pages) and non-English locales.

---

## 1. Scope & method

- **3,238 English pages** in scope after exclusions (discovered via `sitemap-index.xml`).
- Analyzed a **representative sample of ~1,000 pages** — full coverage of all 100 URL groups, deep sampling of the largest groups.
- **989 pages analyzed** cleanly; 11 could not be captured (mostly `/try/download/…/releases/archive` pages).

Source data (on disk):
- `catalog/summary.json` — headline metrics
- `catalog/template-catalog.json` — 60 named templates + their URLs
- `catalog/block-catalog.json` — 331 block variants + page usage
- `tools/importer/page-templates.json` — migration artifact
- `catalog-previous/` — prior (23-page) catalog, kept for comparison

---

## 2. Headline numbers

| Metric | Value |
|---|---|
| English pages in scope | 3,238 |
| Pages analyzed (sample) | 989 |
| Page templates | 60 |
| Block variants detected | 331 |
| — mapping to standard EDS blocks | 231 |
| — custom / "unknown" | 100 |

**The 331 variants collapse to ~13 base block types.** Most variants are styling variations, not distinct blocks.

---

## 3. How many NEW blocks?

Base block types found, and whether the project already has them
(`blocks/`: cards, cards-download, columns, download-options, footer, form, fragment, header, hero, pricing-compare, sidebar-nav, slalom):

| Base block | Variants | Status |
|---|---|---|
| hero | 27 | ✅ exists |
| columns | 34 | ✅ exists |
| cards | 23 | ✅ exists |
| form | 12 | ✅ exists |
| header / footer | 1 each | ✅ exist |
| **quote** | 73 | ❌ **new** |
| **carousel** | 27 | ❌ **new** |
| **tabs** | 18 | ❌ **new** |
| **accordion** | 7 | ❌ **new** |
| **video** | 6 | ❌ **new** |
| **embed** | 1 | ❌ **new** |
| **search** | 1 | ❌ **new** |
| unknown | 100 | default content — not a block |

### Answer: ~7 new block types

- **5 that matter:** `quote`, `carousel`, `tabs`, `accordion`, `video`
- **2 optional:** `embed`, `search` (each appears on a single page)
- The **100 "unknown" variants** are default-content signatures (headings + images + paragraphs in "minimal-dark/light" sections) — authored as default content, **not** new blocks.
- Variant counts (e.g. 73 quote variants) reflect **styling variations**, delivered as CSS variants of one block — not 73 separate blocks.

---

## 4. New block → templates that depend on it

### quote — highest priority (17 templates)
blog-article (188), marketing-landing (93), legal-policy (57), careers-page (45),
blog-article-technical (28), product-feature-page (26), blog-article-secondary (7),
resource-basics-detail (5), case-study (3), solution-overview (2), program-detail (2),
event-subpage (2), + resource-basics-simple, use-case-detail, content-page-misc,
careers-teams, article-simple (1 each)

### tabs (4 templates)
marketing-landing (47), careers-page (6), careers-teams (2), blog-article-technical (1)

### carousel (7 templates)
policy-text-page (7), marketing-landing (5), campaign-landing (2), careers-page (2),
use-case-page (2), customer-story (1), product-release-notes (1)

### accordion (4 templates)
marketing-landing (10), event-subpage (2), blog-article (1), blog-article-technical (1)

### video (7 templates)
marketing-landing (4), policy-text-page (2), event-local-landing (2), use-case-page (2),
customer-story (1), comparison-page (1), event-local-detail (1)

### embed (1 template)
careers-page (1)

### search (1 template)
content-page-misc (1)

---

## 5. Per-template block dependency view

Numbers in parentheses = pages in that template using that block.
**Bold** = new block to build. "default" = headings/images/paragraphs (no block needed).

### Tier 1 — Large templates

| Template | Pages | Existing blocks | New blocks |
|---|---|---|---|
| blog-article | 267 | hero, columns, cards | **quote**, **accordion** |
| marketing-landing | 200 | hero, columns, cards, form, header, footer | **quote, tabs, carousel, accordion, video** |
| careers-page | 102 | hero, cards, columns | **quote, tabs, carousel, embed** |
| legal-policy | 57 | columns, hero | **quote** |
| blog-article-technical | 54 | hero, columns | **quote, tabs, accordion** |
| resource-basics-article | 47 | columns, cards, form, hero | — |
| product-feature-page | 28 | hero, columns, form | **quote** |
| resource-webinar | 24 | hero | — |

### Tier 2 — Mid-size templates

| Template | Pages | Existing blocks | New blocks |
|---|---|---|---|
| careers-teams | 19 | hero, columns | **quote, tabs** |
| resource-article-alt | 19 | hero, cards, columns, form | — |
| presentation-webinar | 19 | hero | — |
| resource-webinar-alt | 18 | hero | — |
| policy-text-page | 12 | hero, cards, columns, form | **carousel, video** |
| event-subpage | 10 | hero, columns | **quote, accordion** |
| research-group | 8 | hero, columns, form | — |
| partner-program-page | 8 | hero, cards | — |
| blog-article-secondary | 7 | hero | **quote** |
| program-detail | 6 | hero, form, columns | **quote** |
| download-product | 6 | cards, columns, hero | — |
| download-releases | 6 | default content only | — |

### Tier 3 — Small templates (≤5 pages)

| Template | Pages | Existing blocks | New blocks |
|---|---|---|---|
| resource-basics-detail | 5 | columns, hero | **quote** |
| use-case-page | 5 | hero, columns | **carousel, video** |
| campaign-landing | 4 | hero, cards, columns | **carousel** |
| customer-story | 4 | cards, hero, columns | **carousel, video** |
| solution-overview | 4 | columns, hero | **quote** |
| comparison-detail | 4 | hero | — |
| case-study | 3 | hero, cards | **quote** |
| section-landing | 3 | hero, columns | — |
| event-rules-page | 3 | cards, hero | — |
| careers-teams-alt | 3 | hero | — |
| content-page-misc | 2 | hero, cards, columns, form | **quote, search** |
| event-local-landing | 2 | cards, columns | **video** |
| event-local-landing-alt | 2 | hero | — |
| resource-product-detail | 2 | form | — |
| product-release-notes | 1 | cards, hero | **carousel** |
| comparison-page | 1 | hero | **video** |
| event-local-detail | 1 | default content only | **video** |
| article-simple | 1 | hero | **quote** |
| use-case-detail | 1 | hero | **quote** |
| resource-basics-simple | 1 | hero | **quote** |
| registration-form | 1 | form, hero | — |
| certification-detail | 1 | form, hero | — |
| try-landing | 1 | form, hero | — |
| form-apply | 1 | hero | — |
| form-page | 1 | hero | — |
| social-hub | 1 | hero | — |
| report-page | 1 | cards, hero | — |
| events-listing | 1 | hero | — |
| event-detail | 1 | default content only | — |
| event-sponsors | 1 | hero | — |
| event-sponsors-alt | 1 | columns, hero | — |
| event-official-rules | 1 | default content only | — |
| webinar-detail | 1 | default content only | — |
| legal-index | 1 | hero | — |
| resource-features | 1 | hero | — |
| resource-industry | 1 | columns | — |
| resource-usecase-webinar | 1 | hero | — |
| services-support | 1 | hero | — |
| download-releases-alt | 1 | default content only | — |
| download-detail | 1 | hero | — |

---

## 6. Recommended build sequence

1. **`quote` first** — unblocks 17 templates including the two biggest (blog-article 267, marketing-landing 200). Highest leverage by far.
2. **`tabs` + `accordion` + `carousel` + `video`** — completes marketing-landing plus the event/use-case templates.
3. **Migrate all new-block-free templates in parallel** — ~30 templates (including the whole resource/webinar/presentation family, ~127 pages) need nothing new and don't wait on block work.
4. **`embed` + `search` last** — each touches one page; confirm they're in scope before building.

**Critical path:** building `marketing-landing` + `blog-article` first exercises 5 of the 7 new blocks. After that, the remaining ~58 templates are mostly recombinations of existing blocks.

---

## 7. Comparison with previous catalog

| | Previous (`catalog-previous/`) | This run (`catalog/`) |
|---|---|---|
| Pages | 23 | 3,238 in scope (989 analyzed) |
| Templates | 2 | 60 |
| Block variants | 14 | 331 |

The previous run was a narrow 23-page snapshot. This run is a full-site scope and is the reliable basis for planning.
