# 클로드 비디오 키트 — 결제 후 키트 자동 발송 설정

결제 화면은 `/price`(상품 선택 · `?plan=kit|lesson|pass`로 미리 고름)입니다. 결제 수단은 두 가지입니다.

- **계좌이체**: 화면에 계좌(토스뱅크 1002-8619-7757, 예금주 그라운드루티드)와 금액이 보이고, 주문하기를 누르면 `/api/videokit/apply`가 판매자 메일로 주문을 보냅니다(제목 `[구매 신청] <구성> · <이름>`, Reply-To = 구매자 이메일). 판매자가 입금을 확인한 뒤 키트를 보냅니다.
- **영수증 요청**: 결제 화면에서 필요 없음 / 간이영수증(받는 분 · 선택 사업자번호) / 현금영수증(소득공제: 휴대폰, 지출증빙: 사업자번호 · 단체명)을 고릅니다. 카드 · 간편결제는 카드 매출전표가 나가므로 간이영수증만 고를 수 있습니다. 판매자 메일 본문 끝에 아래 세 줄이 붙습니다(운영봇이 읽는 형식, 만드는 곳은 `products/videokit-receipt.ts` 한 곳).
  ```
  영수증: 필요 없음 | 간이영수증 | 현금영수증(소득공제) | 현금영수증(지출증빙)
  영수증 받는 분: <이름/단체명>
  영수증 번호: <010-0000-0000 또는 000-00-00000, 없으면 ->
  ```
  카드 · 간편결제는 영수증 요청을 토스 metadata `receipt`(JSON)로 넘기고, 실제(live) 키로 승인되면 판매자에게 `[결제 완료] <구성> · <이름>` 메일(같은 세 줄 포함, Reply-To 구매자)이 갑니다. 테스트 키 결제에는 가지 않습니다.
- **카드 · 간편결제(토스페이먼츠)**: 실제(live) 키로 승인되면 결제 화면에 적은 이메일로 짧은 다운로드 링크(`https://groundrooted.com/d/<코드>`, 7일 뒤 삭제 — 아래 '짧은 다운로드 링크')와 구매자 키, OS별 설치 안내가 자동으로 갑니다.
- **테스트 키로 승인된 결제에는 키트 메일을 보내지 않습니다**(결제 완료 화면 · 가상계좌 웹훅 모두). 테스트 키이거나 `VIDEOKIT_CARD_PENDING=1`이면 결제 화면이 카드 · 간편결제를 '심사 중 · 곧 열립니다'로 표시하고 계좌이체를 기본으로 둡니다. 결제창 진입은 심사자를 위해 남깁니다. 실제 키를 넣고 `VIDEOKIT_CARD_PENDING`이 없으면 카드 · 간편결제가 기본이 됩니다(코드 수정 없음).

- 코드: `products/videokit-delivery.ts`(발송), `app/price/success/page.tsx`(승인 직후 호출), `products/videokit.ts`(가격·주문 검증)
- 주문 내역은 자체 DB에 저장하지 않습니다. 결제 내역은 토스 상점관리자에서 봅니다. 자체 DB(Supabase `videokit_licenses`)에는 업데이트용 구매자 키만 둡니다(키 · 이메일 · 주문번호 · 확인 기록, 아래 '온라인 업데이트'). 같은 주문에 두 번 보내지 않는 것은 Resend의 Idempotency-Key(주문번호, 24시간)로 막습니다.
- 키트 zip은 Supabase Storage **비공개** 버킷 `videokit`에 둡니다(개인정보 없음). 2026-11-27부터 메일에는 짧은 다운로드 링크 하나가 들어가고, 그 페이지가 `kit/current.json`이 가리키는 맥용 · 윈도우용 파일을 내려줍니다(아래 '짧은 다운로드 링크'). 예전 `kit/claude-video-kit.zip` · `kit/claude-video-kit-windows.zip`은 남아 있지만 메일에는 더 쓰지 않습니다.
- 가격: 2026-11-28(토) 24:00 KST까지 연 결제 화면은 오픈 할인가(키트 10만원, 키트 + 1:1 강의 2회 30만원), 그 뒤로는 정가(30만원 · 50만원). 마감 직전에 연 화면은 30분 안에 결제를 마쳐야 합니다.
- 발송 설정(환경변수 4개)이 없으면 메일을 보내지 않고, 결제 완료 화면이 카카오톡으로 주문번호를 남기도록 안내합니다. 결제 자체는 그대로 됩니다.

## 판매자가 직접 할 일 (한 번)

1. **Supabase**
   - 프로젝트를 고르고(대시보드용 프로젝트를 써도 됩니다) SQL Editor에서 `sql/videokit-storage.sql`을 실행합니다. 비공개 버킷 `videokit`이 생깁니다.
   - Project Settings → API에서 `SUPABASE_URL`과 `service_role` 키를 확인합니다. service_role 키는 서버 전용이라 어디에도 공개하지 않습니다.
2. **키트 zip 올리기** (새 버전을 낼 때마다 반복, 2026-11-27부터). 맥용 · 윈도우용 zip 두 개와 버전 번호(`[0-9A-Za-z.]`, 예: `1.3`)를 넘깁니다. 설명서 폴더 · 스크립트 확장자를 바꾸지 않은 원본 zip을 올립니다(링크로 보내므로 Gmail 첨부 제한과 상관없음).
   `scripts/videokit-upload-link-kit.mjs`가 `kit/links/<버전>/ClaudeVideoKit-Mac-<버전>.zip` · `ClaudeVideoKit-Windows-<버전>.zip`으로 올리고, 다시 내려받아 크기 · sha256이 같을 때만 `kit/current.json`을 새 버전으로 바꿉니다. 바뀐 순간부터 **이미 보낸 링크도 포함해** 모든 `/d/<코드>` 버튼이 새 버전을 내려줍니다. 실패하면 current.json은 이전 버전 그대로입니다.
   이 저장소 폴더에서 한 줄로 실행합니다(운영 Supabase 키를 Vercel에서 받아 쓰고 바로 지움):
   ```bash
   V=1.4; MAC=<맥용.zip>; WIN=<윈도우용.zip>; F=$(mktemp); vercel env pull "$F" --environment=production --yes --scope groundroots-projects >/dev/null && (set -a; . "$F"; set +a; rm -f "$F"; node scripts/videokit-upload-link-kit.mjs "$V" "$MAC" "$WIN"); rm -f "$F"
   ```
   (vercel CLI가 이 프로젝트에 연결돼 있어야 합니다: 처음 한 번 `vercel link --yes --project groundrooted-dashboard --scope groundroots-projects`. 프로젝트 이름 없이 `vercel link`를 하면 새 프로젝트가 생길 수 있습니다.)
   올린 뒤 시험 링크(`scripts/videokit-make-link.mjs`)로 맥 · 윈도우 버튼을 눌러 버전 · 파일 이름을 확인하고, 메일 본문(`products/videokit-delivery.ts`의 `MANUAL_DIR` · 시작하기 단계)과 다운로드 페이지 안내(「0. Claude Video Kit Manual」)가 키트 구성과 맞는지 확인합니다.
   - 2026-11-27: 1.3 올림 (아래 '짧은 다운로드 링크' 절에 크기 · sha256).
   - 예전 방식(2026-11-26까지): `scripts/videokit-upload-kit.mjs`로 `kit/claude-video-kit.zip` · `kit/claude-video-kit-windows.zip`에 덮어썼습니다. 이 경로는 이제 메일 · 링크 어디에서도 쓰지 않으며, 파일은 지우지 않고 남겨 두었습니다.
   - 2026-11-26: 운영 Supabase에 비공개 버킷 `videokit` 생성(sql/videokit-storage.sql과 같은 설정), `ClaudeVideoKit-2026.11.26.1802.zip`(2,822,597 bytes, sha256 `ebeecf8c…c71f7c6`) 올림. 7일 서명 링크로 내려받아 크기 · sha256 일치, 서명 없는 주소는 막힘 확인.
   - 2026-11-26 (윈도우 버전 출시): 맥용 `ClaudeVideoKit-2026.11.26.2225.zip`(2,834,350 bytes, sha256 `c2aad1d9…6a870686`) → `kit/claude-video-kit.zip`, 윈도우용 `ClaudeVideoKit-Windows-2026.11.26.2225.zip`(2,721,661 bytes, sha256 `79db224b…a54b62`) → `kit/claude-video-kit-windows.zip`. 두 파일 모두 7일 서명 링크로 내려받아 크기 · sha256 일치, 서명 없는 주소는 막힘(400) 확인.
3. **Resend**
   - resend.com에 가입하고 Domains에서 `groundrooted.com`을 추가합니다. 안내되는 DNS 레코드(SPF · DKIM)를 도메인 DNS에 넣고 인증이 끝날 때까지 기다립니다.
   - API Keys에서 발송 전용(Sending access) 키를 만듭니다.
4. **Vercel 환경변수** (Production): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `VIDEOKIT_MAIL_FROM`(예: `그라운드루티드 <kit@groundrooted.com>`). 선택: `VIDEOKIT_MAIL_REPLY_TO`(기본 sungchulkang@groundrooted.com), `VIDEOKIT_MAIL_BCC`(판매자 사본).
5. **발송 확인**: 테스트 키 결제로는 메일이 나가지 않습니다. 메일 · 링크 확인은 `scripts/videokit-resend.mjs`로 본인 주소에 보내 봅니다(아래 운영 항목).
6. **실결제 전환**: 토스 심사가 끝나면 `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`(live 키 둘 다)를 넣고, `VIDEOKIT_CARD_PENDING`을 지운 뒤 다시 배포합니다.

## 운영

- **링크가 만료됐거나 메일을 못 받았다는 문의**: 토스 상점관리자에서 주문번호와 이메일을 확인한 뒤
  ```bash
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... VIDEOKIT_MAIL_FROM="..." \
    node scripts/videokit-resend.mjs <주문번호> <이메일> [이름]
  ```
- 발송 기록은 Resend 대시보드(Emails)에서 봅니다.
- 테스트: `pnpm test:videokit`(가격 · 주문 검증, 메일 본문, 구매자 키 · 업데이트 확인, 짧은 다운로드 링크), `pnpm test:storefront`.

## 짧은 다운로드 링크 (`/d/<코드>`, 2026-11-27부터)

메일 첨부 대신 보내는 링크입니다. Gmail이 zip 안의 .ps1/.js를 막아 첨부는 파일 이름을 바꿔야 했지만, 링크는 원래 이름 그대로 내려갑니다. 코드: `products/videokit-link.ts`, `app/d/[code]/`, 표 `sql/videokit-download-links.sql`.

- **링크**: `https://groundrooted.com/d/<코드>` — 코드 8자(대문자 · 숫자, 0/O · 1/I/l 없음, crypto 랜덤 40비트). 페이지에 받는 분 이름 일부(강*철), 버전, 맥용 · 윈도우용 버튼, 삭제 날짜, 설명서 안내, '본인 구매용 링크' 문구, 문의(카카오톡 · 메일 답장)가 있습니다. 검색 제외(noindex).
- **만료**: 발급일 + 7일, 그날 23:59 KST. 지나면 "링크가 만료되었습니다" 페이지(404). 만료된 행은 새 링크를 발급할 때와 만료된 링크로 요청이 올 때 지웁니다.
- **버튼**: 페이지의 POST 폼 `/d/<코드>/mac|windows` → 그때 10분짜리 서명 링크로 303(`Cache-Control: no-store`, `Referrer-Policy: no-referrer`). 같은 주소로 GET이 오면(메일 보안 검사기 · 미리보기가 따라감) 세지 않고 페이지로 303 — 검사기가 다운로드 횟수를 소진하지 못합니다. 파일 이름 `ClaudeVideoKit-Mac-<버전>.zip` / `ClaudeVideoKit-Windows-<버전>.zip`. 버튼을 누른 횟수(`download_count`) · 마지막 시각(`last_download_at`)을 남깁니다. 페이지 열람은 세지 않습니다.
- **제한**: 링크당 받기 횟수 상한 `max_downloads`(기본 10, 넘으면 "다운로드 횟수를 넘었습니다" 안내) · 링크당 1분에 10번 · 한 IP가 10분에 없는/만료 코드를 10번 요청하면 그 IP의 `/d/*`를 10분 동안 막음(코드 추측 막기). 1분 · IP 제한은 서버 인스턴스 메모리라 인스턴스마다 따로 셉니다.
- **파일 고르기**: 버킷 `kit/current.json` = `{"version":"1.3","mac":{"path":"kit/links/1.3/ClaudeVideoKit-Mac-1.3.zip","sha256","size"},"windows":{...}}`. 새 버전은 아래 명령 한 줄로 올립니다(올린 파일을 다시 받아 sha256이 같을 때만 current.json을 바꿈). 예전 `kit/claude-video-kit*.zip`은 쓰지 않으며 건드리지 않습니다.
  ```bash
  node scripts/videokit-upload-link-kit.mjs <버전> <맥용.zip> <윈도우용.zip>
  ```
  - 2026-11-27: 1.3 (영문 설명서 폴더 「0. Claude Video Kit Manual」, 확장자 원본) 맥 2,819,516 bytes sha256 `25a1e674…794d440c`, 윈도우 2,709,558 bytes sha256 `9caf3e45…8d7af`.
- **구매자 표식 (2026-11-27)**: 버튼을 누르면 원본 zip을 그대로 내주지 않고, 그 링크의 주문번호(`order_id`, 없으면 `TEST-<코드>`) · 발급일(`created_at`의 KST 날짜) · 링크 코드를 넣은 개인 zip을 만들어 `kit/personal/<코드>/ClaudeVideoKit-<OS>-<버전>.zip`에 올리고 그 파일로 서명합니다(`products/videokit-watermark.ts`). 자동 메일 · `scripts/videokit-make-link.mjs` 수동 발급 모두 이 버튼을 거치므로 같은 표식이 붙습니다. 표식 위치: 보이는 `Claude Video Kit/LICENSE.txt`, 숨은 zip 주석 · `System/MANIFEST.json`의 `"license"` 필드 · `CLAUDE.md`와 `System/CLAUDE.md` 끝 HTML 주석(MANIFEST의 두 파일 sha256도 함께 바꿔 `update.py`가 '고치지 않은 키트 파일'로 봄). 나머지 파일은 바이트 그대로입니다. 원본 sha256이 current.json과 다르거나 표식 · 업로드가 실패하면 503이고 횟수를 세지 않습니다(원본을 대신 내주지 않음). 개인 zip은 링크가 만료돼 지워질 때 · `--revoke` · 발급 때 만료 정리에서 함께 지웁니다. 유출본을 받으면 zip 주석(`unzip -z`)이나 LICENSE.txt · MANIFEST.json의 주문번호로 확인합니다. 키트 업데이트(구매자 키 `/api/videokit/latest`)로 받는 업데이트 zip에는 표식이 없고(sha256 검증 때문), 업데이트 뒤에는 MANIFEST · CLAUDE.md 표식이 새 파일로 바뀌고 LICENSE.txt만 남습니다.
- **수동 발급** (운영봇 · 계좌이체 구매자 · 만료된 구매자). 실행마다 새 링크를 만들고, 링크와 삭제 날짜 두 줄을 출력합니다. 메일은 보내지 않습니다.
  ```bash
  node scripts/videokit-make-link.mjs --email <이메일> --name <이름> --order <주문번호> [--days 7] [--max 10] [--dry-run]
  node scripts/videokit-make-link.mjs --revoke <코드>     # 바로 끄기 (환불 · 잘못 보냄 · 공유됨)
  ```
  (환경변수 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — 키트 zip 올리기처럼 `vercel env pull`로 받아 쓰고 바로 지웁니다.)
- **자동 메일**: `deliverKit`이 같은 주문의 살아 있는 링크를 다시 씁니다(결제 완료 화면 새로고침 · 웹훅 재시도 → 같은 링크, 같은 메일 본문). `videokit-resend.mjs`(force)는 새 링크를 만듭니다. 링크 표에 쓰지 못하면 메일을 보내지 않고 failed(결제 완료 화면 카카오톡 안내 · 판매자 알림 '직접 보내야 함' · 웹훅은 500으로 재시도).

## 온라인 업데이트 (`/videokit update`)

약속 문서: FCP 키트 저장소 `docs/update_server_contract.md`. 코드: `products/videokit-license.ts`, `app/api/videokit/latest/route.ts`.

- **구매자 키** `VK-XXXX-XXXX-XXXX`: 카드 · 간편결제 키트 메일에 자동으로 들어갑니다(`deliverKit`). 같은 주문번호는 새로고침 · 웹훅 재시도 · `videokit-resend.mjs` 재발송 모두 같은 키입니다. 키를 만들지 못하면(테이블이 없을 때 포함) 키 없이 키트 메일을 보내고 로그에 `license issue failed`를 남깁니다.
- **테이블**: SQL Editor에서 `sql/videokit-licenses.sql`을 한 번 실행합니다. RLS를 켜고 정책을 두지 않아 서버(service_role)만 읽고 씁니다. 새 환경변수는 없습니다(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 같이 씀).
- **확인 주소** `GET /api/videokit/latest?platform=mac|windows&current=<버전>`, 헤더 `Authorization: Bearer <키>`. 키가 맞으면 버킷의 `releases/latest.json`을 읽어 10분 서명 링크를 줍니다.
  - 200 `{"version","platform","sha256","size","url","notes"}` · 401 `{"error":"invalid_key"}`(키 없음 · 틀림 · revoked)
  - 약속 문서에 없는 응답: 429 `{"error":"rate_limited"}`(키 하나당 1분에 10번, `Retry-After: 60`, 서버 인스턴스마다 따로 셈) · 400 `{"error":"bad_platform"}` · 503 `{"error":"no_release"}`(latest.json이 없거나 그 플랫폼 항목이 없음) · 503 `{"error":"unavailable"}`(DB · 서명 오류, 설정 없음, latest.json 항목 형식이 틀림 — version은 `[0-9A-Za-z.]`만, sha256 64자 hex, size 양의 정수)
  - `notes`: latest.json에 `mac.notes` · `windows.notes`가 있으면 플랫폼별로, 없으면 최상위 `notes`
  - 확인할 때마다 `last_seen_at`, 형식이 맞는 `current`는 `last_version`에 기록합니다.
- **기존 구매자 · 계좌이체 구매자 키 발급**: 메일은 보내지 않고 키를 만들어 CSV로 출력합니다. 같은 주문번호를 다시 실행하면 새 키를 만들지 않고 있는 키를 출력합니다(`existing`). 이름은 저장하지 않고 출력에만 씁니다. `--dry-run`은 DB에 쓰지 않고 입력만 확인합니다.
  ```bash
  node scripts/videokit-issue-keys.mjs <이메일> <이름> <주문번호>
  node scripts/videokit-issue-keys.mjs --csv 구매자.csv > 키.csv     # 머리글 email,name,order_id
  ```
  (환경변수는 키트 zip 올리기와 같이 `vercel env pull`로 받아 쓰고 바로 지웁니다.)
- **키 막기**(환불 등): SQL Editor에서 `update videokit_licenses set revoked = true where order_id = '<주문번호>';`
