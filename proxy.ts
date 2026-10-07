import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";
import { editorialPublicPaths, paperMotionPath } from "@/products/editorial-media";

// 대시보드 전체를 비밀번호 하나로 잠근다. 매출·프로젝트 현황이 공개 URL에 노출되면 안 되므로
// DASHBOARD_PASSWORD가 없으면 열어두지 않고 막는다(로컬 개발만 예외).
const PASSWORD = process.env.DASHBOARD_PASSWORD;

export async function proxy(req: NextRequest) {
  if ([...editorialPublicPaths, paperMotionPath, "/favicon.svg", "/licenses/Inter-OFL.txt", "/licenses/Pretendard-OFL.txt", "/media/pdf-explainer/figure-01.svg", "/media/pdf-explainer/photo-01.svg", "/media/pdf-explainer/form-01.svg", "/media/readymd/reading-map.svg"].includes(req.nextUrl.pathname)) return NextResponse.next();
  // Data-free storefront routes only. Private HQ remains behind the password gate.
  if (["/", "/pdf-to-md", "/youtube-to-md", "/typecut-pro"].includes(req.nextUrl.pathname) &&
      (process.env.NODE_ENV === "development" || process.env.MARKETING_PREVIEW_ENABLED === "true")) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  if (!PASSWORD) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("DASHBOARD_PASSWORD 환경변수가 설정되지 않았습니다.", { status: 500 });
  }

  if (req.cookies.get(AUTH_COOKIE)?.value === (await authToken(PASSWORD))) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

// 로그인 페이지 자신과, 외부에서 호출되는 Stripe 웹훅은 반드시 제외한다.
export const config = {
  matcher: ["/((?!login|api/webhooks|_next/static|_next/image|favicon.ico).*)"],
};
