const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
try {
  require.resolve('next/dist/bin/next', { paths: [root] });
  require.resolve('next/package.json', { paths: [root] });
  const launcher = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');
  if (!fs.existsSync(launcher)) throw new Error('Missing local Next.js command launcher.');
} catch {
  console.error('Dependencies are missing or incomplete. Run npm install and wait for it to finish before running npm run dev. See the Windows installation recovery section in README.md if npm reports ENOTEMPTY.');
  process.exit(1);
}
