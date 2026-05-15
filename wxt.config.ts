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
    description: 'Replace your new tab with stunning high-resolution photos, featuring image sources from Unsplash and Pixabay.',
    permissions: ['storage', 'identity'],
    host_permissions: [
      'https://api.unsplash.com/*',
      'https://pixabay.com/*',
      'https://www.googleapis.com/*',
    ],
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
});
