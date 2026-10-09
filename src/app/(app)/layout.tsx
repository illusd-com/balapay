import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await getSession();
  } catch (e) {
    console.error("[AppLayout] session", e);
    redirect("/login");
  }
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">{children}</main>
      <AppNav />
    </div>
  );
}
