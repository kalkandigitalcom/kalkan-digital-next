import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { adminUsers } from "@/server/db/schema";
import { env } from "@/server/env";
import { passwordPolicy } from "@/server/auth/password";
import { AuthShell } from "../auth-shell";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "İlk kurulum", robots: { index: false, follow: false } };

export default async function SetupPage() {
  await connection();
  // Only reachable when ADMIN_SETUP_TOKEN is configured AND no admin exists yet.
  if (!env().ADMIN_SETUP_TOKEN) notFound();
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(adminUsers);
  if ((row?.n ?? 0) > 0) redirect("/admin/login");
  return (
    <AuthShell title="İlk yönetici hesabı" subtitle="Sunucuda tanımladığınız kurulum anahtarı ile sahip hesabını oluşturun.">
      <SetupForm policy={passwordPolicy.describe} />
    </AuthShell>
  );
}
