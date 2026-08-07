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
