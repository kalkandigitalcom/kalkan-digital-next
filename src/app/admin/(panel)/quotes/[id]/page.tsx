import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CheckCircle2, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { findCustomerMatches, getQuoteDetail } from "@/server/services/quotes";
import { customerOptions } from "@/server/services/customers";
import { deleteQuoteAction, deleteQuoteItemAction } from "@/server/actions/quotes";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Badge, OptionBadge } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { DetailList } from "@/components/admin/stat";
import { Money } from "@/components/admin/money";
import { quoteSources, quoteStatuses, serviceTypes } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/dates";
import { mulMoney } from "@/lib/money";
import { ConvertForm, ItemForm, StatusForm } from "./quote-client";

export const metadata: Metadata = { title: "Teklif detayı" };

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const q = await getQuoteDetail(id);
  if (!q) notFound();
  const converted = Boolean(q.convertedProjectId);
  const [customers, matches] = converted
    ? [[], []]
    : await Promise.all([customerOptions(q.customerId), findCustomerMatches({ companyName: q.companyName, email: q.email, phone: q.phone })]);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/quotes", label: "Teklifler" }}
        title={<span className="flex flex-wrap items-center gap-2">{q.companyName} <OptionBadge value={q.status} options={quoteStatuses} /></span>}
        description={q.title ?? serviceTypes.label(q.requestedService)}
        actions={
          <>
            <LinkButton href={`/admin/quotes/${q.id}/edit`} variant="outline" size="sm"><Pencil className="size-3.5" /> Düzenle</LinkButton>
            {!converted ? (
              <ConfirmAction action={deleteQuoteAction} fields={{ id: q.id }} title="Teklif silinsin mi?" description="Teklif ve kalemleri kalıcı olarak silinir." confirmLabel="Sil" trigger={<><Trash2 className="size-3.5" /> Sil</>} redirectTo="/admin/quotes?flash=deleted" />
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader title="İletişim ve teklif bilgileri" />
            <CardBody className="py-2">
              <DetailList
                items={[
                  { label: "Yetkili", value: q.contactName },
                  { label: "Telefon", value: q.phone ? <a href={`tel:${q.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-brand-600 hover:underline"><Phone className="size-3" />{q.phone}</a> : null },
                  { label: "E-posta", value: q.email ? <a href={`mailto:${q.email}`} className="inline-flex items-center gap-1 text-brand-600 hover:underline"><Mail className="size-3" />{q.email}</a> : null },
                  { label: "Müşteri kaydı", value: q.customer ? <Link href={`/admin/customers/${q.customer.id}`} className="text-brand-600 hover:underline">{q.customer.companyName}</Link> : "Henüz müşteri değil" },
                  { label: "İstenen hizmet", value: serviceTypes.label(q.requestedService) },
                  { label: "Tahmini tutar", value: <Money value={q.estimatedAmount} currency={q.currency} /> },
                  { label: "Teklif tarihi", value: formatDate(q.quoteDate) },
                  { label: "Sonraki takip", value: formatDate(q.nextFollowUpDate) },
                  { label: "Kaynak", value: <Badge tone={q.source === "website_form" ? "blue" : "gray"}>{quoteSources.label(q.source)}</Badge> },
                  { label: "Kayıt", value: formatDateTime(q.createdAt) },
                ]}
              />
            </CardBody>
          </Card>
          {q.message || q.notes || q.lostReason ? (
            <Card>
              <CardHeader title="Mesaj ve notlar" />
              <CardBody className="space-y-3 text-sm">
                {q.message ? <div><p className="mb-1 text-xs font-semibold text-navy-500">Web formu mesajı</p><p className="whitespace-pre-line rounded-lg bg-navy-50 p-3 text-navy-800">{q.message}</p></div> : null}
                {q.notes ? <p className="whitespace-pre-line text-navy-700">{q.notes}</p> : null}
                {q.lostReason ? <p className="rounded-lg bg-red-50 p-3 text-red-800"><span className="font-semibold">Kaybedilme nedeni:</span> {q.lostReason}</p> : null}
              </CardBody>
            </Card>
          ) : null}
        </div>
        <div className="space-y-6 xl:col-span-2">
          {converted ? (
            <Card className="border-emerald-200">
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 className="size-5" /> Teklif kazanıldı ve projeye dönüştürüldü.</p>
                {q.project ? <LinkButton href={`/admin/projects/${q.project.id}`} size="sm">Projeye git: {q.project.name}</LinkButton> : <span className="text-xs text-navy-500">Proje silinmiş.</span>}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Takip durumu" />
              <CardBody><StatusForm id={q.id} status={q.status} nextFollowUpDate={q.nextFollowUpDate} /></CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Teklif kalemleri" description={q.itemsTotal ? undefined : "Kalem eklemek isteğe bağlıdır."} action={q.itemsTotal ? <span className="text-sm font-semibold">Toplam: <Money value={q.itemsTotal} currency={q.currency} /></span> : null} />
            {q.items.length > 0 ? (
              <Table>
                <THead><tr><TH>Kalem</TH><TH className="text-right">Miktar</TH><TH className="text-right">Birim fiyat</TH><TH className="text-right">Tutar</TH><TH /></tr></THead>
                <TBody>
                  {q.items.map((i) => (
                    <TR key={i.id}>
                      <TD>{i.description}</TD>
                      <TD className="tabular text-right">{Number(i.quantity).toLocaleString("tr-TR")}</TD>
                      <TD className="text-right"><Money value={i.unitPrice} currency={q.currency} /></TD>
                      <TD className="text-right font-medium"><Money value={mulMoney(i.unitPrice, i.quantity)} currency={q.currency} /></TD>
                      <TD className="text-right">
                        {!converted ? <ConfirmAction action={deleteQuoteItemAction} fields={{ id: i.id }} title="Kalem silinsin mi?" confirmLabel="Sil" triggerVariant="ghost" trigger={<><Trash2 className="size-3.5" aria-hidden /><span className="sr-only">Kalemi sil</span></>} /> : null}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : null}
            {!converted ? <CardBody className="border-t border-navy-100"><ItemForm quoteId={q.id} /></CardBody> : null}
          </Card>

          {!converted && q.status !== "lost" ? (
            <Card>
              <CardHeader title="Teklif kabul edildi mi?" description="Müşteri ve proje kaydını tek adımda oluşturun." />
              <CardBody>
                <ConvertForm
                  quoteId={q.id}
                  customers={customers}
                  matches={matches}
                  preselectedCustomerId={q.customerId}
                  defaults={{
                    projectName: q.title ?? `${q.companyName} – ${serviceTypes.label(q.requestedService ?? "web_design")}`,
                    projectType: q.requestedService ?? "web_design",
                    agreedAmount: q.estimatedAmount?.replace(".", ",") ?? "",
                    currency: q.currency,
                  }}
                />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
