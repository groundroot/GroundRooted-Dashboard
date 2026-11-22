# 클로드 비디오 키트 — 결제 후 키트 자동 발송 설정

결제(`/price?plan=kit` 또는 `?plan=lesson`)가 승인되면 결제 화면에 적은 이메일로 키트 다운로드 링크(7일 유효)와 설치 안내가 자동으로 갑니다.

- 코드: `products/videokit-delivery.ts`(발송), `app/price/success/page.tsx`(승인 직후 호출), `products/videokit.ts`(가격·주문 검증)
- 주문·구매자 정보는 자체 DB에 저장하지 않습니다. 결제 내역은 토스 상점관리자에서 봅니다. 같은 주문에 두 번 보내지 않는 것은 Resend의 Idempotency-Key(주문번호, 24시간)로 막습니다.
- 키트 zip은 Supabase Storage **비공개** 버킷 `videokit`에 파일 하나로 둡니다(개인정보 없음).
- 가격: 2026-11-28(토) 24:00 KST까지 연 결제 화면은 오픈 할인가(키트 10만원, 키트 + 1:1 강의 2회 30만원), 그 뒤로는 정가(30만원 · 50만원). 마감 직전에 연 화면은 30분 안에 결제를 마쳐야 합니다.
- 발송 설정(환경변수 4개)이 없으면 메일을 보내지 않고, 결제 완료 화면이 카카오톡으로 주문번호를 남기도록 안내합니다. 결제 자체는 그대로 됩니다.

## 판매자가 직접 할 일 (한 번)

1. **Supabase**
   - 프로젝트를 고르고(대시보드용 프로젝트를 써도 됩니다) SQL Editor에서 `sql/videokit-storage.sql`을 실행합니다. 비공개 버킷 `videokit`이 생깁니다.
   - Project Settings → API에서 `SUPABASE_URL`과 `service_role` 키를 확인합니다. service_role 키는 서버 전용이라 어디에도 공개하지 않습니다.
2. **키트 zip 올리기** (키트를 새로 만들 때마다 반복)
   ```bash
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/videokit-upload-kit.mjs "$HOME/코딩/FCP claude editing/dist/fcp-ai-kit-20261122.zip"
   ```
   같은 경로에 덮어쓰므로, 이미 보낸 링크가 유효한 동안에는 새 파일이 내려받아집니다.
3. **Resend**
   - resend.com에 가입하고 Domains에서 `groundrooted.com`을 추가합니다. 안내되는 DNS 레코드(SPF · DKIM)를 도메인 DNS에 넣고 인증이 끝날 때까지 기다립니다.
   - API Keys에서 발송 전용(Sending access) 키를 만듭니다.
4. **Vercel 환경변수** (Production): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `VIDEOKIT_MAIL_FROM`(예: `그라운드루티드 <kit@groundrooted.com>`). 선택: `VIDEOKIT_MAIL_REPLY_TO`(기본 sungchulkang@groundrooted.com), `VIDEOKIT_MAIL_BCC`(판매자 사본).
5. **시험 결제**: 토스 실제 키를 넣기 전, 테스트 키 상태에서 `/price?plan=kit`로 본인 이메일을 넣고 결제해 봅니다. 메일이 오고 링크로 zip이 내려받아지는지 확인합니다.
6. **실결제 전환**: 토스 심사가 끝나면 `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`(live 키 둘 다)를 넣고 다시 배포합니다.

## 운영

- **링크가 만료됐거나 메일을 못 받았다는 문의**: 토스 상점관리자에서 주문번호와 이메일을 확인한 뒤
  ```bash
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... VIDEOKIT_MAIL_FROM="..." \
    node scripts/videokit-resend.mjs <주문번호> <이메일> [이름]
  ```
- 발송 기록은 Resend 대시보드(Emails)에서 봅니다.
- 테스트: `pnpm test:videokit`(가격 · 주문 검증, 메일 본문), `pnpm test:storefront`.
