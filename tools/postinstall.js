const fs = require('fs');
const path = require('path');

const root = process.cwd();
const filesToCopy = [
  ['node_modules/codemirror/lib/codemirror.js', 'scripts/__libs__/codemirror/lib/codemirror.js'],
  ['node_modules/codemirror/lib/codemirror.css', 'scripts/__libs__/codemirror/lib/codemirror.css'],
  [
    'node_modules/codemirror/addon/scroll/simplescrollbars.js',
    'scripts/__libs__/codemirror/addon/scroll/simplescrollbars.js',
  ],
  [
    'node_modules/codemirror/addon/scroll/simplescrollbars.css',
    'scripts/__libs__/codemirror/addon/scroll/simplescrollbars.css',
  ],
  [
    'node_modules/codemirror/mode/clike/clike.js',
    'scripts/__libs__/codemirror/mode/clike/clike.js',
  ],
  [
    'node_modules/codemirror/mode/javascript/javascript.js',
    'scripts/__libs__/codemirror/mode/javascript/javascript.js',
  ],
  [
    'node_modules/codemirror/mode/python/python.js',
    'scripts/__libs__/codemirror/mode/python/python.js',
  ],
  [
    'node_modules/codemirror/mode/shell/shell.js',
    'scripts/__libs__/codemirror/mode/shell/shell.js',
  ],
  ['node_modules/codemirror/mode/xml/xml.js', 'scripts/__libs__/codemirror/mode/xml/xml.js'],
  ['node_modules/codemirror/mode/yaml/yaml.js', 'scripts/__libs__/codemirror/mode/yaml/yaml.js'],
  [
    'node_modules/codemirror/mode/htmlmixed/htmlmixed.js',
    'scripts/__libs__/codemirror/mode/htmlmixed/htmlmixed.js',
  ],
];

filesToCopy.forEach(([source, destination]) => {
  const srcPath = path.join(root, source);
  const destPath = path.join(root, destination);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
});
