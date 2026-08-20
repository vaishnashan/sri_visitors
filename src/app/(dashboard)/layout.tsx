import Sidebar from "@/components/ui/Sidebar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import PrintButton from "@/components/ui/PrintButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[rgb(10,14,23)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[rgb(17,24,39)] flex items-center justify-between px-6">
          <h1 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Branch Visitor Feedback Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <PrintButton />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
