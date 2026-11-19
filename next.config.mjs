/** @type {import('next').NextConfig} */
const nextConfig = {
  // 강성철 마스터 클래스: 정적 페이지(public/videokit)를 /videokit 주소로 제공한다.
  async rewrites() {
    return [{ source: '/videokit', destination: '/videokit/index.html' }];
  },
};
export default nextConfig;
