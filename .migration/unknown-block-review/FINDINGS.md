# "Unknown" Block Variants — Verification Review

**Date:** 2026-08-07
**Purpose:** Validate whether the 100 "unknown" block variants reported in the site
scope represent new blocks to build, or something else. 10 pages across 10 distinct
template types were annotated (red boxes mark every region the analyzer classified as
"unknown"). Source screenshots are the cached full-page captures from the catalog;
boxes drawn from each block's stored `bounds`.

## Verdict

**The "unknown" count is NOT a count of new blocks. It is heavily inflated.**

> **Scope note:** `/try/download/*` pages are treated as special pages and are
> excluded from this review and the surrounding assessment.

The analyzer emits "unknown" whenever it can't confidently match a region to a known
EDS block signature. In practice, the flagged regions fall into two buckets — neither
of which is a new bespoke block:

1. **Default content** (the majority) — heading + paragraph + bullet-list text sections.
   These are authored directly as default content; no block at all.
2. **Repeating items counted individually** — grid/list items each flagged separately,
   when together they are ONE existing block (e.g. `cards`).

A few regions do hint at real blocks (CTA banner, stats row) — but those are already
accounted for under `cards` and `columns`, not net-new.

## MAJOR CORRECTION — `quote` is a mislabel, not a new block

**The 73 "quote" variants are NOT quotes and NOT a new block.** Inspecting the actual
screenshots and content signatures shows the `quote` label is a **catch-all bucket for
text-body regions** — article/section prose. Examples verified visually:

- `quote-dense-dark-withimg` (84 pages): a **blog article body** — hero illustration +
  prose paragraphs + a "Check out our AI Learning Hub" callout. Its page-catalog entry:
  4 headings, **19 paragraphs, 14 links**, selector `article.break-words.text-left`.
- `quote-moderate-dark` (65 pages): a **policy/FAQ text section** ("How can I tell if an
  offer of employment is genuine?") — plain body copy.
- `quote-minimal-dark-1` (41 pages): a **certification description** — heading + paragraph.

Breakdown of all 73 variants by structure:

| Group | Variants | Page-uses | What it is |
|-------|----------|-----------|------------|
| Pure prose (`heading`/`text`/`list` only) | 14 | 306 | default content — body text |
| Prose + inline images/CTAs (`heading + text + N images/CTAs + list`) | 59 | 412 | default content — body text with inline figures / link rows |

No testimonials or pull-quotes were found. The classifier maps "text-dominant region,
few children, no grid/form/media-gallery" to the label `quote`, and every slight
variation (± subhead, ± list, 1 vs 7 inline images) spawns a new "variant" — hence 73.

**Impact:** `quote` should be **removed from the new-block list entirely** — it is
default content. This drops the largest item from the estimate (it was #1 by page
count, ~17 templates / ~460 page-uses).

## Base-block label verification — screenshot spot-checks

Every base-block bucket that was checked against real screenshots turned out to be
**mislabeled or mixed**. The detector clusters by visual signature, then attaches a
semantic name that is frequently wrong. Summary of what each bucket ACTUALLY contains:

| Catalog label | Verified via screenshots | Real block? |
|---------------|--------------------------|-------------|
| `quote` (73) | Body text — blog/article/section prose. No quotes. | ❌ default content |
| `columns` (33) | Columns — **but 6 variants / ~79 pages are FAQ accordions** | ✅ columns (contaminated) |
| `cards` (21) | **Mixed:** real card grids, BUT the largest variant `cards-minimal-dark-7` (38 pages) is a **testimonial pull-quote**, and `cards-moderate-dark`/`-5` are **white-paper body text** | ⚠️ cards real, contaminated |
| `carousel` (27) | **Mixed:** real sliders (arrows/dots) + logo/blurb rows (really cards/default) | ⚠️ carousel real, inflated |
| `tabs` (18) | **Mixed:** testimonial sliders + code-snippet blocks — NOT generic tabs | ⚠️ 2 real blocks mislabeled |
| `video` (6) | **Mixed:** 1 real YouTube embed (`video-minimal-dark`, 7 pages); others are text+screenshot sections or a hero-with-bg-video | ⚠️ video real but only ~1 variant |
| `accordion` (7) | FAQ accordions (+ the 6 hiding in `columns`) | ✅ **new**, real, ~90 pages |

**The real testimonial/pull-quote block exists** — but scattered across `tabs` and `cards`,
never in the `quote` bucket. It is the single most consistently-appearing genuine new block.

### Verified detail — `video` (6 variants, 13 page-uses)
- `video-minimal-dark` (7 pages): **real** — YouTube embed ("Watch on YouTube", share icon,
  thumbnail) + caption. This is the genuine video block.
- `video-minimal-dark-5` (3 pages): text + product-screenshot section → default content.
- `video-minimal-dark-1` (1 page): event **hero with background video** (pause button) → a
  hero variant, not a standalone video block.
- Net: video is real but essentially **one variant on ~7 pages**, not 6 distinct blocks.

### Verified detail — `cards` (21 variants)
- `cards-minimal-dark-7` (38 pages, the LARGEST "cards" variant): a **testimonial pull-quote**
  (customer logo + `{` mark + quote + attribution) → belongs with testimonial-slider, not cards.
- `cards-moderate-dark` (7 pages) & `cards-moderate-dark-5` (4 pages): **white-paper body
  text** (heading + prose + bullets + CTAs) → default content.
- Genuine card grids do exist in the bucket (e.g. the office-locations grid, `grid=true`
  variants), so `cards` stays an existing block — but its 21-variant count is overstated.

### Genuinely-new block list (after all spot-checks)
`accordion` (real, ~90 pages), `carousel` (real slider), `testimonial-slider` (from tabs+cards),
`code-block` (from tabs), `video` (~1 real variant). **≈5 blocks.** `quote` is removed; generic
`tabs`, `embed`, `search` are unconfirmed/single-page. **Trust screenshots, not the labels.**

## Per-page evidence

| # | Template | Unknown regions | What they actually are |
|---|----------|-----------------|------------------------|
| 01 | marketing-landing | 44 (office-locations page) | ~40 individual **office-location cards** in a 3-col grid → ONE `cards` block, not 40 |
| 02 | careers-page | 33 | Mix of text sections + repeating cards/benefit tiles → default content + `cards` |
| 03 | use-case-page | 164 (!) | Extreme inflation — long page, every text/media sub-section flagged → default content |
| 04 | research-group | 11 | Heading+paragraph research descriptions → default content |
| 06 | customer-story | 10 | Only 2 of 10 are block-worthy: #1 stats row (`columns`) + #10 CTA banner. The other 8 are default content (text sections + standalone images). See worked example below. |
| 07 | event-local-landing-alt | 14 | Event detail text + agenda/speaker items → default content + cards |
| 08 | partner-program-page | 21 | Long-form program text sections → default content |
| 09 | policy-text-page | 4 | "The fast track…", "Benefits", "What you get", "How it works" → pure **default content** |
| 10 | section-landing | 15 | Section hub intro + link/overview tiles → default content + cards |

## Worked example — marketing-landing "Office Locations" (page 01)

This page is the clearest illustration of bucket #2 ("repeating items counted
individually"). Sorting its blocks by vertical position, the real structure is a set
of **card grids under section headers**:

```
hero      x=48   y=248    w=1344   "Office Locations" banner
columns   x=40   y=880    w=1360   section title: "MongoDB Headquarters"
unknown   x=0    y=1040   w=1440   HQ pair (NYC + Dublin) — "2 headings + 2 images" → a 2-up card row
columns   x=40   y=1764   w=1360   section title: "North & South America"
unknown   x=40   y=1940   w=421  ┐
unknown   x=509  y=1940   w=421  │  3-up card grid — every tile is 421px wide
unknown   x=979  y=1940   w=421  ┘  at x=40 / x=509 / x=979 (identical columns)
... (same 3-column pattern repeats for EMEA and Asia Pacific)
```

**What it actually is:** ONE `cards` block, rendered in two column densities — a
**2-up** row for HQ and **3-up** grids for each region. The four `columns` entries
interleaved at y=880/1764/4368/7416 are **not cards** — they are the section title rows
("MongoDB Headquarters", "North & South America", etc.).

**Why it became ~40 "unknowns":** the detector scores each region on its own structural
signature and does two things that inflate the count here:

1. **It does not roll repeating siblings into a grid.** Each city tile has the signature
   `"1 heading + 1 image [+ 1 paragraph]"`. Every tile is scored independently, so a grid
   of 30 cities becomes 30 separate detections instead of one `cards` block.
2. **A bare heading+image tile does not match the `cards` fingerprint.** The known-block
   matcher only stamps `cards` when a region matches that block's expected DOM shape;
   these tiles did not, so they fell through to `unknown`. (The HQ pair happened to be
   captured as a single full-width "2 images" box, which is why it reads as 1 unknown,
   not 2.)

**Modeling takeaway:** this is **one `cards` block, not 40 — and not even 2 blocks.**
Card column-count in EDS is a **style/variant concern**, not a separate block: reuse the
existing `cards` block and drive the 2-up vs 3-up layout with a variant class or section
metadata. **Net new blocks for this page: zero.**

## Worked example — customer-story "Omnichat" (page 06)

This page illustrates bucket #1 (default content) mixed with a couple of genuine
block candidates — and shows why even the block-worthy regions are **not net-new**.
Ordered top-to-bottom, the 10 "unknown" regions are:

| # | y | Signature (h/p/img/btn) | What it is | Verdict |
|---|-----|-------------------------|------------|---------|
| 1 | 780 | 0/0/0/0 (`absolute`) | Stats/metadata row: Industry, Product, Use Case, Customer Since | **block** → `columns`/stats (existing) |
| 2 | 1050 | text section | Intro narrative | default content |
| 3 | 2097 | 1 image | Inline graphic | default content |
| 4 | 2566 | text section | "The challenge" body | default content |
| 5 | 4044 | 1 image | Author headshot | default content (or part of a quote) |
| 6 | 4652 | text section | "The solution" body | default content |
| 7 | 5906 | text section | "The results" body | default content |
| 8 | 6772 | 1 image | Inline graphic | default content |
| 9 | 7216 | text section | Closing narrative | default content |
| 10 | 7596 | 2 headings + 1 CTA | "What will your story be?" banner | **block** → CTA banner |

**Key detail:** #1 reports `0h 0p 0img` because the analyzer tagged it `"absolute"` — it
could not introspect the children of an absolutely-positioned container, which is exactly
*why* it fell into `unknown` instead of being recognized as a stats/`columns` row. This is
a detection blind spot, not evidence of a bespoke block.

**Modeling takeaway:** 8 of 10 regions are **default content** (text + standalone images).
The 2 real block candidates are **not new**: the stats row (#1) is a `columns`/`cards`
variant you already have, and the CTA banner (#10) is default content (heading + button)
or at most a small reusable banner. **Net new blocks for this page: zero.**

## Worked example — FAQ accordions mislabeled as `columns` (cross-bucket error)

Spot-checking the block gallery surfaced a **systematic misclassification in the
`columns` bucket** (not the `unknown` bucket): a family of FAQ accordions was tagged
as `columns`. Every one is an "FAQ"/"FAQs" heading over collapsible question rows with
`+`/`−` toggle icons — confirmed visually on `columns-minimal-light-5`, `-10`, `-3`,
and `-6` (screenshots show the first row expanded with a `−` and revealed answer,
the rest collapsed with `+`).

**Variants affected (all really `accordion`):**

| variant | pages | recorded structure |
|---------|-------|--------------------|
| columns-minimal-light-10 | 24 | heading + text + 5 CTAs + 5 images |
| columns-minimal-light-5  | 24 | heading + text + 4 CTAs + 4 images |
| columns-minimal-light-3  | 22 | heading + text + 3 CTAs + 3 images + list |
| columns-minimal-light-6  | 5  | heading + text + 6 CTAs + 6 images + list |
| columns-minimal-light-4  | 4  | heading + text + 2 CTAs + 2 images + list |
| columns-minimal-light-7  | 2  | heading + text + 7 CTAs + 7 images |

**6 variants · ~81 page-uses · 79 unique pages** — all FAQ accordions, not columns.

**Why it got misclassified:** the detector recorded the FAQ heading + question labels +
"Learn more" links + `±` toggle icons as `heading + text + N CTAs + N images` (with
N = number of questions), saw a repeating vertical stack, and bucketed it as `columns`.
It cannot detect the expand/collapse behavior from a static screenshot — the **same
"static structure can't see interactivity" blind spot** that inflated the office-locations
grid and hid the customer-story stats row.

**Impact on the estimate:** does NOT add a new block type — `accordion` was already on
the build list — but it **materially raises accordion's real footprint**. The original
accordion count (~7 variants / ~14 page-uses) understated it; adding these brings
accordion to roughly **~13 variants / ~95 page-uses across ~90 pages**, making it a
higher priority than the raw catalog numbers suggested. Correspondingly, the "34 columns
variants" figure is overstated by 6. Detection of `tabs` may have a similar issue (also
toggle-driven) and is worth a spot-check.

- The headline "**unknown variants**" should be read as "**unrecognized region
  signatures**", the large majority of which are **default content** (no block) or
  **repeating items of existing blocks** (cards/columns).
- It does **not** add ~95 new blocks. It does **not** meaningfully change the
  "~7 new block types" conclusion (quote, carousel, tabs, accordion, video, embed, search).
- Recommendation: treat the "unknown" bucket as an **authoring/default-content signal**,
  not a block-build signal. When building importers, most of these map to default
  content sections; the repeating grids map to `cards`.

## Caveats

- Screenshots are the cached analysis captures (English, desktop 1440px width).
- On very tall pages (e.g. use-case-page at 58,343px), only the first 40 boxes were
  drawn to keep the annotation legible; the pattern is consistent throughout.
- `manifest.json` in this folder lists every drawn box with its description and bounds.
