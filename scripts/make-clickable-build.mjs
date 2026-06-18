import { readFileSync, writeFileSync } from 'node:fs';

const indexPath = new URL('../dist/index.html', import.meta.url);
const html = readFileSync(indexPath, 'utf8');

const clickableHtml = html.replace(
  /<script type="module" crossorigin src="(\.\/assets\/[^"]+\.js)"><\/script>/,
  '<script defer src="$1"></script>',
);

if (clickableHtml === html) {
  throw new Error('Could not find the Vite script tag in dist/index.html.');
}

writeFileSync(indexPath, clickableHtml);
