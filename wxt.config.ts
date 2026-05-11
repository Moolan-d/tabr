import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Tabr - Beautiful New Tab',
    version: '1.0.3',
    description: 'Replace your new tab with stunning high-resolution photos, featuring image sources from Unsplash and Pixabay.',
    permissions: ['storage'],
    host_permissions: [
      'https://api.unsplash.com/*',
      'https://pixabay.com/*',
    ],
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
});
