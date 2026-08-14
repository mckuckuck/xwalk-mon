import { loadCSS, loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const CODEMIRROR_BASE = `${window.hlx.codeBasePath}/scripts/__libs__/codemirror`;
const CODEMIRROR_CSS = `${CODEMIRROR_BASE}/lib/codemirror.css`;
const CODEMIRROR_JS = `${CODEMIRROR_BASE}/lib/codemirror.js`;
const CODEMIRROR_ADDON_SCROLL = `${CODEMIRROR_BASE}/addon/scroll/simplescrollbars.js`;
const CODEMIRROR_ADDON_SCROLL_CSS = `${CODEMIRROR_BASE}/addon/scroll/simplescrollbars.css`;

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

let codeMirrorBootPromise;
const loadedModeScripts = new Set();

function normalizeLanguage(language) {
  return (language || '').trim().toLowerCase();
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
    codeMirrorBootPromise = Promise.all([
      loadCSS(CODEMIRROR_CSS),
      loadCSS(CODEMIRROR_ADDON_SCROLL_CSS),
      loadScript(CODEMIRROR_JS),
      loadScript(CODEMIRROR_ADDON_SCROLL),
    ]);
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
  // Each model field is rendered as its own row, in field order: title, language, code.
  const [titleRow, languageRow, codeRow] = [...block.children];

  const title = (titleRow?.textContent || '').trim();
  const language = normalizeLanguage(languageRow?.textContent || 'text');
  const code = extractCode(codeRow);

  if (!code) {
    block.textContent = '';
    return;
  }

  const surface = document.createElement('div');
  surface.className = 'code-panel-surface';
  if (codeRow) moveInstrumentation(codeRow, surface);

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
  CodeMirror(surface, {
    value: code,
    mode: mode || null,
    readOnly: 'nocursor',
    lineNumbers: true,
    theme: 'default',
    lineWrapping: true,
    scrollbarStyle: 'simple',
    viewportMargin: Infinity,
  });
}
