import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-900 hover:text-slate-600"
          >
            FinanceTracker
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:inline">
              demo@financetracker.app
            </span>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Salir
            </Link>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
