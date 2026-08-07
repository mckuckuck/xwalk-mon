# Adjusted scope note — /try/download excluded

`summary.json` in this folder is the **raw** catalog output and still includes
`/try/download/*` pages (treated as special pages). The in-scope figures used by
`MIGRATION-ASSESSMENT.md` and the block gallery exclude them:

| Metric | Raw (`summary.json`) | Adjusted (excl. /try/download) |
|---|---|---|
| Pages in scope | 3,238 | 3,219 |
| Templates | 60 | 56 |
| Block variants | 331 | 323 |
| — EDS-mapped | 231 | 228 |
| — unknown | 100 | 95 |

**Removed:** 19 `/try/download` URLs · 4 download-only templates
(`download-releases`, `download-product`, `download-releases-alt`, `download-detail`)
· 8 block variants used only on download pages.

`/try` (the `try-landing` template) is NOT under `/try/download` and remains in scope.

`.pre-trydownload` files in this folder are pre-exclusion backups.
