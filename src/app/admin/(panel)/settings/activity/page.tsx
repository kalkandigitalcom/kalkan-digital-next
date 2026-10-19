import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { listActivity } from "@/server/services/settings";
import { flatParams, type SearchParams } from "@/server/list";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/dates";

export const metadata: Metadata = { title: "İşlem geçmişi" };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const { rows, total, page, pageSize } = await listActivity(params);
  return (
    <>
      <PageHeader title="İşlem geçmişi" description="Güvenlik ve denetim kaydı. Silinen finansal kayıtların bir kopyası burada saklanır." back={{ href: "/admin/settings", label: "Ayarlar" }} />
      <Card>
        <Table>
          <THead><tr><TH>Zaman</TH><TH>Kullanıcı</TH><TH>İşlem</TH><TH>Özet</TH><TH>IP</TH></tr></THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="tabular whitespace-nowrap text-xs">{formatDateTime(r.createdAt)}</TD>
                <TD className="text-xs">{r.userName ?? "—"}</TD>
                <TD><Badge tone={r.action.includes("failed") || r.action.includes("rate_limited") || r.action.endsWith("delete") ? "red" : "gray"}>{r.action}</Badge></TD>
                <TD className="max-w-md truncate text-xs">{r.summary ?? ""}</TD>
                <TD className="text-xs text-navy-400">{r.ipAddress}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Pagination page={page} pageSize={pageSize} total={total} params={params} basePath="/admin/settings/activity" />
      </Card>
    </>
  );
}
