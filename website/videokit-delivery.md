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
- **카드 · 간편결제(토스페이먼츠)**: 실제(live) 키로 승인되면 결제 화면에 적은 이메일로 키트 다운로드 링크(7일 유효)와 설치 안내가 자동으로 갑니다.
- **테스트 키로 승인된 결제에는 키트 메일을 보내지 않습니다**(결제 완료 화면 · 가상계좌 웹훅 모두). 테스트 키이거나 `VIDEOKIT_CARD_PENDING=1`이면 결제 화면이 카드 · 간편결제를 '심사 중 · 곧 열립니다'로 표시하고 계좌이체를 기본으로 둡니다. 결제창 진입은 심사자를 위해 남깁니다. 실제 키를 넣고 `VIDEOKIT_CARD_PENDING`이 없으면 카드 · 간편결제가 기본이 됩니다(코드 수정 없음).

- 코드: `products/videokit-delivery.ts`(발송), `app/price/success/page.tsx`(승인 직후 호출), `products/videokit.ts`(가격·주문 검증)
- 주문·구매자 정보는 자체 DB에 저장하지 않습니다. 결제 내역은 토스 상점관리자에서 봅니다. 같은 주문에 두 번 보내지 않는 것은 Resend의 Idempotency-Key(주문번호, 24시간)로 막습니다.
- 키트 zip은 Supabase Storage **비공개** 버킷 `videokit`에 파일 하나로 둡니다(개인정보 없음).
- 가격: 2026-11-28(토) 24:00 KST까지 연 결제 화면은 오픈 할인가(키트 10만원, 키트 + 1:1 강의 2회 30만원), 그 뒤로는 정가(30만원 · 50만원). 마감 직전에 연 화면은 30분 안에 결제를 마쳐야 합니다.
- 발송 설정(환경변수 4개)이 없으면 메일을 보내지 않고, 결제 완료 화면이 카카오톡으로 주문번호를 남기도록 안내합니다. 결제 자체는 그대로 됩니다.

## 판매자가 직접 할 일 (한 번)

1. **Supabase**
   - 프로젝트를 고르고(대시보드용 프로젝트를 써도 됩니다) SQL Editor에서 `sql/videokit-storage.sql`을 실행합니다. 비공개 버킷 `videokit`이 생깁니다.
   - Project Settings → API에서 `SUPABASE_URL`과 `service_role` 키를 확인합니다. service_role 키는 서버 전용이라 어디에도 공개하지 않습니다.
2. **키트 zip 올리기** (키트를 새로 만들 때마다 반복). 원본 빌드(`dist/ClaudeVideoKit-YYYY.MM.DD.HHMM.zip`)를 올립니다. 메일 첨부용 zip(`ClaudeVideoKit-YYYY.MM.DD.zip`)이 아닙니다. 아래 명령은 시각이 붙은 가장 최근 빌드만 고릅니다.
   이 저장소 폴더에서 한 줄로 실행합니다(운영 Supabase 키를 Vercel에서 받아 쓰고 바로 지움, 가장 최근 빌드를 올림):
   ```bash
   vercel env pull /tmp/vk.env --environment=production --yes --scope groundroots-projects >/dev/null && (set -a; . /tmp/vk.env; set +a; rm -f /tmp/vk.env; node scripts/videokit-upload-kit.mjs "$(ls -t "$HOME/코딩/FCP claude editing/dist"/ClaudeVideoKit-*.*.*.*.zip | head -1)")
   ```
   (vercel CLI가 이 프로젝트에 연결돼 있어야 합니다: 처음 한 번 `vercel link --yes --project groundrooted-dashboard --scope groundroots-projects`.)
   같은 경로(`videokit/kit/claude-video-kit.zip`)에 덮어쓰므로, 이미 보낸 링크가 유효한 동안에는 새 파일이 내려받아집니다.
   올린 뒤 메일 본문(`products/videokit-delivery.ts`의 `MANUAL_DIR` · 시작하기 단계)이 키트 구성과 맞는지 확인합니다.
   - 2026-11-26: 운영 Supabase에 비공개 버킷 `videokit` 생성(sql/videokit-storage.sql과 같은 설정), `ClaudeVideoKit-2026.11.26.1802.zip`(2,822,597 bytes, sha256 `ebeecf8c…c71f7c6`) 올림. 7일 서명 링크로 내려받아 크기 · sha256 일치, 서명 없는 주소는 막힘 확인.
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
- 테스트: `pnpm test:videokit`(가격 · 주문 검증, 메일 본문), `pnpm test:storefront`.
