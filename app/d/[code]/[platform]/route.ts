// 다운로드 버튼: POST /d/<코드>/mac|windows (페이지의 폼) → 10분 서명 링크로 303 (products/videokit-link.ts).
// 없거나 만료된 링크는 페이지(/d/<코드>, "링크가 만료되었습니다")로 303.
// GET은 세지 않고 페이지로 돌려보낸다: 메일 보안 검사기 · 미리보기가 주소를 따라가도 다운로드 횟수가 줄지 않게.
import { db } from '@/products/videokit-license';
import { clientIp, downloadPage, handleDownload, supabaseLinkDeps } from '@/products/videokit-link';

export const dynamic = 'force-dynamic';
// 원본 zip(약 2.8MB)을 받아 표식을 넣고 다시 올린다. 보통 수 초.
export const maxDuration = 60;

export function GET(_req: Request, { params }: { params: Promise<{ code: string; platform: string }> }) {
  return params.then(({ code }) => downloadPage(code));
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string; platform: string }> }) {
  const { code, platform } = await params;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[videokit] download link is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    return new Response('잠시 후 다시 시도해 주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  return handleDownload(code, platform, supabaseLinkDeps(db()), clientIp(req.headers));
}
