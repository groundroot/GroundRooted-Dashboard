export const AUTH_COOKIE = "hq_auth";

/** 비밀번호를 쿠키에 그대로 담지 않기 위한 파생 토큰 */
export async function authToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`groundrooted:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
