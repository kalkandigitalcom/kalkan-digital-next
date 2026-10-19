"use client";

import { Receipt } from "lucide-react";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { billAllDueAction, billRecurringAction } from "@/server/actions/recurring";

export function BillButton({ id, periodLabel, periodStart, size = "sm" }: { id: string; periodLabel: string; periodStart: string; size?: "sm" | "md" }) {
  return (
    <ConfirmAction
      action={billRecurringAction}
      fields={{ id, periodStart }}
      tone="primary"
      triggerVariant="secondary"
      triggerSize={size}
      title="Beklenen tahsilat kaydı oluşturulsun mu?"
      description={
        <>
          <strong>{periodLabel}</strong> dönemi için “tahsilat bekliyor” durumunda bir gelir kaydı oluşturulur ve sonraki yenileme tarihi bir periyot ileri alınır. Ödeme alındığında kaydı “tahsil edildi” olarak işaretleyin. Aynı dönem ikinci kez faturalandırılamaz.
        </>
      }
      confirmLabel="Kaydı oluştur"
      trigger={<><Receipt className="size-3.5" /> Tahsilat kaydı</>}
    />
  );
}

export function BillAllButton() {
  return (
    <ConfirmAction
      action={billAllDueAction}
      fields={{}}
      tone="primary"
      triggerVariant="outline"
      triggerSize="md"
      title="Vadesi gelen tüm dönemler faturalandırılsın mı?"
      description="Aktif hizmetlerden yenileme tarihi bugün veya daha önce olan her dönem için bekleyen tahsilat kaydı oluşturulur. Daha önce faturalandırılmış dönemler atlanır."
      confirmLabel="Oluştur"
      trigger={<><Receipt className="size-4" /> Vadesi gelenleri oluştur</>}
    />
  );
}
