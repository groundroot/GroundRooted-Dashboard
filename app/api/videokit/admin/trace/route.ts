// 유출본 검출 (약속: FCP 키트 저장소 docs/update_server_contract_v3.md §2.4). 판매자 scripts/leak_trace.py --server가 부른다.
// POST /api/videokit/admin/trace, 헤더 Authorization: Bearer <VIDEOKIT_ADMIN_TOKEN>. 구매자 키로는 401.
// 필요한 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VIDEOKIT_MARK_SECRET, VIDEOKIT_ADMIN_TOKEN
import { handleTrace, supabaseTraceDeps } from '@/products/videokit-content';

export const dynamic = 'force-dynamic';
// 모든 키 × 관찰 자리만큼 HMAC을 계산한다(키 1천 · 자리 400이면 수 초).
export const maxDuration = 60;

export async function POST(req: Request) {
  const token = process.env.VIDEOKIT_ADMIN_TOKEN ?? '', secret = process.env.VIDEOKIT_MARK_SECRET ?? '';
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !secret) {
    console.error('[videokit] trace is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / VIDEOKIT_MARK_SECRET)');
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return handleTrace(req, supabaseTraceDeps({ token, secret }));
}
