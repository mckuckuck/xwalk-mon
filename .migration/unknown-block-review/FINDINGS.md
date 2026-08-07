# "Unknown" Block Variants — Verification Review

**Date:** 2026-08-07
**Purpose:** Validate whether the 100 "unknown" block variants reported in the site
scope represent new blocks to build, or something else. 10 pages across 10 distinct
template types were annotated (red boxes mark every region the analyzer classified as
"unknown"). Source screenshots are the cached full-page captures from the catalog;
boxes drawn from each block's stored `bounds`.

## Verdict

**The "unknown" count is NOT a count of new blocks. It is heavily inflated.**

The analyzer emits "unknown" whenever it can't confidently match a region to a known
EDS block signature. In practice, the flagged regions fall into three buckets — none
of which are new bespoke blocks:

1. **Default content** (the majority) — heading + paragraph + bullet-list text sections.
   These are authored directly as default content; no block at all.
2. **Repeating items counted individually** — grid/list items each flagged separately,
   when together they are ONE existing block (e.g. `cards`).
3. **Existing interactive components** — widgets the project already has a block for
   (e.g. `download-options`).

A few regions do hint at real blocks already on the new-block list (quote/author,
CTA banner, stats row) — but those are already accounted for under `quote`, `cards`,
and `columns`, not net-new.

## Per-page evidence

| # | Template | Unknown regions | What they actually are |
|---|----------|-----------------|------------------------|
| 01 | marketing-landing | 44 (office-locations page) | ~40 individual **office-location cards** in a 3-col grid → ONE `cards` block, not 40 |
| 02 | careers-page | 33 | Mix of text sections + repeating cards/benefit tiles → default content + `cards` |
| 03 | use-case-page | 164 (!) | Extreme inflation — long page, every text/media sub-section flagged → default content |
| 04 | research-group | 11 | Heading+paragraph research descriptions → default content |
| 05 | download-product | 23 | **download-option widgets** (version dropdown + Download button) → existing `download-options` block |
| 06 | customer-story | 10 | Text sections (default) + stats row (`columns`) + author photo (`quote`/author) + CTA banner |
| 07 | event-local-landing-alt | 14 | Event detail text + agenda/speaker items → default content + cards |
| 08 | partner-program-page | 21 | Long-form program text sections → default content |
| 09 | policy-text-page | 4 | "The fast track…", "Benefits", "What you get", "How it works" → pure **default content** |
| 10 | section-landing | 15 | Section hub intro + link/overview tiles → default content + cards |

## Implication for the block estimate

- The headline "**100 unknown variants**" should be read as "**100 unrecognized region
  signatures**", the large majority of which are **default content** (no block) or
  **repeating items of existing blocks** (cards/columns/download-options).
- It does **not** add ~100 new blocks. It does **not** meaningfully change the
  "~7 new block types" conclusion (quote, carousel, tabs, accordion, video, embed, search).
- Recommendation: treat the "unknown" bucket as an **authoring/default-content signal**,
  not a block-build signal. When building importers, most of these map to default
  content sections; the repeating grids map to `cards`.

## Caveats

- Screenshots are the cached analysis captures (English, desktop 1440px width).
- On very tall pages (e.g. use-case-page at 58,343px), only the first 40 boxes were
  drawn to keep the annotation legible; the pattern is consistent throughout.
- `manifest.json` in this folder lists every drawn box with its description and bounds.
