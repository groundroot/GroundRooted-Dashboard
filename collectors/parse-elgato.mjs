// Elgato Maker Console 판매 CSV → revenue 테이블
// 사용: node parse-elgato.mjs <파일.csv>
// CSV 컬럼명이 다르면 아래 COLS 매핑만 수정하면 된다.
// env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { requireEnv, sbInsertIgnore, DRY } from "./lib.mjs";

requireEnv();

const file = process.argv[2];
if (!file) { console.error("사용법: node parse-elgato.mjs <sales.csv>"); process.exit(1); }

// CSV 헤더 이름 후보 (Maker Console 포맷이 바뀌면 여기만 수정)
const COLS = {
  date: ["date", "Date", "purchase_date", "Purchase Date", "Order Date"],
  product: ["product", "Product", "item", "Item", "Product Name"],
  amount: ["amount", "Amount", "net", "Net", "revenue", "Revenue", "Net Revenue", "price", "Price"],
  currency: ["currency", "Currency"],
  qty: ["qty", "Qty", "quantity", "Quantity", "units", "Units"],
};

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (cell !== "" || row.length) { row.push(cell); rows.push(row); row = []; cell = ""; }
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const [header, ...rows] = parseCsv(readFileSync(file, "utf8"));
const idx = {};
for (const [key, names] of Object.entries(COLS)) {
  idx[key] = header.findIndex((h) => names.includes(h.trim()));
}
if (idx.date < 0 || idx.product < 0 || idx.amount < 0) {
  console.error(`컬럼을 찾지 못했습니다. 헤더: ${header.join(", ")}\ncollectors/parse-elgato.mjs의 COLS 매핑을 수정하세요.`);
  process.exit(1);
}

const records = rows
  .filter((r) => r.length >= header.length && r[idx.amount])
  .map((r) => {
    const dateRaw = r[idx.date].trim();
    const occurred = new Date(dateRaw);
    const rec = {
      channel: "elgato",
      product: r[idx.product].trim(),
      amount: Number(String(r[idx.amount]).replace(/[^0-9.-]/g, "")),
      currency: idx.currency >= 0 ? r[idx.currency].trim() || "USD" : "USD",
      qty: idx.qty >= 0 ? Number(r[idx.qty]) || 1 : 1,
      occurred_at: isNaN(occurred.getTime()) ? new Date().toISOString() : occurred.toISOString(),
    };
    rec.external_id = createHash("sha1").update(`${dateRaw}|${rec.product}|${rec.amount}|${rec.qty}`).digest("hex");
    return rec;
  })
  .filter((r) => !isNaN(r.amount));

await sbInsertIgnore("revenue", records, "channel,external_id");
console.log(`✓ ${records.length}건 반영${DRY ? " (DRY)" : ""} — 합계 ${records.reduce((s, r) => s + r.amount, 0).toFixed(2)}`);
