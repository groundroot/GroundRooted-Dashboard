import { NextResponse, type NextRequest } from "next/server";

// 대시보드 전체를 비밀번호 하나로 잠근다. 매출·프로젝트 현황이 공개 URL에 노출되면 안 되므로
// DASHBOARD_PASSWORD가 없으면 열어두지 않고 막는다(로컬 개발만 예외).
const PASSWORD = process.env.DASHBOARD_PASSWORD;

export function middleware(req: NextRequest) {
  if (!PASSWORD) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("DASHBOARD_PASSWORD 환경변수가 설정되지 않았습니다.", { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [, pw] = atob(auth.slice(6)).split(":");
    if (pw === PASSWORD) return NextResponse.next();
  }

  return new NextResponse("인증이 필요합니다.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="GroundRooted HQ"' },
  });
}

// Stripe 웹훅은 외부에서 호출하므로 반드시 제외한다.
export const config = {
  matcher: ["/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)"],
};
