import type { Metadata } from 'next';
import './globals.css';
import '@/components/storefront/public-foundation.css';
import '@/components/storefront/editorial.css';

export const metadata: Metadata = {
  title: 'GroundRooted | 나의 작업을 넓히는 앱',
  description: 'ReadyMD, YouTube to MD, TypeCut Pro. GroundRooted의 앱을 만나보세요.',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
