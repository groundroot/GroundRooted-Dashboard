/** @type {import('next').NextConfig} */
// 모든 응답에 붙이는 보안 헤더.
// CSP는 결제(토스 위젯 · 결제창) · 글꼴 · 카카오 링크를 깨지 않는 항목만 정한다: 다른 사이트의 틀(iframe) 안에 뜨지 않기(같은 사이트 안은 허용: /videokit 이 구조도 diagram.html 을 iframe 으로 끼운다),
// 플러그인 금지, <base> 바꾸기 금지. 스크립트 출처 · 폼 전송 대상 제한은 결제 화면 검증 후 따로 넣는다.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), usb=(), interest-cohort=()' },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // 클로드 비디오 키트: 정적 페이지(public/videokit)를 /videokit 주소로 제공한다.
  async rewrites() {
    return [
      { source: '/videokit', destination: '/videokit/index.html' },
      { source: '/videokit/terms', destination: '/videokit/terms.html' },
      { source: '/videokit/privacy', destination: '/videokit/privacy.html' },
    ];
  },
  // 옛 계좌이체 안내 페이지는 결제 화면(키트)으로 영구 이동한다. 계좌이체도 결제 화면에서 주문한다.
  async redirects() {
    return [
      { source: '/videokit/transfer', destination: '/price?plan=kit', permanent: true },
      { source: '/videokit/transfer.html', destination: '/price?plan=kit', permanent: true },
    ];
  },
};
export default nextConfig;
