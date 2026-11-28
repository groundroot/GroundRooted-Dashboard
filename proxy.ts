import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";
import { editorialPublicPaths, paperMotionPath } from "@/products/editorial-media";

// 대시보드 전체를 비밀번호 하나로 잠근다. 매출·프로젝트 현황이 공개 URL에 노출되면 안 되므로
// DASHBOARD_PASSWORD가 없으면 열어두지 않고 막는다(로컬 개발만 예외).
const PASSWORD = process.env.DASHBOARD_PASSWORD;

// 로그인으로 보내는 곳은 대시보드 경로뿐이다(관리자 · API, 미리보기를 끈 앱 소개). 그 밖의 없는 · 비공개 주소는 404.
const isDashboard = (path: string) =>
  path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/") || ["/", "/pdf-to-md", "/youtube-to-md", "/typecut-pro"].includes(path);

// 없는 경로로 바꿔 써서 Next의 404 페이지(app/not-found.tsx)를 보여 준다. 실제 파일 · 페이지는 로그인 없이 내주지 않는다.
function notFound(req: NextRequest) {
  const response = NextResponse.rewrite(new URL("/__not-found", req.url));
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function proxy(req: NextRequest) {
  if ([...editorialPublicPaths, paperMotionPath, "/icon-32.png", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/licenses/Inter-OFL.txt", "/licenses/Pretendard-OFL.txt", "/media/pdf-explainer/figure-01.svg", "/media/pdf-explainer/photo-01.svg", "/media/pdf-explainer/form-01.svg", "/media/readymd/reading-map.svg", "/videokit", "/videokit/index.html", "/videokit/diagram.html", "/videokit/terms", "/videokit/terms.html", "/videokit/privacy", "/videokit/privacy.html", "/videokit/logos/final-cut-pro.png", "/videokit/logos/final-cut-pro-subscription.png", "/videokit/logos/capcut.svg", "/videokit/logos/premiere-pro.svg", "/videokit/logos/davinci-resolve.svg", "/videokit/logos/filmcraft.png", "/videokit/logos/claude.svg", "/videokit/product.png", "/videokit/plan-kit.png", "/videokit/plan-lesson.png", "/videokit/plan-pass.png", "/videokit/reference/used-car-budget-v1.jpg", "/videokit/reference/game-first-app-v1.jpg", "/videokit/reference/used-car-no-accident-v1.jpg", "/price", "/price/success", "/price/fail", "/api/videokit/apply", "/api/videokit/coupon", "/api/videokit/device/check"].includes(req.nextUrl.pathname)) return NextResponse.next();
  if (["/videokit/demo", "/videokit/demo.css", "/videokit/demo.js"].includes(req.nextUrl.pathname)) return NextResponse.next();
  // 키트의 /videokit update (구매자 키로 확인, products/videokit-license.ts)
  if (req.nextUrl.pathname === "/api/videokit/latest") return NextResponse.next();
  // 키트 1.4.1의 기기 등록 (구매자 키로 확인, products/videokit-devices.ts)
  if (req.nextUrl.pathname === "/api/videokit/devices/register") return NextResponse.next();
  // 키트 짧은 다운로드 링크 /d/<코드>, /d/<코드>/mac|windows (products/videokit-link.ts)
  if (/^\/d\/[^/]{1,16}(\/(mac|windows))?$/.test(req.nextUrl.pathname)) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  // 공개 블로그(/blog, /blog/글, /blog/rss.xml, public/blog/ 이미지)와 검색엔진용 sitemap · robots. "/blogx" 같은 주소는 열지 않는다.
  if (req.nextUrl.pathname === "/blog" || req.nextUrl.pathname.startsWith("/blog/") || ["/sitemap.xml", "/robots.txt"].includes(req.nextUrl.pathname)) return NextResponse.next();
  // Data-free storefront routes only. Private HQ remains behind the password gate.
  if (["/", "/pdf-to-md", "/youtube-to-md", "/typecut-pro"].includes(req.nextUrl.pathname) &&
      (process.env.NODE_ENV === "development" || process.env.MARKETING_PREVIEW_ENABLED === "true")) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  if (!PASSWORD) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    if (!isDashboard(req.nextUrl.pathname)) return notFound(req);
    return new NextResponse("DASHBOARD_PASSWORD 환경변수가 설정되지 않았습니다.", { status: 500 });
  }

  if (req.cookies.get(AUTH_COOKIE)?.value === (await authToken(PASSWORD))) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (!isDashboard(req.nextUrl.pathname)) return notFound(req);

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

// 로그인 페이지 자신과, 외부에서 호출되는 Stripe 웹훅은 반드시 제외한다.
export const config = {
  matcher: ["/((?!login|api/webhooks|_next/static|_next/image|favicon.ico).*)"],
};
