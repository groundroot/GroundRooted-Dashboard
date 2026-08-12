// Stripe 웹훅 → revenue 기록 (checkout.session.completed)
// Vercel 환경변수: STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Stripe 대시보드 → Webhooks → 엔드포인트: https://<도메인>/api/webhooks/stripe
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  // 5분 이상 지난 이벤트 거부 (재전송 공격 방지)
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sbUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !sbUrl || !sbKey) return new Response("not configured", { status: 500 });

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, sig, secret)) return new Response("bad signature", { status: 400 });

  const event = JSON.parse(payload);

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const headers = {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    };
    const amount = (s.amount_total ?? 0) / 100;
    const product = s.metadata?.product ?? "site-sale";

    await fetch(`${sbUrl}/rest/v1/revenue?on_conflict=channel,external_id`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        channel: "site",
        product,
        amount,
        currency: (s.currency ?? "usd").toUpperCase(),
        qty: 1,
        occurred_at: new Date(event.created * 1000).toISOString(),
        external_id: s.id,
        meta: { email: s.customer_details?.email ?? null },
      }),
    });

    await fetch(`${sbUrl}/rest/v1/events?on_conflict=source,external_id`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "stripe",
        type: "sale",
        title: `사이트 판매 — ${product} ($${amount})`,
        external_id: s.id,
        occurred_at: new Date(event.created * 1000).toISOString(),
        detail: { currency: s.currency },
      }),
    });
  }

  return new Response("ok");
}
