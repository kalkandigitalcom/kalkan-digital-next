import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/server/auth/session";
import { AuthShell } from "../auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Yönetici girişi", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentAdmin()) redirect("/admin/workspace");
  const { next } = await searchParams;
  return (
    <AuthShell title="Yönetici girişi" subtitle="Devam etmek için hesabınızla giriş yapın.">
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
