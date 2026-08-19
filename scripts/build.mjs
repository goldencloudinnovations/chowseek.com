import { cp, copyFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'assets'), { recursive: true });

for (const file of ['index.html']) {
  await copyFile(resolve(root, file), resolve(dist, file));
}
for (const dir of ['app', 'privacy', 'terms', 'cookie', 'account-deletion', 'public']) {
  const source = resolve(root, dir);
  if (!existsSync(source)) continue;
  if (dir === 'public') {
    await cp(source, dist, { recursive: true });
  } else {
    await cp(source, resolve(dist, dir), { recursive: true });
  }
}

await copyFile(resolve(root, 'src/styles.css'), resolve(dist, 'assets/styles.css'));

// npm scripts place node_modules/.bin on PATH. A globally installed tsc also works.
execFileSync('tsc', ['-p', resolve(root, 'tsconfig.json')], {
  cwd: root,
  stdio: 'inherit',
});

console.log('Built Chowseek site → dist/');
