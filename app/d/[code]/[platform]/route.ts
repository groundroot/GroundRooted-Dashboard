// 다운로드 버튼: GET /d/<코드>/mac|windows → 10분 서명 링크로 302 (products/videokit-link.ts).
// 없거나 만료된 링크는 페이지(/d/<코드>, "링크가 만료되었습니다")로 303.
import { db } from '@/products/videokit-license';
import { clientIp, handleDownload, supabaseLinkDeps } from '@/products/videokit-link';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ code: string; platform: string }> }) {
  const { code, platform } = await params;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[videokit] download link is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    return new Response('잠시 후 다시 시도해 주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  return handleDownload(code, platform, supabaseLinkDeps(db()), clientIp(req.headers));
}
