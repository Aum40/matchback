import AuthShell from "@/components/features/auth/AuthShell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Authentication guard and shared shell for Login and Register. */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await auth()) redirect("/discover");

  return <AuthShell>{children}</AuthShell>;
}
