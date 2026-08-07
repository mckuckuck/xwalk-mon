# MongoDB.com — EDS Migration Block Assessment

**Date:** 2026-08-07
**Site:** https://www.mongodb.com
**Scope:** English locale only. Excludes `/docs` (~26,000 pages), `/community/forums` (~24,400 pages), non-English locales, and **`/try/download/*` (treated as special pages — excluded from this assessment)**.

---

## 1. Scope & method

- **3,219 English pages** in scope after exclusions (3,238 discovered via `sitemap-index.xml`, minus 19 `/try/download` pages).
- Analyzed a **representative sample of ~1,000 pages** — full coverage of all URL groups, deep sampling of the largest groups.
- **989 pages analyzed** cleanly.

> **Note on `/try/download/*`:** these are special pages and are excluded from every
> figure and table below. Four templates that consisted entirely of download pages
> (`download-releases`, `download-product`, `download-releases-alt`, `download-detail`)
> and 8 block variants used only on download pages have been dropped. The raw
> `catalog/` analysis data still contains them as untouched evidence.

Source data (on disk):
- `catalog/summary.json` — headline metrics (raw, includes download pages)
- `catalog/template-catalog.json` — named templates + their URLs (raw)
- `catalog/block-catalog.json` — block variants + page usage (raw)
- `tools/importer/page-templates.json` — migration artifact
- `catalog-previous/` — prior (23-page) catalog, kept for comparison

---

## 2. Headline numbers

| Metric | Value |
|---|---|
| English pages in scope (excl. /try/download) | 3,219 |
| Pages analyzed (sample) | 989 |
| Page templates (excl. 4 download-only) | 56 |
| Block variants detected (excl. 8 download-only) | 323 |
| — mapping to standard EDS blocks | 228 |
| — custom / "unknown" | 95 |

**The 323 variants collapse to ~13 base block types.** Most variants are styling variations, not distinct blocks.

> **⚠️ The catalog's base-block LABELS are unreliable.** Screenshot verification found the
> detector groups regions by visual signature, then attaches a semantic name that is often
> wrong (see `.migration/unknown-block-review/FINDINGS.md`). Confirmed mislabels: `quote`
> is body text (not quotes), `tabs` mixes testimonial sliders + code blocks, FAQ accordions
> hide inside `columns`, `carousel` mixes real sliders with logo rows, `video` is mostly
> text/hero sections (only ~1 real embed), and even `cards` is contaminated (its largest
> variant is a testimonial). **Trust the screenshots, not the labels.** Section 3 below
> reflects the screenshot-verified reality.

---

## 3. How many NEW blocks?

Base block types the catalog reported, and what screenshot verification found each
actually contains. Existing project blocks: `blocks/`: cards, cards-download, columns,
download-options, footer, form, fragment, header, hero, pricing-compare, sidebar-nav, slalom.

| Catalog label | Variants | Verified reality | New block? |
|---|---|---|---|
| hero | 27 | Hero — mostly one block + optional fields | ✅ exists |
| columns | 33 | Columns — **but contaminated with FAQ accordions** | ✅ exists (see accordion) |
| cards | 21 | Card grids — **but contaminated: largest variant (38 pages) is a testimonial, others are white-paper body text** | ✅ exists (count overstated) |
| form | 12 | Form | ✅ exists |
| header / footer | 1 each | Header / footer | ✅ exist |
| ~~quote~~ | 73 | **Body text — article/section prose. NOT quotes.** | ❌ default content, NOT a block |
| carousel | 27 | **Mixed:** real sliders (arrows/dots) + logo/blurb rows | ⚠️ carousel real, count inflated |
| tabs | 18 | **Mixed:** testimonial sliders + code-snippet blocks | ⚠️ 2 different blocks, not "tabs" |
| accordion | 7 (+FAQs in columns) | FAQ accordions (~90 pages) | ✅ **new** |
| video | 6 | **Mostly mislabeled:** only ~1 real YouTube embed (~7 pages); rest are text/screenshot sections or a hero-with-bg-video | ⚠️ video real, ~1 variant |
| embed | 1 | Embed (1 page) | ✅ new (optional) |
| search | 1 | Search (1 page) | ✅ new (optional) |
| unknown | 95 | Default content + repeating grid items | ❌ not a block |

### Answer: ~4–5 genuinely new blocks (revised down from the initial "~7")

Screenshot verification substantially changed the picture:

- **`quote` is OFF the list.** The 73 "quote" variants are **body text** (blog/article/section
  prose), not quotes — authored as default content. This was the largest item on the original
  list; removing it is the biggest single correction.
- **`carousel`** — real (a "Featured Resources" slider with arrows + pagination dots), but the
  27-variant count is inflated by logo/blurb rows that are really cards/default content.
- **`accordion`** — real (FAQ), and **bigger than first reported**: a family of FAQ accordions
  was mislabeled as `columns`, so its true footprint is ~13 variants / ~95 page-uses / ~90 pages.
- **Testimonial / quote-slider** — a real block (customer logo selector + pull-quote + stats +
  "Read the Case Study" CTA) that the catalog **mislabeled as `tabs`**. This is where the actual
  quotes live — not in the `quote` bucket.
- **Code block** — a JSON/code snippet with a language tab + copy button, also mislabeled as
  `tabs`. Genuinely new; not previously on the list.
- **`video`** — real, low-effort embed.
- **`embed`, `search`, true tabbed panels** — each single-page / unconfirmed; defer until scoped.

**Realistic new-block build list:** `carousel`, `accordion`, `testimonial-slider`, `code-block`,
`video` (≈5). `quote` is removed. `tabs` as a generic block is unconfirmed. The **95 "unknown"**
variants are default content / repeating grid items, not blocks.

---

## 4. New block → templates that depend on it

> These template lists are derived from the catalog's original labels, which are known to
> be inaccurate (see §3 warning). The **relative reach** is still useful for sequencing, but
> treat the block names as approximate — e.g. much of the old "quote" reach is really default
> content, and the "tabs" reach splits between testimonial-slider and code-block.

### ~~quote~~ — REMOVED (was "17 templates")
The 73 "quote" variants are **body text**, not a block. The pages previously attributed to
`quote` (blog-article, marketing-landing, legal-policy, careers-page, etc.) need **default
content**, not a new block.

### carousel (real slider; ~7 templates, count inflated)
policy-text-page (7), marketing-landing (5), campaign-landing (2), careers-page (2),
use-case-page (2), customer-story (1), product-release-notes (1) — minus the logo/blurb
rows that are really cards.

### accordion (FAQ; more than first reported)
Reported: marketing-landing (10), event-subpage (2), blog-article (1), blog-article-technical (1).
**Plus** the FAQ accordions mislabeled as `columns`: ~79 more pages across product/resources/
legal templates. Accordion's true reach is ~90 pages.

### testimonial-slider (was mislabeled `tabs`)
Customer logo selector + pull-quote + stats + CTA. Appears on marketing/customer/solution
pages — this is where the real "quotes" are. (Catalog attributed these to `tabs`:
marketing-landing, careers-page, careers-teams, blog-article-technical.)

### code-block (was mislabeled `tabs`)
JSON/code snippet with language tab + copy button — appears on technical/resource pages
(e.g. resource-basics, blog-article-technical).

### video (~7 templates)
marketing-landing (4), policy-text-page (2), event-local-landing (2), use-case-page (2),
customer-story (1), comparison-page (1), event-local-detail (1)

### embed / search / true tabs — single-page or unconfirmed
embed → careers-page (1); search → content-page-misc (1); generic tabbed panels → not
confirmed to exist. Defer all three until individually scoped.

---

## 5. Per-template block dependency view

Numbers in parentheses = pages in that template using that block.
**Bold** = new block to build. "default" = headings/images/paragraphs (no block needed).

> **Read `quote` and `tabs` in this table with the §3 correction in mind:**
> - **`quote` = default content, NOT a block.** Wherever a row lists **quote**, read it as
>   "body-text sections authored as default content" — no new block required.
> - **`tabs`** in this table is really **testimonial-slider and/or code-block** (the catalog
>   conflated them). Treat it as "needs one of those verified blocks," not a generic tabs block.
>
> The table is left as originally generated for traceability; the labels above are the
> corrections. The Existing-blocks column is unaffected.

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

---

## 6. Recommended build sequence

Revised after screenshot verification (§3). `quote` is gone; the real new blocks are
`accordion`, `carousel`, `testimonial-slider`, `code-block`, `video`.

1. **Nothing blocks the biggest templates.** `blog-article` (267) and much of
   `marketing-landing` (200) are **default content + existing blocks** once `quote` is
   recognized as body text. Start migrating these immediately — no new block needed for the
   bulk of their pages.
2. **`accordion` first among new blocks** — highest real reach (~90 pages across product/
   resource/legal/marketing templates once the FAQ-in-columns pages are counted).
3. **`carousel`** — the "Featured Resources" slider; verify each candidate is a true slider
   (arrows/dots), not a logo/blurb row (which is cards/default content).
4. **`testimonial-slider`** — customer logo + pull-quote + stats + CTA (the real "quotes").
5. **`code-block`** — JSON/code snippet with language tab + copy button, for technical pages.
6. **`video`** — low-effort embed, broad but shallow.
7. **`embed`, `search`, generic tabs** — single-page/unconfirmed; scope individually or skip.

**Critical caveat:** the block *names and counts* in this document come from a detector whose
semantic labels proved unreliable. Before committing engineering effort, each new block above
should be confirmed against the screenshots in `.migration/block-gallery/` and the corrections
in `.migration/unknown-block-review/FINDINGS.md`. The trustworthy takeaway is the **shape** of
the work: ~5 real new blocks, `quote` is not one of them, and the largest templates are mostly
default content.

---

## 7. Comparison with previous catalog

| | Previous (`catalog-previous/`) | This run (`catalog/`) |
|---|---|---|
| Pages | 23 | 3,219 in scope, excl. /try/download (989 analyzed) |
| Templates | 2 | 56 (excl. 4 download-only) |
| Block variants | 14 | 323 (excl. 8 download-only) |

The previous run was a narrow 23-page snapshot. This run is a full-site scope and is the reliable basis for planning.
