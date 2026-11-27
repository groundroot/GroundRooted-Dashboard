# 토스 API 키 접근 정책(허용 IP) 대응

2026-11-27 기준. 토스 상점관리자 공지: "등록된 IP에서만 API 호출 가능 · API 키(신모듈) 11/9 적용 · 막히면 `API_KEY_ACCESS_DENIED`".

## 1. 우리 서버가 토스를 부르는 곳

모두 `products/toss.ts`의 `tossRequest`를 거친다. 키는 `paymentSecret()`이 고른다. 운영에는 `TOSS_API_*`가 없으므로 **결제위젯 시크릿 키(`TOSS_SECRET_KEY`, live_gsk)**를 쓴다.

| 위치 | 호출 | 언제 |
|---|---|---|
| `app/price/success/page.tsx` | `POST /v1/payments/confirm` | 카드 · 간편결제 · 가상계좌 승인 |
| `app/price/success/page.tsx` | `GET /v1/payments/{paymentKey}` | 이미 승인된 결제 새로고침 |
| `app/api/webhooks/toss/route.ts` | `GET /v1/payments/orders/{orderId}` | 가상계좌 입금 알림(DEPOSIT_CALLBACK) 확인 |

계좌이체 신청(`/api/videokit/apply`)과 키트 메일은 토스를 부르지 않는다(Resend만).

## 2. 진단 (2026-11-27 10:45 KST)

도메인에 붙지 않는 임시 운영 배포(운영 환경변수 그대로)에서 없는 주문번호로 조회만 5번 했다. 진단 라우트와 배포는 바로 지웠다.

- 키 종류: live_gsk
- 응답: 5번 모두 `404 NOT_FOUND_MERCHANT`("존재하지 않는 상점 정보 입니다.") — **`API_KEY_ACCESS_DENIED` 아님.**
  - 공개 테스트 키로 같은 주문번호 조회를 해도 같은 코드가 나온다 → 이 엔드포인트의 '주문 없음' 응답이다. 키 인증은 통과했다(실패면 `UNAUTHORIZED_KEY`).
- Vercel 함수 리전: `iad1`(미국 동부). 토스가 본 출구 IP(ipify로 확인): `100.27.247.144`, `34.201.144.237` — 호출마다 바뀐다.
- 한계: 지금 막히지 않는 이유(정책이 아직 이 키에 없음 / 최근 사용 IP가 미리 등록됨 / 국가에 미국 포함)는 개발자센터 화면을 봐야 안다. IP 목록 방식이면 Vercel 출구 IP가 바뀌는 순간 승인이 막힐 수 있다.

## 3. 토스 정책에서 할 수 있는 것 (공식 문서)

출처: https://docs.tosspayments.com/reference/using-api/api-key-access-policy , https://docs.tosspayments.com/reference/error-codes

- 시크릿 키로 서버에서 부르는 API에 적용된다. 클라이언트 키 · 결제창 · 토스가 보내는 웹훅은 대상 아님.
- 허용 범위는 **IP 주소** 또는 **국가** 중 하나. IP는 쉼표로 여러 개, CIDR(`/24` 등) 가능. 국가는 최대 50개.
- 국가는 호출한 서버 공인 IP의 위치로 판단한다(문서 예: AWS 도쿄에서 부르면 일본 → 대한민국만 허용이면 403). 서버 IP가 자주 바뀌면 국가를 고르라고 안내한다.
- 테스트 · 라이브 환경을 따로 등록한다. 키 하나에 정책 하나.
- 막히면 `403 API_KEY_ACCESS_DENIED`. 메시지 끝에 `요청 IP: x.x.x.x`.
- 확인 못 한 것: 정책을 완전히 끌 수 있는지, IP 개수 상한, gsk 키가 대상이라는 명시 문장(문서는 '시크릿 키'라고만 씀).

## 4. 해결책 비교

| 방법 | 비용 | 작업 | 안정성 | 비고 |
|---|---|---|---|---|
| **A. 국가 정책 + Vercel 함수 리전 서울(icn1)** | 0원 | 오너: 개발자센터에서 국가 정책 등록 / 코드: `vercel.json` 리전 한 줄 | 좋음. IP가 바뀌어도 한국 리전이면 통과 | **권장.** 손님(한국)과 가까워 승인도 빨라진다. Supabase가 해외 리전이면 DB 호출은 느려질 수 있음 |
| B. 국가 정책에 미국 추가(리전 그대로) | 0원 | 오너: 국가에 대한민국 + 미국 | 동작은 확실 | 미국 어디서든 키가 쓰이면 통과 → 보안 효과 약함. A로 가기 전 임시로만 |
| C. Vercel Static IPs | Pro 전환 월 $20 + Static IPs 프로젝트당 월 $100 + 전송료(iad1 GB당 $0.15) ≈ **월 $120+** | 플랜 업그레이드 · 설정 · IP 2개 등록 | 좋음 | Hobby는 불가. Secure Compute는 Enterprise 전용. 이 매출 규모엔 과함 |
| D. 고정 IP 프록시(오너 Lightsail · 집 맥미니) | 서버 비용 0(이미 있음) | 리버스 프록시 설치 · TLS · 공유 시크릿, 그 서버 IP 등록. 코드는 준비됨(`TOSS_API_BASE_URL`) | 프록시가 죽으면 결제 승인이 전부 멈춤(단일 장애점). 맥미니는 가정용 IP라 바뀔 수 있음 | 두 서버는 다른 봇이 관리 → 운영봇이 오너 확인 후에만 |

조사 시점 권장은 A였다(무료). **오너 결정(2026-11-27): D — 오너의 Lightsail(WordPress-3) 고정 IP로 토스 호출만 중계.** A는 중계가 죽었을 때의 대안으로 남겨 둔다. A로 갈 때는 오너가 정책을 바꾸기 전까지 리전을 옮기지 않는다(지금 정책이 미국 IP 목록이면 리전을 먼저 옮기는 순간 막힌다).

## 5. 오너가 할 일 — A안일 때 (개발자센터 로그인 필요)

D안(Lightsail 중계)일 때는 7장 끝의 순서를 따른다.

1. https://developers.tosspayments.com/my/api-keys → 상단 탭 **라이브** → **API 키 접근 정책**.
2. 상점 `ground05jc`의 **결제위젯 연동 키(live_gsk…)** 에 어떤 정책이 걸려 있는지 확인한다(IP 목록인지 국가인지, 무엇이 들어 있는지). 캡처해서 운영봇에게 보낸다. API 개별 연동 키(live_sk…)도 같이 본다.
3. 정책을 **국가**로 바꾸고 **대한민국 + 미국**을 넣어 저장한다(임시 — 지금 운영은 미국 리전).
4. 운영봇에 알린다 → 코드에서 Vercel 함수 리전을 `icn1`로 옮겨 배포하고, 결제 조회 진단으로 통과를 확인한다.
5. 확인되면 정책에서 **미국을 빼고 대한민국만** 남긴다.
6. 그 뒤 카드 심사 통과 시 `VIDEOKIT_CARD_PENDING`을 지우는 일은 지금까지와 같다.

정책을 등록 · 수정 · 삭제하면 토스가 담당자 메일로 알린다.

## 6. 막혔을 때 사이트 동작 (커밋 c2cdb0a)

- 카드 · 간편결제 승인이 막힘: 승인되지 않았으므로 돈은 빠져나가지 않았다고 안내하고 `/price?plan=…`(계좌이체)로 보낸다. 판매자에게 `[결제 오류] 토스 API IP 차단 · <주문번호>` 메일(요청 IP 포함).
- 이미 승인된 결제 조회가 막힘: 기존 '결제를 확인하지 못했습니다' 화면 + 같은 판매자 메일(상점관리자에서 확인 후 키트 직접 발송).
- 가상계좌 입금 웹훅 조회가 막힘: 판매자 메일 + 500 응답 → 토스가 다시 보낸다(최대 7번). 예전에는 200으로 조용히 버렸다.
- 판매자 메일은 주문 · 단계마다 24시간에 한 번(Resend 멱등 키).

## 7. 프록시를 쓸 때 (D안)

`TOSS_API_BASE_URL=https://<프록시 주소>`, `TOSS_API_PROXY_SECRET=<임의 긴 문자열>`(둘 다 Vercel Production, 민감 변수). 프록시는:

- 경로 · 메서드 · 본문 · `Authorization` 헤더를 그대로 `https://api.tosspayments.com`으로 넘긴다.
- `X-Proxy-Secret`가 맞지 않는 요청은 거절한다. `X-Proxy-Secret`은 토스로 넘기지 않는다.
- https만(시크릿 키가 Authorization 헤더에 실린다).

변수를 지우면 토스로 바로 호출한다.

### Lightsail 중계 적용 순서 (D안, 서버는 대영교회 홈페이지 운영 봇 확인 후에만)

1. 읽기만: 인스턴스에 **Lightsail Static IP**가 붙어 있는지(아니면 재시작 때 바뀜), 웹서버(Bitnami Apache 추정), 443 열림, 디스크 · 메모리.
2. DNS: `tosspay-relay.groundrooted.com` A 레코드 → Static IP (Cloudflare, DNS 전용 · 회색 구름). 교회 도메인 · CloudFront는 건드리지 않는다. 인스턴스 직결이라 토스가 보는 IP = Static IP.
3. 서버: 기존 파일을 고치지 않고 새 vhost 파일 하나만 추가(Bitnami는 `apache/conf/vhosts/*.conf`를 자동 포함). 인증서는 Let's Encrypt(이 호스트만). `/v1/payments/` 경로만 `https://api.tosspayments.com`으로 전달, `X-Proxy-Secret` 틀리면 403, 이 헤더는 토스로 넘기지 않음, 접근 로그에 경로 · 본문 · 헤더 안 남김. `apachectl -t` 후 graceful reload만. 되돌리기: 그 파일 삭제 → `apachectl -t` → graceful.
4. 오너: 토스 개발자센터 라이브 → API 키 접근 정책 → live_gsk 키에 **IP = Static IP**를 등록(기존 항목은 중계 확인 전까지 유지).
5. Vercel Production에 `TOSS_API_BASE_URL`, `TOSS_API_PROXY_SECRET` 넣고 재배포. **중계가 동작하기 전에 넣으면 승인이 전부 실패하므로 순서를 지킨다.**
6. 운영에서 없는 주문번호 조회 1회 → `NOT_FOUND_MERCHANT`(통과)인지 확인. 실결제 · 취소 없음.
