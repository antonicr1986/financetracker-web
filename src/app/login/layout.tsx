import TopBar from "@/components/TopBar";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-200 dark:bg-slate-950">
      <TopBar />
      {/* Alineado arriba y no centrado: con la cabecera de por medio, centrar
          en vertical dejaba el formulario demasiado bajo. */}
      <div className="flex flex-1 justify-center px-4 pt-10 pb-8 sm:pt-16">
        {children}
      </div>
    </div>
  );
}
