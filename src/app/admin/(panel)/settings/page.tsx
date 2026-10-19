import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, History, Tags } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getSettingsPage } from "@/server/services/settings";
import { setAdminActiveAction } from "@/server/actions/settings";
import { passwordPolicy } from "@/server/auth/password";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { BaseCurrencyForm, CompanyForm, LogoutOthersForm, NewAdminForm, PasswordForm } from "./settings-forms";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  await requireAdmin();
  const s = await getSettingsPage();
  const isOwner = s.admin.role === "owner";
  return (
    <>
      <PageHeader title="Ayarlar" description="Firma bilgileri, finans ayarları ve hesap güvenliği." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {[
          { href: "/admin/settings/categories", icon: Tags, title: "Gelir ve gider kategorileri", desc: "Kategorileri ekleyin, sıralayın veya pasif yapın." },
          { href: "/admin/settings/activity", icon: History, title: "İşlem geçmişi (activity log)", desc: "Giriş denemeleri ve tüm hassas işlemlerin kaydı." },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-4 shadow-card hover:shadow-lift">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><l.icon className="size-5" /></span>
            <span className="flex-1"><span className="block text-sm font-semibold text-navy-900">{l.title}</span><span className="text-xs text-navy-500">{l.desc}</span></span>
            <ChevronRight className="size-4 text-navy-300" />
          </Link>
        ))}
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader title="Firma ve iletişim bilgileri" description="Telefon, e-posta ve WhatsApp bilgileri web sitesinde kullanılır." />
          <CardBody><CompanyForm c={s.company} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Finans" />
          <CardBody>{isOwner ? <BaseCurrencyForm base={s.base} locked={s.baseLocked} /> : <p className="text-sm text-navy-600">Baz para birimi: <strong>{s.base}</strong></p>}</CardBody>
        </Card>
        <Card>
          <CardHeader title="Parola değiştir" description="Parola değiştiğinde diğer cihazlardaki oturumlar kapatılır." />
          <CardBody><PasswordForm policy={passwordPolicy.describe} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Aktif oturumlarım" action={<LogoutOthersForm />} />
          <Table>
            <THead><tr><TH>Cihaz</TH><TH>IP</TH><TH>Açılış</TH><TH>Son etkinlik</TH></tr></THead>
            <TBody>
              {s.sessions.map((x) => (
                <TR key={x.id}>
                  <TD className="max-w-xs truncate text-xs">{x.userAgent || "—"} {x.id === s.admin.sessionId ? <Badge tone="green">Bu oturum</Badge> : null}</TD>
                  <TD className="text-xs">{x.ipAddress}</TD>
                  <TD className="tabular text-xs">{formatDateTime(x.createdAt)}</TD>
                  <TD className="tabular text-xs">{formatDateTime(x.lastSeenAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
        <Card>
          <CardHeader title="Yönetici hesapları" description={isOwner ? "Yalnızca hesap sahibi yönetici ekleyip devre dışı bırakabilir." : undefined} />
          <Table>
            <THead><tr><TH>Ad</TH><TH>E-posta</TH><TH>Rol</TH><TH>Son giriş</TH><TH>Durum</TH><TH /></tr></THead>
            <TBody>
              {s.admins.map((a) => (
                <TR key={a.id}>
                  <TD className="font-medium">{a.name}</TD>
                  <TD className="text-xs">{a.email}</TD>
                  <TD><Badge tone={a.role === "owner" ? "navy" : "gray"}>{a.role === "owner" ? "Sahip" : "Yönetici"}</Badge></TD>
                  <TD className="tabular text-xs">{formatDateTime(a.lastLoginAt)}</TD>
                  <TD>{a.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Devre dışı</Badge>}</TD>
                  <TD className="text-right">
                    {isOwner && a.role !== "owner" ? (
                      <ConfirmAction
                        action={setAdminActiveAction}
                        fields={{ id: a.id, active: a.isActive ? "0" : "1" }}
                        title={a.isActive ? "Hesap devre dışı bırakılsın mı?" : "Hesap etkinleştirilsin mi?"}
                        confirmLabel={a.isActive ? "Devre dışı bırak" : "Etkinleştir"}
                        tone={a.isActive ? "danger" : "primary"}
                        trigger={a.isActive ? "Devre dışı bırak" : "Etkinleştir"}
                      />
                    ) : null}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {isOwner ? <CardBody className="border-t border-navy-100"><NewAdminForm policy={passwordPolicy.describe} /></CardBody> : null}
        </Card>
      </div>
    </>
  );
}
