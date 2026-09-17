import TopBar from "@/components/TopBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950">
      <TopBar />
      {children}
    </div>
  );
}
