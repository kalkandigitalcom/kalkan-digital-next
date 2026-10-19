import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CheckSquare, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { listTasks } from "@/server/services/tasks";
import { customerOptions } from "@/server/services/customers";
import { deleteTaskAction } from "@/server/actions/tasks";
import { flatParams, type SearchParams } from "@/server/list";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, OptionBadge } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { taskPriorities, taskStatuses } from "@/lib/labels";
import { formatDateTime } from "@/lib/dates";
import { DoneToggle } from "./done-toggle";

export const metadata: Metadata = { title: "Görevler" };
const BASE = "/admin/tasks";

export default async function TasksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const [{ rows, total, page, pageSize, now }, customers] = await Promise.all([listTasks(params), customerOptions()]);
  return (
    <>
      <PageHeader title="Görevler ve hatırlatmalar" description="Hatırlatmalar panelde gösterilir; e-posta/bildirim entegrasyonu henüz yapılandırılmamıştır." actions={<LinkButton href={`${BASE}/new`}><Plus className="size-4" /> Yeni görev</LinkButton>} />
      <Card>
        <FilterBar basePath={BASE} params={params} searchPlaceholder="Görev ara…">
          <FilterSelect name="status" label="Durum" value={params.status} allLabel={null} options={[{ value: "open", label: "Açık görevler" }, ...taskStatuses.list, { value: "all", label: "Tümü" }]} />
          <FilterSelect name="due" label="Son tarih" value={params.due} options={[{ value: "overdue", label: "Gecikmiş" }, { value: "today", label: "Bugün ve öncesi" }, { value: "week", label: "7 gün içinde" }, { value: "none", label: "Tarihsiz" }]} />
          <FilterSelect name="priority" label="Öncelik" value={params.priority} options={taskPriorities.list} />
          <FilterSelect name="customerId" label="Müşteri" value={params.customerId} options={customers} />
          <FilterSelect name="sort" label="Sıralama" value={params.sort} allLabel={null} options={[{ value: "due", label: "Son tarihe göre" }, { value: "priority", label: "Önceliğe göre" }, { value: "created", label: "Oluşturulmaya göre" }]} />
        </FilterBar>
        {rows.length === 0 ? (
          <EmptyState icon={CheckSquare} title="Görev bulunamadı" action={<LinkButton href={`${BASE}/new`} size="sm"><Plus className="size-4" /> Yeni görev</LinkButton>} />
        ) : (
          <>
            <ul className="divide-y divide-navy-100">
              {rows.map((t) => {
                const open = t.status === "todo" || t.status === "in_progress";
                const overdue = open && t.dueAt && t.dueAt < now;
                const remind = open && t.remindAt && t.remindAt <= now;
                return (
                  <li key={t.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                    <div className="pt-0.5"><DoneToggle id={t.id} done={t.status === "done"} title={t.title} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`${BASE}/${t.id}/edit`} className={`text-sm font-semibold hover:text-brand-600 ${t.status === "done" ? "text-navy-400 line-through" : "text-navy-900"}`}>{t.title}</Link>
                        <OptionBadge value={t.priority} options={taskPriorities} />
                        {t.status === "in_progress" || t.status === "cancelled" ? <OptionBadge value={t.status} options={taskStatuses} /> : null}
                        {remind ? <Badge tone="violet"><BellRing className="size-3" /> Hatırlatma zamanı</Badge> : null}
                      </div>
                      {t.description ? <p className="mt-0.5 line-clamp-1 text-xs text-navy-500">{t.description}</p> : null}
                      <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-navy-400">
                        {t.customerId ? <Link href={`/admin/customers/${t.customerId}`} className="hover:text-brand-600">{t.customerName}</Link> : null}
                        {t.projectId ? <Link href={`/admin/projects/${t.projectId}`} className="hover:text-brand-600">{t.projectName}</Link> : null}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p className={`tabular ${overdue ? "font-semibold text-red-600" : "text-navy-600"}`}>{t.dueAt ? formatDateTime(t.dueAt) : "Tarihsiz"}</p>
                      {overdue ? <p className="text-red-600">Gecikti</p> : null}
                      <div className="mt-1">
                        <ConfirmAction action={deleteTaskAction} fields={{ id: t.id }} title="Görev silinsin mi?" confirmLabel="Sil" triggerVariant="ghost" trigger={<><Trash2 className="size-3.5" aria-hidden /><span className="sr-only">Görevi sil</span></>} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination page={page} pageSize={pageSize} total={total} params={params} basePath={BASE} />
          </>
        )}
      </Card>
    </>
  );
}
