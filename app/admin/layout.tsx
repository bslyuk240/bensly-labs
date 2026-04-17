"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, SessionProvider } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "apps" | "analytics" | "settings";
};

const navItems: NavItem[] = [
  { href: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/apps", icon: "apps", label: "App Manager" },
  { href: "/admin/analytics", icon: "analytics", label: "Analytics" },
  { href: "/admin/settings", icon: "settings", label: "Settings" },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`inline-flex overflow-hidden rounded-2xl shadow-[0_10px_24px_rgba(79,70,229,0.12)] ${compact ? "h-9 w-9" : "h-10 w-10"}`}>
      <img src="/512x512.png" alt="Bensly Labs" className="h-full w-full object-cover" />
    </span>
  );
}

function NavGlyph({ name }: { name: NavItem["icon"] }) {
  const common = "h-5 w-5";

  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case "apps":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "analytics":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19V5" strokeLinecap="round" />
          <path d="M4 19h16" strokeLinecap="round" />
          <rect x="7" y="12" width="3" height="7" rx="1" />
          <rect x="12" y="9" width="3" height="10" rx="1" />
          <rect x="17" y="6" width="3" height="13" rx="1" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a7.8 7.8 0 0 0 .1-2 7.8 7.8 0 0 0-.1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 3h-6l-.3 3a8 8 0 0 0-1.7 1l-2.4-1-2 3.5L4.6 11a7.8 7.8 0 0 0-.1 2 7.8 7.8 0 0 0 .1 2L2.6 16.5l2 3.5 2.4-1a8 8 0 0 0 1.7 1L9 21h6l.3-3a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z" />
        </svg>
      );
  }
}

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 flex-col space-y-1 bg-slate-950 p-4 text-indigo-500">
      <div className="mb-8 flex items-center gap-3 px-4 pt-2 text-xl font-bold text-indigo-400">
        <BrandMark />
        <span className="font-sans tracking-tight">Bensly Labs</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-500/10 text-indigo-400 translate-x-1"
                  : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
              }`}
            >
              <NavGlyph name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/50 pt-6">
        <div className="mb-2 flex items-center gap-3 px-4 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20">
            <span className="text-sm font-bold text-indigo-400">A</span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200">Admin</div>
            <div className="text-xs text-slate-500">Platform Admin</div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 12H4" strokeLinecap="round" />
            <path d="M20 4v16" strokeLinecap="round" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function AdminTopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-slate-900/80 px-6 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <BrandMark compact />
        <h1 className="text-xl font-bold tracking-tight text-indigo-400">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-indigo-500/30 bg-indigo-500/20">
          <span className="text-sm font-bold text-indigo-400">A</span>
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-3xl border-t border-indigo-500/10 bg-slate-900/90 px-4 pb-8 pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:hidden backdrop-blur-md">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all ${
              active ? "scale-110 text-emerald-400" : "text-slate-500"
            }`}
          >
            <NavGlyph name={item.icon} />
            <span className="text-[10px] uppercase tracking-widest">{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  if (pathname === "/admin/login") {
    return <SessionProvider>{children}</SessionProvider>;
  }

  const currentNav = navItems.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  const pageTitle = currentNav?.label || "Dashboard";

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <AdminSidebar />
        <main className="min-w-0 flex-1 flex-col">
          <AdminTopBar title={pageTitle} />
          <div className="flex-1 overflow-auto pb-24 md:pb-0">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </SessionProvider>
  );
}
