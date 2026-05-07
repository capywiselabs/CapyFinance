import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '悠學豚 CapyFinance',
    short_name: 'CapyFinance',
    description: 'A gamified financial-literacy PWA for HK primary students',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF6E5',
    theme_color: '#F4B860',
    orientation: 'portrait',
    lang: 'zh-HK',
    categories: ['education', 'finance'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'Snap receipt', short_name: 'Snap', url: '/expenses?action=snap' },
      { name: 'Tasks', short_name: 'Tasks', url: '/tasks' },
      { name: 'Pet', short_name: 'Pet', url: '/pet' },
    ],
  };
}
