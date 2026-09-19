import AuthShell from "@/components/AuthShell";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
