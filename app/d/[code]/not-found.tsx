// 없거나 만료된(또는 막힌) 다운로드 링크. 상태 코드 404.
import Shell, { KAKAO_URL } from '../../price/Shell';

export default function LinkGone() {
  return <Shell>
    <h1>링크가 만료되었습니다</h1>
    <p className="lede">다시 받으시려면 키트를 받은 메일에 답장하거나 카카오톡으로 알려 주세요. 새 링크를 보내드리겠습니다.</p>
    <a className="btn btn-kakao" href={KAKAO_URL} target="_blank" rel="noopener">카카오톡 1:1 문의</a>
  </Shell>;
}
