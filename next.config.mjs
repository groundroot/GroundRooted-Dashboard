/** @type {import('next').NextConfig} */
const nextConfig = {
  // 클로드 비디오 키트 for 파이널컷프로: 정적 페이지(public/videokit)를 /videokit 주소로 제공한다.
  async rewrites() {
    return [
      { source: '/videokit', destination: '/videokit/index.html' },
      { source: '/videokit/instructor', destination: '/videokit/instructor.html' },
      { source: '/videokit/terms', destination: '/videokit/terms.html' },
      { source: '/videokit/privacy', destination: '/videokit/privacy.html' },
    ];
  },
};
export default nextConfig;
