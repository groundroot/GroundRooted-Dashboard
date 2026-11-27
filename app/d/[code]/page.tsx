// 키트 다운로드 페이지 https://groundrooted.com/d/<코드> (products/videokit-link.ts).
// 열람은 세지 않는다(메일 보안 검사기가 미리 열 수 있음). 횟수는 버튼(POST /d/<코드>/mac|windows 폼)에서만 센다.
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Shell, { KAKAO_URL } from '../../price/Shell';
import { db } from '@/products/videokit-license';
import { clientIp, kstDay, loadLink, supabaseLinkDeps, type LinkView } from '@/products/videokit-link';

export const dynamic = 'force-dynamic';
export const metadata = { title: '키트 내려받기 | 클로드 비디오 키트', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };

export default async function DownloadPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const configured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  // 설정이 없어도 형식이 틀린 코드는 '만료' 페이지로(loadLink는 형식이 틀리면 DB에 가지 않는다).
  const view: LinkView = await loadLink(code, configured ? supabaseLinkDeps(db()) : unconfigured, clientIp(await headers()));
  if (view.status === 'gone') notFound();
  if (view.status === 'limited') return <Shell>
    <h1>요청이 너무 많습니다</h1>
    <p className="lede">잠시 동안 이 다운로드 페이지를 열 수 없습니다. 10분 뒤에 다시 열어 주세요. 계속 열리지 않으면 키트를 받은 메일에 답장하거나 카카오톡으로 알려 주세요.</p>
    <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
  </Shell>;
  if (view.status === 'unavailable') return <Shell>
    <h1>잠시 후 다시 열어 주세요</h1>
    <p className="lede">지금 다운로드 정보를 불러오지 못했습니다. 링크는 그대로 유효합니다. 몇 분 뒤에도 같으면 메일에 답장하거나 카카오톡으로 알려 주세요.</p>
    <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
  </Shell>;
  return <Shell>
    <h1>클로드 비디오 키트 내려받기</h1>
    <p className="lede">{view.name && <>{view.name} 님께 보내드린 링크입니다 · </>}버전 {view.version}<br />본인 구매용 링크입니다. 다른 분과 공유하지 말아 주세요.</p>
    <div className="dl">
      <form method="post" action={`/d/${view.code}/mac`}><button type="submit">맥용 내려받기<small>macOS · Apple Silicon</small></button></form>
      <form method="post" action={`/d/${view.code}/windows`}><button type="submit">윈도우용 내려받기<small>Windows 10 · 11 (64비트)</small></button></form>
    </div>
    <section className="dl-copyright" aria-labelledby="dl-copyright-title">
      <h2 id="dl-copyright-title">저작권 안내</h2>
      <p>클로드 비디오 키트(설명서·스크립트·스킬·프리셋 포함)는 그라운드루티드의 저작물로 저작권법의 보호를 받습니다. 구매하신 분 본인의 영상 제작에만 쓸 수 있으며, 파일이나 이 링크를 다른 사람에게 공유·복제·재배포·재판매하는 것은 금지됩니다. 내려받는 파일에는 구매하신 분의 주문번호가 들어 있어, 파일이 유출되면 누가 배포했는지 확인할 수 있습니다. 위반하면 저작권법에 따라 민사·형사상 책임을 질 수 있습니다. 자세한 내용은 <a href="/videokit/terms#use-scope">이용약관</a>을 확인해 주세요.</p>
    </section>
    <p className="small dl-note">쓰시는 컴퓨터에 맞는 파일 하나를 받으면 됩니다.</p>
    <p className="dl-expire">이 링크는 <b>{kstDay(view.expiresAt)}</b>에 삭제됩니다.</p>
    <p>설치는 압축을 풀고, 맨 위의 「0. Claude Video Kit Manual」 설명서부터 보세요.</p>
    <p className="small">궁금한 점은 키트를 받은 메일에 답장하거나 카카오톡으로 알려 주세요.</p>
    <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
  </Shell>;
}

// Supabase 설정이 없을 때(로컬 미리보기): 형식이 맞는 코드는 '잠시 후 다시'로 보인다.
const unconfigured = {
  find: async () => { throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured'); },
  remove: async () => {}, hit: async () => {}, readCurrent: async () => null, sign: async () => null,
  readKit: async () => { throw new Error('not configured'); }, putPersonal: async () => {},
};
