import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Who Knows Me Best',
    short_name: 'Who Knows Me',
    description: 'Le quiz entre potes — qui te connaît vraiment ?',
    start_url: '/',
    display: 'standalone',
    background_color: '#06060f',
    theme_color: '#8b5cf6',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
