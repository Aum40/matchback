import { buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import type { MutualMatch } from "@/lib/api/api.type";
import { MatchesApi } from "@/lib/api/matches.api";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Matches" };

export default async function MatchesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "RECRUITER") redirect("/recruiter/jobs");
  if (session.user.role === "ADMIN") redirect("/admin");

  let matches: MutualMatch[];
  try {
    matches = await MatchesApi.findAll(session.user.access_token);
  } catch (error) {
    if (error instanceof ApiError && error.code === "MATCH_NOT_FOUND") matches = [];
    else throw error;
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-border/80 pb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Confirmed connections</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-navy">Matches</h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          Jobs where you and the recruiter have both chosen Like.
        </p>
      </header>

      {matches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="font-semibold text-navy">No mutual matches yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A match appears when a company Likes you back for the same job.
          </p>
          <Link href="/discover" className={`${buttonVariants()} mt-6`}>
            Discover jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: MutualMatch }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-navy/5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">Mutual match</span>
        {match.job.isDemo && <span className="text-xs font-medium text-muted-foreground">Demo data</span>}
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-[-0.03em] text-navy group-hover:text-brand">
        {match.job.title}
      </h2>
      <p className="mt-2 text-sm font-medium text-muted-foreground">{match.job.company}</p>
      <p className="mt-5 text-sm text-muted-foreground">Contact unlocked after mutual match confirmation.</p>
    </Link>
  );
}
