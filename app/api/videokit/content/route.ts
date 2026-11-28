// 키트 1.4.2의 판매자 콘텐츠 받기 (약속: FCP 키트 저장소 docs/update_server_contract_v3.md §2.1).
// GET /api/videokit/content?platform=mac|windows&kit=<버전>&have=<묶음:버전,…>, 헤더 Authorization: Bearer <구매자 키>, X-VK-Device: <64자 hex>
// 필요한 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VIDEOKIT_MARK_SECRET, VIDEOKIT_CONTENT_SECRET (서로 다른 값)
// 선택: VIDEOKIT_LEASE_DAYS(21), VIDEOKIT_RENEW_DAYS(7), VIDEOKIT_BUCKET(videokit), VIDEOKIT_DEVICE_ENFORCE
import { contentSecrets, handleContent, supabaseContentDeps } from '@/products/videokit-content';

export const dynamic = 'force-dynamic';
// 처음 요청 때 개인 사본을 만든다(묶음 zip 약 100KB). 보통 1초 안.
export const maxDuration = 60;

export async function GET(req: Request) {
  const secrets = contentSecrets();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !secrets) {
    console.error('[videokit] content server is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / VIDEOKIT_MARK_SECRET / VIDEOKIT_CONTENT_SECRET)');
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return handleContent(req, supabaseContentDeps(secrets));
}
