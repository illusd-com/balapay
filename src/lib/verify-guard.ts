import { getSession, type User } from "./auth";

export async function requireVerifiedSession(): Promise<
  { ok: true; user: User } | { ok: false; response: Response }
> {
  const user = await getSession();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "請先登入" }, { status: 401 }),
    };
  }
  if (!user.is_verified) {
    return {
      ok: false,
      response: Response.json(
        { error: "請先至「我的」完成實名驗證，才能進行收付款" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, user };
}
