const fs = require('fs');
const path = require('path');

const root = process.cwd();
const filesToCopy = [
  ['node_modules/codemirror/lib/codemirror.js', 'scripts/vendor/codemirror/lib/codemirror.js'],
  ['node_modules/codemirror/lib/codemirror.css', 'scripts/vendor/codemirror/lib/codemirror.css'],
  [
    'node_modules/codemirror/addon/scroll/simplescrollbars.js',
    'scripts/vendor/codemirror/addon/scroll/simplescrollbars.js',
  ],
  [
    'node_modules/codemirror/addon/scroll/simplescrollbars.css',
    'scripts/vendor/codemirror/addon/scroll/simplescrollbars.css',
  ],
  [
    'node_modules/codemirror/mode/clike/clike.js',
    'scripts/vendor/codemirror/mode/clike/clike.js',
  ],
  [
    'node_modules/codemirror/mode/javascript/javascript.js',
    'scripts/vendor/codemirror/mode/javascript/javascript.js',
  ],
  [
    'node_modules/codemirror/mode/python/python.js',
    'scripts/vendor/codemirror/mode/python/python.js',
  ],
  [
    'node_modules/codemirror/mode/shell/shell.js',
    'scripts/vendor/codemirror/mode/shell/shell.js',
  ],
  ['node_modules/codemirror/mode/xml/xml.js', 'scripts/vendor/codemirror/mode/xml/xml.js'],
  ['node_modules/codemirror/mode/yaml/yaml.js', 'scripts/vendor/codemirror/mode/yaml/yaml.js'],
  [
    'node_modules/codemirror/mode/htmlmixed/htmlmixed.js',
    'scripts/vendor/codemirror/mode/htmlmixed/htmlmixed.js',
  ],
];

filesToCopy.forEach(([source, destination]) => {
  const srcPath = path.join(root, source);
  const destPath = path.join(root, destination);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
});
