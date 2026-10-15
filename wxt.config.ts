import { readFileSync } from 'node:fs';
import { defineConfig } from 'wxt';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string };
const extensionVersion = process.env.EXTENSION_VERSION ?? pkg.version;

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Tabr - Beautiful New Tab',
    version: extensionVersion,
    version_name: extensionVersion,
    description: 'High-resolution Unsplash photos on every new tab, with a favorites gallery, carousel, and clean mode.',
    permissions: ['storage'],
    host_permissions: [
      'https://api.unsplash.com/*',
    ],
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
});
