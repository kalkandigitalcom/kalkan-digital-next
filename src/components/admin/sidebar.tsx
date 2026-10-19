"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  CheckSquare,
  FileText,
  FolderKanban,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/server/actions/auth";

const NAV = [
  { href: "/admin/dashboard", label: "Genel bakış", icon: LayoutDashboard },
  { href: "/admin/customers", label: "Müşteriler", icon: Users },
  { href: "/admin/projects", label: "Projeler", icon: FolderKanban },
  { href: "/admin/transactions", label: "Gelir & gider", icon: Wallet },
  { href: "/admin/recurring", label: "Yenilemeler", icon: CalendarClock },
  { href: "/admin/quotes", label: "Teklifler", icon: FileText },
  { href: "/admin/tasks", label: "Görevler", icon: CheckSquare },
  { href: "/admin/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/admin/portfolio", label: "Portfolyo", icon: Images },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 px-3" aria-label="Yönetim menüsü">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-navy-200 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? "text-brand-400" : "text-navy-300 group-hover:text-navy-100")} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserBox({ name, email }: { name: string; email: string }) {
  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white" aria-hidden>
          {name.slice(0, 1).toLocaleUpperCase("tr-TR")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{name}</p>
          <p className="truncate text-[11px] text-navy-300">{email}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="rounded-md p-1.5 text-navy-300 hover:bg-white/10 hover:text-white" title="Çıkış yap" aria-label="Çıkış yap">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar({ user }: { user: { name: string; email: string } }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close drawer on navigation
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Desktop: narrow fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-navy-900 lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/admin/dashboard" aria-label="Genel bakış">
            <Logo variant="onDark" size="sm" />
          </Link>
        </div>
        <NavLinks />
        <UserBox {...user} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-navy-900 px-4 lg:hidden">
        <Link href="/admin/dashboard" aria-label="Genel bakış">
          <Logo variant="onDark" size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-navy-100 hover:bg-white/10"
          aria-label="Menüyü aç"
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-navy-950/60 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <aside
          id="admin-mobile-nav"
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-navy-900 transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between px-5">
            <Logo variant="onDark" size="sm" />
            <button type="button" onClick={() => setOpen(false)} className="rounded-md p-2 text-navy-100 hover:bg-white/10" aria-label="Menüyü kapat">
              <X className="size-5" />
            </button>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
          <UserBox {...user} />
        </aside>
      </div>
    </>
  );
}
