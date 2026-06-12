# Blocks Deferred (Post–Company Page)

The company page pilot required **hero**, **cards**, and **slalom** only. Port these remaining da-mon blocks when migrating additional pages.

| Block | da-mon path | Used on pages | UE config needed |
|-------|-------------|---------------|------------------|
| accordion | `blocks/accordion/` | contact, atlas-database, nosql-explained | `_accordion.json` |
| aside | `blocks/aside/` | blog article | `_aside.json` |
| codepanel | `blocks/codepanel/` | atlas-database, nosql-explained | `_codepanel.json` (tab items) |
| embed | `blocks/embed/` | nosql-explained | `_embed.json` |
| endcap | `blocks/endcap/` | atlas-database, nosql-explained | `_endcap.json` |
| form | `blocks/form/` | register | Already has `_form.json` in da-mon |
| logowall | `blocks/logowall/` | index | `_logowall.json` (marquee variant) |
| pathfinder | `blocks/pathfinder/` | index | `_pathfinder.json` |
| quotecase | `blocks/quotecase/` | index, atlas-database | `_quotecase.json` (tab items) |
| search | `blocks/search/` | (not in pilot) | `_search.json` |
| sidebar | `blocks/sidebar/` | blog, webinar, nosql-explained | `_sidebar.json` |
| table | `blocks/table/` | nosql-explained | `_table.json` |
| tabs | `blocks/tabs/` | index, contact | `_tabs.json` (tab items) |
| video | `blocks/video/` | webinar | `_video.json` |

## Per-block checklist

1. Copy `blocks/{name}/{name}.js` and `{name}.css` from da-mon
2. Create `blocks/{name}/_{name}.json` (definitions, models, filters)
3. Add block id to `models/_section.json` section filter
4. Run `npm run build:json` and `npm run lint`
5. Add block variants as `multiselect` `classes` where applicable

## Page → block map (pilot set)

| Page | Additional blocks beyond company page |
|------|-------------------------------------|
| `index.html` | quotecase, pathfinder, logowall, tabs |
| `atlas-database.html` | slalom, accordion, codepanel, quotecase, endcap |
| `nosql-explained.html` | codepanel, table, embed, accordion, sidebar, endcap |
| `blog article` | aside, sidebar |
| `register.html` | form |
| `contact.html` | tabs, accordion |
| `webinar` | video, sidebar, cards |
| `cloud.html` | slalom |
