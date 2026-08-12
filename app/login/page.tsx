import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const password = process.env.DASHBOARD_PASSWORD;
    if (!password || formData.get("password") !== password) redirect("/login?e=1");

    (await cookies()).set(AUTH_COOKIE, await authToken(password), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/");
  }

  return (
    <main className="login-wrap">
      <form className="login-card" action={login}>
        <h1>GroundRooted HQ</h1>
        <p className="login-hint">운영 대시보드입니다. 비밀번호를 입력하세요.</p>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          aria-label="비밀번호"
          required
          autoFocus
        />
        {e && <p className="login-error">비밀번호가 올바르지 않습니다.</p>}
        <button type="submit">들어가기</button>
      </form>
    </main>
  );
}
