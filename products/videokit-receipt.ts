// 결제 화면에서 받는 영수증 요청 (화면 · 서버 공용, 순수 함수만).
// 판매자 메일 본문의 세 줄은 운영봇이 읽는다. 라벨과 값 문자열은 여기서만 만든다.
//   영수증: 필요 없음 | 간이영수증 | 현금영수증(소득공제) | 현금영수증(지출증빙)
//   영수증 받는 분: <이름/단체명>
//   영수증 번호: <휴대폰 또는 사업자번호, 없으면 ->
// 간이영수증 PDF 첨부와 현금영수증 발급(홈택스)은 운영봇 · 판매자가 한다. 사이트는 요청만 받는다.

export const RECEIPT_KINDS = ['none', 'simple', 'cash-income', 'cash-expense'] as const;
export type ReceiptKind = typeof RECEIPT_KINDS[number];
export type Receipt = { kind: ReceiptKind; to: string; no: string };

export const RECEIPT_LABEL: Record<ReceiptKind, string> = {
  none: '필요 없음', simple: '간이영수증', 'cash-income': '현금영수증(소득공제)', 'cash-expense': '현금영수증(지출증빙)',
};
export const isCash = (k: ReceiptKind) => k === 'cash-income' || k === 'cash-expense';

const digits = (v: unknown) => (typeof v === 'string' ? v : '').replace(/\D/g, '');
// 한 줄 값만 받는다 (줄바꿈으로 가짜 '영수증 번호:' 줄을 끼워 넣지 못하게).
const oneLine = (v: unknown, max: number) => (typeof v === 'string' ? v : '').replace(/[\r\n\t\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// 휴대폰 010-XXXX-XXXX (숫자만 적어도 받는다)
export function formatPhone(v: unknown) {
  const d = digits(v);
  return /^010\d{8}$/.test(d) ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : null;
}
// 사업자등록번호 · 단체 고유번호 XXX-XX-XXXXX (10자리, 형식만 검사)
export function formatBizNo(v: unknown) {
  const d = digits(v);
  return /^\d{10}$/.test(d) ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : null;
}

// 입력을 검사하고 메일에 적을 값으로 바꾼다. 형식이 틀리면 null.
// buyerName: 받는 분을 비워 두면 주문자 이름으로 채운다. card: 카드 · 간편결제는 현금영수증을 받지 않는다(카드 매출전표).
export function parseReceipt(raw: unknown, buyerName: string, { card = false } = {}): Receipt | null {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const kind = (r.kind ?? 'none') as ReceiptKind;
  if (!RECEIPT_KINDS.includes(kind)) return null;
  if (card && isCash(kind)) return null;
  const name = oneLine(buyerName, 50);
  const to = oneLine(r.to, 50);
  switch (kind) {
    case 'none': return { kind, to: '', no: '' };
    case 'simple': {
      const no = oneLine(r.no, 20);
      const biz = no ? formatBizNo(no) : '';
      return biz === null ? null : { kind, to: to || name, no: biz };
    }
    case 'cash-income': {
      const phone = formatPhone(r.no);
      return phone ? { kind, to: to || name, no: phone } : null;
    }
    case 'cash-expense': {
      const biz = formatBizNo(r.no);
      return biz && to ? { kind, to, no: biz } : null;
    }
  }
}

// 판매자 메일 본문의 세 줄 ([라벨, 값])
export function receiptRows(r: Receipt): [string, string][] {
  return [['영수증', RECEIPT_LABEL[r.kind]], ['영수증 받는 분', r.to || '-'], ['영수증 번호', r.no || '-']];
}
