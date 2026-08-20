"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV = [
  { href: "/overview", label: "Overview", icon: "📊" },
  { href: "/visitors", label: "Visitors", icon: "👥" },
  { href: "/feedback", label: "Feedback", icon: "⭐" },
  { href: "/yearly-comparison", label: "Yearly Comparison", icon: "📈" },
  { href: "/manage-data", label: "Manage Data", icon: "🛠️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="no-print w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200 dark:border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
          B
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-tight">Branch Dashboard</p>
          <p className="text-[11px] text-slate-400">Visitor &amp; Feedback Analytics</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800">
        {session ? (
          <button
            onClick={() => signOut({ callbackUrl: "/overview" })}
            className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            🚪 Sign out
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            🔐 Admin login
          </Link>
        )}
      </div>
    </aside>
  );
}
