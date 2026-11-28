// 키트 1.4.1의 기기 등록 (약속: FCP 키트 저장소 docs/update_server_contract_v2.md 2.1절).
// POST /api/videokit/devices/register, 헤더 Authorization: Bearer <구매자 키>, 본문 {"device":"<64자 hex>","platform":"mac|windows","label":"…","kit_version":"1.4.1"}
// 필요한 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (선택: VIDEOKIT_DEVICE_ENFORCE — 켜면 허용 대수를 넘는 등록을 403 device_limit으로 막음, 기본은 기록만)
import { db } from '@/products/videokit-license';
import { handleRegister, supabaseRegisterDeps } from '@/products/videokit-devices';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[videokit] device register is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return handleRegister(req, supabaseRegisterDeps(db()));
}
