/**
 * Creates (or resets the password of) an admin user.
 *
 *   npm run admin:create                       # interactive
 *   ADMIN_EMAIL=.. ADMIN_NAME=.. ADMIN_PASSWORD=.. npm run admin:create   # non-interactive
 *   node dist-scripts/create-admin.mjs         # inside the production container
 *
 * No default password exists anywhere in the codebase.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import postgres from "postgres";
import { hashPassword, passwordPolicy } from "../src/server/auth/password";

async function ask(rl: ReturnType<typeof createInterface>, q: string, hidden = false) {
  if (!hidden) return (await rl.question(q)).trim();
  // Minimal hidden input: mute echo while typing.
  const out = stdout as unknown as { write: (s: string) => boolean };
  const original = out.write.bind(out);
  let muted = false;
  out.write = (s: string) => (muted ? true : original(s));
  const p = rl.question(q);
  muted = true;
  const answer = await p;
  muted = false;
  original("\n");
  return answer;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil.");
  const reset = process.argv.includes("--reset-password");

  let email = process.env.ADMIN_EMAIL?.trim() ?? "";
  let name = process.env.ADMIN_NAME?.trim() ?? "";
  let password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password || (!name && !reset)) {
    if (!stdin.isTTY) throw new Error("Etkileşimsiz modda ADMIN_EMAIL, ADMIN_NAME ve ADMIN_PASSWORD gereklidir.");
    const rl = createInterface({ input: stdin, output: stdout });
    if (!email) email = await ask(rl, "E-posta: ");
    if (!name && !reset) name = await ask(rl, "Ad Soyad: ");
    if (!password) {
      password = await ask(rl, `Parola (${passwordPolicy.describe}): `, true);
      const again = await ask(rl, "Parola (tekrar): ", true);
      if (again !== password) throw new Error("Parolalar eşleşmiyor.");
    }
    rl.close();
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Geçersiz e-posta adresi.");
  const policyError = passwordPolicy.check(password);
  if (policyError) throw new Error(policyError);

  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const hash = await hashPassword(password);
    const existing = await sql<{ id: string }[]>`select id from admin_users where lower(email) = lower(${email})`;
    if (existing.length > 0) {
      if (!reset) throw new Error("Bu e-posta ile bir yönetici zaten var. Parolayı sıfırlamak için --reset-password kullanın.");
      await sql.begin(async (tx) => {
        await tx`update admin_users set password_hash = ${hash}, password_changed_at = now(), is_active = true, updated_at = now() where id = ${existing[0]!.id}`;
        await tx`delete from sessions where user_id = ${existing[0]!.id}`;
        await tx`insert into activity_logs (user_id, action, entity_type, entity_id, summary) values (${existing[0]!.id}, 'admin.password_reset_cli', 'admin_user', ${existing[0]!.id}, 'Parola CLI ile sıfırlandı')`;
      });
      console.log(`Parola güncellendi ve tüm oturumlar kapatıldı: ${email}`);
      return;
    }
    const countRows = await sql<{ count: number }[]>`select count(*)::int as count from admin_users`;
    const count = countRows[0]?.count ?? 0;
    const role = count === 0 ? "owner" : "admin";
    const [row] = await sql<{ id: string }[]>`
      insert into admin_users (email, name, password_hash, role)
      values (${email.toLowerCase()}, ${name || email}, ${hash}, ${role})
      returning id`;
    await sql`insert into activity_logs (user_id, action, entity_type, entity_id, summary) values (${row!.id}, 'admin.created_cli', 'admin_user', ${row!.id}, ${`Yönetici oluşturuldu (${role})`})`;
    console.log(`Yönetici oluşturuldu (${role}): ${email}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("HATA:", err instanceof Error ? err.message : err);
  process.exit(1);
});
