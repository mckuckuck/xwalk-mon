import { loadCSS, loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const CODEMIRROR_BASE = `${window.hlx.codeBasePath}/scripts/vendor/codemirror`;
const CODEMIRROR_CSS = `${CODEMIRROR_BASE}/lib/codemirror.css`;
const CODEMIRROR_JS = `${CODEMIRROR_BASE}/lib/codemirror.js`;
const CODEMIRROR_ADDON_SCROLL = `${CODEMIRROR_BASE}/addon/scroll/simplescrollbars.js`;
const CODEMIRROR_ADDON_SCROLL_CSS = `${CODEMIRROR_BASE}/addon/scroll/simplescrollbars.css`;

const MIN_SURFACE_HEIGHT = 128; // 8rem
const MAX_SURFACE_HEIGHT = 448; // 28rem

const MODES = {
  c: {
    script: `${CODEMIRROR_BASE}/mode/clike/clike.js`,
    mode: 'text/x-csrc',
  },
  cpp: {
    script: `${CODEMIRROR_BASE}/mode/clike/clike.js`,
    mode: 'text/x-c++src',
  },
  java: {
    script: `${CODEMIRROR_BASE}/mode/clike/clike.js`,
    mode: 'text/x-java',
  },
  javascript: {
    script: `${CODEMIRROR_BASE}/mode/javascript/javascript.js`,
    mode: 'javascript',
  },
  typescript: {
    script: `${CODEMIRROR_BASE}/mode/javascript/javascript.js`,
    mode: { name: 'javascript', typescript: true },
  },
  json: {
    script: `${CODEMIRROR_BASE}/mode/javascript/javascript.js`,
    mode: { name: 'javascript', json: true },
  },
  python: {
    script: `${CODEMIRROR_BASE}/mode/python/python.js`,
    mode: 'python',
  },
  shell: {
    script: `${CODEMIRROR_BASE}/mode/shell/shell.js`,
    mode: 'shell',
  },
  bash: {
    script: `${CODEMIRROR_BASE}/mode/shell/shell.js`,
    mode: 'shell',
  },
  html: {
    script: `${CODEMIRROR_BASE}/mode/htmlmixed/htmlmixed.js`,
    mode: 'htmlmixed',
  },
  xml: {
    script: `${CODEMIRROR_BASE}/mode/xml/xml.js`,
    mode: 'xml',
  },
  yaml: {
    script: `${CODEMIRROR_BASE}/mode/yaml/yaml.js`,
    mode: 'yaml',
  },
};

const THEMES = {
  default: 'default',
  brand: 'mongodb-brand',
};

const COPY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="9" y="9" width="12" height="12" rx="2"></rect>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`;

const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M20 6 9 17l-5-5"></path>
</svg>`;

let codeMirrorBootPromise;
const loadedModeScripts = new Set();

function normalizeLanguage(language) {
  return (language || '').trim().toLowerCase();
}

function normalizeTheme(theme) {
  return THEMES[(theme || '').trim().toLowerCase()] || THEMES.default;
}

/**
 * Builds a button that copies the raw code to the clipboard.
 * @param {string} code
 */
function buildCopyButton(code) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code-panel-copy';
  button.setAttribute('aria-label', 'Copy code');
  button.innerHTML = COPY_ICON;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    button.innerHTML = CHECK_ICON;
    button.setAttribute('aria-label', 'Copied');
    setTimeout(() => {
      button.innerHTML = COPY_ICON;
      button.setAttribute('aria-label', 'Copy code');
    }, 1500);
  });
  return button;
}

/**
 * Authors format code by applying the richtext "Code" style to a paragraph,
 * which the RTE serializes as a single <pre> holding real newline characters.
 * Falls back to treating each child element as one line for authors who
 * didn't apply that format.
 * @param {Element} codeRow the row containing the authored code field
 */
function extractCode(codeRow) {
  if (!codeRow) return '';
  const pre = codeRow.querySelector('pre');
  if (pre) return pre.textContent.replace(/\r\n/g, '\n').trim();
  const cell = codeRow.firstElementChild || codeRow;
  const lines = [...cell.children].filter((el) => el.textContent.trim());
  const code = lines.length ? lines.map((el) => el.textContent).join('\n') : cell.textContent;
  return code.replace(/\r\n/g, '\n').trim();
}

async function loadCodeMirror() {
  if (!codeMirrorBootPromise) {
    // The scroll addon registers itself against the global CodeMirror object,
    // so it must not execute until the core script has finished loading.
    // Dynamically created <script> tags run in load order, not append order,
    // so these two scripts cannot be requested via a single Promise.all.
    codeMirrorBootPromise = Promise.all([
      loadCSS(CODEMIRROR_CSS),
      loadCSS(CODEMIRROR_ADDON_SCROLL_CSS),
    ]).then(() => loadScript(CODEMIRROR_JS))
      .then(() => loadScript(CODEMIRROR_ADDON_SCROLL));
  }
  return codeMirrorBootPromise;
}

async function loadMode(language) {
  const def = MODES[language];
  if (!def || loadedModeScripts.has(def.script)) {
    return def?.mode || null;
  }
  await loadScript(def.script);
  loadedModeScripts.add(def.script);
  return def.mode;
}

export default async function decorate(block) {
  // Each model field is rendered as its own row, in field order:
  // title, language, theme, code.
  const [titleRow, languageRow, themeRow, codeRow] = [...block.children];

  const title = (titleRow?.textContent || '').trim();
  const language = normalizeLanguage(languageRow?.textContent || 'text');
  const theme = normalizeTheme(themeRow?.textContent);
  const code = extractCode(codeRow);

  if (!code) {
    block.textContent = '';
    return;
  }

  block.classList.toggle('code-panel-theme-brand', theme === THEMES.brand);

  const surface = document.createElement('div');
  surface.className = 'code-panel-surface';
  if (codeRow) moveInstrumentation(codeRow, surface);
  surface.append(buildCopyButton(code));

  const children = [];
  if (title) {
    const heading = document.createElement('div');
    heading.className = 'code-panel-title';
    heading.textContent = title;
    if (titleRow) moveInstrumentation(titleRow, heading);
    children.push(heading);
  }
  children.push(surface);
  block.replaceChildren(...children);

  await loadCodeMirror();
  const mode = await loadMode(language);

  // eslint-disable-next-line no-undef
  const cm = CodeMirror(surface, {
    value: code,
    mode: mode || null,
    readOnly: 'nocursor',
    lineNumbers: true,
    theme,
    lineWrapping: true,
    scrollbarStyle: 'simple',
    viewportMargin: Infinity,
  });

  // Blocks are decorated while their section is still `display: none`
  // (see loadSection in scripts/aem.js), so CodeMirror mounts with no
  // measurable size and renders no lines. Refresh once it actually has one,
  // then size the wrapper to the real content height (clamped between
  // MIN/MAX_SURFACE_HEIGHT) so it doesn't fall back to filling the page.
  const resizeObserver = new ResizeObserver(() => {
    if (surface.offsetWidth) {
      cm.refresh();
      // The sizer reflects the real line content height; getScrollInfo()
      // instead reports max(content, current wrapper size), which is
      // useless for shrinking a wrapper that starts out oversized.
      const sizer = cm.getWrapperElement().querySelector('.CodeMirror-sizer');
      const contentHeight = sizer.offsetHeight;
      const height = Math.min(Math.max(contentHeight, MIN_SURFACE_HEIGHT), MAX_SURFACE_HEIGHT);
      cm.getWrapperElement().style.height = `${height}px`;
      cm.refresh();
      resizeObserver.disconnect();
    }
  });
  resizeObserver.observe(surface);
}
