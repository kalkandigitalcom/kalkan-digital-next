"use client";

import { useState } from "react";
import { ActionForm, CheckboxField, FormSection, SelectField, SubmitButton, TextField, TextareaField, useFieldError } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { serviceTypes } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";

export interface PortfolioDefaults {
  id?: string;
  title?: string;
  slug?: string;
  clientName?: string | null;
  category?: string;
  summary?: string | null;
  description?: string | null;
  liveUrl?: string | null;
  year?: number | null;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  imagePath?: string | null;
  logoPath?: string | null;
}

function LogoInput({ current }: { current?: string | null }) {
  const [preview, setPreview] = useState<string | null>(current ? `/media/${current}` : null);
  const error = useFieldError("logo");
  return (
    <div className="sm:col-span-2">
      <label htmlFor="f-logo" className="mb-1.5 block text-xs font-semibold text-navy-700">Marka logosu</label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="grid h-24 w-full max-w-60 place-items-center rounded-lg border border-navy-100 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview ? <img src={preview} alt="Logo önizleme" className="max-h-12 w-auto max-w-full object-contain" /> : <span className="text-xs text-navy-400">Logo yok · sitede marka adı gösterilir</span>}
        </div>
        <div className="space-y-2">
          <input
            id="f-logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : current ? `/media/${current}` : null);
            }}
            className="block text-xs text-navy-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-navy-700 hover:file:bg-navy-100"
          />
          <p className="text-xs text-navy-400">Şeffaf arka planlı PNG veya WebP önerilir · en fazla 5 MB · kenar boşluğu kırpılmış, en az 400 px genişlik</p>
          {current ? <CheckboxField name="removeLogo" label="Mevcut logoyu kaldır" /> : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

function ImageInput({ current }: { current?: string | null }) {
  const [preview, setPreview] = useState<string | null>(current ? `/media/${current}` : null);
  const error = useFieldError("image");
  return (
    <div className="sm:col-span-2">
      <label htmlFor="f-image" className="mb-1.5 block text-xs font-semibold text-navy-700">Kapak görseli</label>
      <p className="mb-2 text-xs text-navy-400">Referans listelerinde gösterilmez; yalnızca proje detay sayfasında ve paylaşım önizlemesinde kullanılır.</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="aspect-[16/10] w-full max-w-60 overflow-hidden rounded-lg border border-navy-100 bg-navy-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview ? <img src={preview} alt="Önizleme" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-xs text-navy-400">Görsel yok</div>}
        </div>
        <div className="space-y-2">
          <input
            id="f-image"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : current ? `/media/${current}` : null);
            }}
            className="block text-xs text-navy-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-navy-700 hover:file:bg-navy-100"
          />
          <p className="text-xs text-navy-400">PNG, JPEG veya WebP · en fazla 5 MB · önerilen 1600×1000</p>
          {current ? <CheckboxField name="removeImage" label="Mevcut görseli kaldır" /> : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function PortfolioForm({ action, defaults, cancelHref }: { action: (s: ActionState, f: FormData) => Promise<ActionState>; defaults: PortfolioDefaults; cancelHref: string }) {
  return (
    <ActionForm action={action} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <FormSection title="Proje vitrini" description="Sadece gerçek, müşteri izni olan çalışmaları yayınlayın. Yayınlanmayan kayıtlar sitede görünmez.">
        <TextField name="title" label="Başlık" required defaultValue={defaults.title ?? ""} className="sm:col-span-2" />
        <TextField name="clientName" label="Müşteri adı (sitede görünür)" defaultValue={defaults.clientName ?? ""} hint="Müşteri izni yoksa boş bırakın. Logo yoksa referanslarda bu ad (yoksa başlık) gösterilir." />
        <SelectField name="category" label="Kategori" options={serviceTypes.list} defaultValue={defaults.category ?? "web_design"} />
        <TextField name="liveUrl" label="Canlı bağlantı" placeholder="https://" defaultValue={defaults.liveUrl ?? ""} />
        <TextField name="year" type="number" label="Yıl" min={2000} max={2100} defaultValue={defaults.year ? String(defaults.year) : ""} />
        <TextareaField name="summary" label="Kısa özet" rows={2} maxLength={400} defaultValue={defaults.summary ?? ""} className="sm:col-span-2" />
        <TextareaField name="description" label="Detaylı açıklama" rows={5} defaultValue={defaults.description ?? ""} className="sm:col-span-2" />
        <TextField name="tags" label="Etiketler" placeholder="Next.js, rezervasyon, SEO" hint="Virgülle ayırın." defaultValue={defaults.tags?.join(", ") ?? ""} className="sm:col-span-2" />
        <LogoInput current={defaults.logoPath} />
        <ImageInput current={defaults.imagePath} />
      </FormSection>
      <FormSection title="Yayın">
        <TextField name="slug" label="URL kısa adı" hint="Boş bırakılırsa başlıktan üretilir." defaultValue={defaults.slug ?? ""} />
        <TextField name="sortOrder" type="number" label="Sıra" min={0} defaultValue={String(defaults.sortOrder ?? 0)} />
        <CheckboxField name="isPublished" label="Sitede yayınla" defaultChecked={defaults.isPublished ?? false} />
        <CheckboxField name="isFeatured" label="Öne çıkan" defaultChecked={defaults.isFeatured ?? false} />
      </FormSection>
      <div className="flex justify-end gap-2 pt-2">
        <LinkButton href={cancelHref} variant="outline">Vazgeç</LinkButton>
        <SubmitButton>{defaults.id ? "Değişiklikleri kaydet" : "Kaydı oluştur"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
