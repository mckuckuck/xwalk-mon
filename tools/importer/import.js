/**
 * Minimal import rules for mongodb.com/company page.
 * Used with aem-import-helper xwalk import when AEM_IMPORT_API_KEY is configured.
 */
export default {
  transformDOM: ({ document }) => {
    document.querySelectorAll('header, footer, nav').forEach((el) => el.remove());
  },
};
