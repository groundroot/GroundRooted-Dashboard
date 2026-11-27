// 키트의 /videokit update가 부르는 최신 버전 확인 (약속: FCP 키트 저장소 docs/update_server_contract.md 2절).
// GET /api/videokit/latest?platform=mac|windows&current=<설치된 버전>, 헤더 Authorization: Bearer <구매자 키>
// 필요한 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (선택: VIDEOKIT_BUCKET, 기본 videokit)
import { handleLatest, supabaseLatestDeps } from '@/products/videokit-license';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[videokit] update server is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return handleLatest(req, supabaseLatestDeps());
}
