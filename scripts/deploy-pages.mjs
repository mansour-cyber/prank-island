/* ============================================================
   Build the production bundle and publish it to the repo ROOT
   (index.html + assets/) so GitHub Pages can serve it directly
   from the main branch (Pages source: "Deploy from a branch /").
   ============================================================ */
import { execSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

console.log('▶ Building production bundle...');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

console.log('▶ Publishing to repo root...');
// fresh assets dir at root
rmSync(join(root, 'assets'), { recursive: true, force: true });
mkdirSync(join(root, 'assets'), { recursive: true });
cpSync(join(dist, 'assets'), join(root, 'assets'), { recursive: true });

// built html -> repo root (dev*.html become their published names)
const devHtml = existsSync(join(dist, 'dev.html')) ? join(dist, 'dev.html') : join(dist, 'index.html');
copyFileSync(devHtml, join(root, 'index.html'));
if (existsSync(join(dist, 'dev3d.html'))) copyFileSync(join(dist, 'dev3d.html'), join(root, '3d.html'));

// disable Jekyll processing on Pages
writeFileSync(join(root, '.nojekyll'), '');

console.log('✓ Published. Root index.html + assets/ are ready for GitHub Pages.');
