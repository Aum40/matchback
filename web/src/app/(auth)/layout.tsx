import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/** หน้า login / signup: ล็อกอินอยู่แล้วไม่ต้องเห็น พาไปหน้า Discover */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await auth()) redirect("/discover");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
