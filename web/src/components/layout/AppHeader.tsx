import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth.action";
import type { Role } from "@/lib/api/api.type";
import {
  BriefcaseBusiness,
  FileText,
  Heart,
  Leaf,
  ShieldCheck,
  UserRound,
  Bookmark,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const NAV: Record<Role, { href: string; label: string; icon: LucideIcon }[]> = {
  USER: [
    { href: "/discover", label: "Discover", icon: Leaf },
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: "/applications", label: "Applications", icon: FileText },
    { href: "/profile", label: "Profile", icon: UserRound },
  ],
  RECRUITER: [
    { href: "/recruiter/jobs", label: "Jobs", icon: BriefcaseBusiness },
    { href: "/recruiter/company", label: "Company", icon: ShieldCheck },
    { href: "/analytics", label: "Analytics", icon: Heart },
  ],
  ADMIN: [
    { href: "/admin", label: "Admin", icon: ShieldCheck },
  ],
};

/** Desktop = sidebar, mobile = compact top bar with horizontal navigation. */
export default function AppHeader({ name, role }: { name: string; role: Role }) {
  const items = NAV[role];
  const homeHref = role === "RECRUITER" ? "/recruiter/jobs" : role === "ADMIN" ? "/admin" : "/discover";

  return (
    <>
      <aside className="hidden border-r border-border/80 bg-card/80 lg:flex lg:min-h-dvh lg:flex-col">
        <div className="flex min-h-dvh flex-col px-5 py-7">
          <Link href={homeHref} className="flex items-center gap-3 px-2">
            <span className="grid size-10 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-sm">
              <Leaf aria-hidden="true" className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-[-0.03em] text-navy">MATCHBACK</span>
          </Link>

          <nav aria-label="Main" className="mt-12 space-y-2">
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-muted-foreground transition hover:bg-brand-soft hover:text-navy"
              >
                <Icon aria-hidden="true" className="size-5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-navy text-sm font-bold text-background">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{name}</p>
                <p className="text-xs text-muted-foreground">{role.toLowerCase()}</p>
              </div>
            </div>
            <form action={logoutAction} className="mt-4">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <header className="border-b border-border/80 bg-card lg:hidden">
        <div className="flex items-center gap-3 px-5 py-4">
          <Link href={homeHref} className="flex items-center gap-2 font-bold tracking-[-0.03em] text-navy">
            <span className="grid size-8 place-items-center rounded-xl bg-brand text-brand-foreground">
              <Leaf aria-hidden="true" className="size-4" />
            </span>
            MATCHBACK
          </Link>
          <span
            className="ml-auto grid size-8 place-items-center rounded-full bg-navy text-xs font-bold text-background"
            title={name}
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          {/* sidebar ที่มีปุ่ม Log out ซ่อนบนมือถือ — ไม่มีปุ่มนี้ = ออกจากระบบไม่ได้ */}
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </div>
        <nav aria-label="Mobile main" className="flex gap-1 overflow-x-auto px-5 pb-3 text-sm">
          {items.map(({ href, label }) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:bg-brand-soft hover:text-navy">
              {label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
