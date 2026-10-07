import type { Metadata } from 'next';
import './globals.css';
import '@/components/storefront/public-foundation.css';
import '@/components/storefront/editorial.css';

export const metadata: Metadata = {
  title: 'GroundRooted | 나의 작업을 넓히는 앱',
  description: 'ReadyMD, YouTube to MD, TypeCut Pro. GroundRooted의 앱을 만나보세요.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
