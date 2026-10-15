import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth.action";
import type { Role } from "@/lib/api/api.type";
import Link from "next/link";

const CANDIDATE_NAV = [
  { href: "/discover", label: "Discover" },
  { href: "/saved", label: "Saved" },
  { href: "/applications", label: "Applications" },
  { href: "/profile", label: "Profile" },
];

const RECRUITER_NAV = [
  { href: "/recruiter/jobs", label: "My Jobs" },
  { href: "/recruiter/company", label: "Company Profile" },
];

/** มือถือ: เมนูเลื่อนแนวนอนใต้โลโก้ จอใหญ่: อยู่แถวเดียวกัน */
export default function AppHeader({ name, role }: { name: string; role: Role }) {
  const isRecruiter = role === "RECRUITER";
  const navItems = isRecruiter ? RECRUITER_NAV : CANDIDATE_NAV;
  const homeHref = isRecruiter ? "/recruiter/jobs" : "/discover";

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href={homeHref} className="font-bold tracking-tight">
          MATCHBACK
        </Link>
        <div className="ml-auto flex items-center gap-3 text-sm sm:order-last">
          <span className="text-sm font-medium text-muted-foreground">{name}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
        <nav
          aria-label="Main"
          className="-mx-4 flex w-full gap-1 overflow-x-auto px-4 text-sm sm:mx-0 sm:w-auto sm:px-0"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {/* ซ่อนลิงก์เพื่อความสะดวกเท่านั้น หน้า admin เช็ก role เองอีกชั้น */}
          {role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}