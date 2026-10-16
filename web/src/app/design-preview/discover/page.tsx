import {
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  Heart,
  Leaf,
  MapPin,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Discover preview" };

const NAV_ITEMS = ["Discover", "Saved", "Applications", "Matches", "Profile"];

const DEMO_JOB = {
  company: "Gendee Corporation Co., Ltd.",
  description:
    "Build thoughtful frontend experiences with a product team working across design, APIs, and accessible interfaces.",
  employment: "Full-time",
  location: "Bangkok",
  salary: "22,000-28,000 THB",
  title: "Frontend Developer",
  workArrangement: "On-site",
};

const FIT_SKILLS = [
  { label: "TypeScript", score: 100, tone: "bg-brand" },
  { label: "HTML / CSS", score: 90, tone: "bg-brand" },
  { label: "React", score: 80, tone: "bg-brand" },
  { label: "Angular", score: 40, tone: "bg-highlight" },
];

function PreviewNav() {
  return (
    <aside className="hidden border-r border-border/80 bg-card/80 px-5 py-7 lg:flex lg:min-h-dvh lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-sm">
          <Leaf aria-hidden="true" className="size-5" />
        </span>
        <span className="text-lg font-bold tracking-[-0.03em] text-navy">MATCHBACK</span>
      </div>

      <nav aria-label="Preview navigation" className="mt-12 space-y-2">
        {NAV_ITEMS.map((item, index) => (
          <div
            key={item}
            className={
              index === 0
                ? "flex items-center gap-3 rounded-2xl bg-brand-soft px-4 py-3 font-semibold text-navy"
                : "flex items-center gap-3 rounded-2xl px-4 py-3 text-muted-foreground"
            }
          >
            {index === 0 && <Leaf aria-hidden="true" className="size-5 text-brand" />}
            {index === 1 && <Bookmark aria-hidden="true" className="size-5" />}
            {index === 2 && <WalletCards aria-hidden="true" className="size-5" />}
            {index === 3 && <Heart aria-hidden="true" className="size-5" />}
            {index === 4 && <UserRound aria-hidden="true" className="size-5" />}
            <span>{item}</span>
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-2 text-navy">
          <Sparkles aria-hidden="true" className="size-5 text-brand" />
          <span className="font-semibold">AI Coach</span>
          <span className="rounded-full bg-highlight px-2 py-0.5 text-xs font-semibold text-highlight-foreground">
            New
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Turn your profile strengths into clearer application evidence.
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          Explore coach <ArrowUpRight aria-hidden="true" className="size-4" />
        </span>
      </div>
    </aside>
  );
}

function DemoJobCard() {
  return (
    <div className="relative isolate mx-auto w-full max-w-2xl pb-3">
      <div aria-hidden="true" className="absolute inset-x-5 top-6 h-full rounded-3xl border border-border/70 bg-card/70 shadow-sm" />
      <div aria-hidden="true" className="absolute inset-x-2 top-3 h-full rounded-3xl border border-border/80 bg-card/85 shadow-sm" />

      <article className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-navy/10">
        <div
          aria-hidden="true"
          className="relative h-40 overflow-hidden bg-brand-soft"
          style={{
            background:
              "radial-gradient(circle at 18% 22%, var(--highlight), transparent 32%), radial-gradient(circle at 82% 12%, color-mix(in oklch, var(--brand) 45%, transparent), transparent 44%), linear-gradient(135deg, var(--brand-soft), var(--background))",
          }}
        >
          <div className="absolute -right-8 -top-16 size-56 rounded-full border-[24px] border-card/40" />
          <div className="absolute -bottom-24 left-1/4 size-64 rounded-full border-[30px] border-brand/20" />
          <div className="absolute left-6 top-6 rounded-full bg-card/80 px-3 py-1 text-xs font-semibold text-navy shadow-sm">
            Demo data
          </div>
          <button
            type="button"
            aria-label="Save demo job"
            className="absolute right-6 top-5 grid size-11 place-items-center rounded-full bg-card text-navy shadow-sm transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Bookmark aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <header className="flex items-start gap-5">
            <div className="min-w-0 flex-1">
              <h2 className="text-3xl font-bold tracking-[-0.04em] text-navy sm:text-4xl">
                {DEMO_JOB.title}
              </h2>
              <p className="mt-2 text-base font-medium text-muted-foreground">{DEMO_JOB.company}</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-brand-soft px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Profile Fit</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-navy">92</p>
              <p className="text-xs font-medium text-muted-foreground">out of 100</p>
            </div>
          </header>

          <dl className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness aria-hidden="true" className="size-4 text-brand" />
              <dt className="sr-only">Employment</dt>
              <dd>{DEMO_JOB.employment}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 text-brand" />
              <dt className="sr-only">Location</dt>
              <dd>{DEMO_JOB.location}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Building2Icon />
              <dt className="sr-only">Work arrangement</dt>
              <dd>{DEMO_JOB.workArrangement}</dd>
            </div>
          </dl>

          <p className="border-y border-border py-5 leading-7 text-muted-foreground">{DEMO_JOB.description}</p>

          <section aria-labelledby="demo-skills-title">
            <h3 id="demo-skills-title" className="text-sm font-semibold text-navy">
              Key skills
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {["TypeScript", "HTML / CSS", "React", "Angular"].map((skill) => (
                <li key={skill} className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-medium text-navy">
                  {skill}
                </li>
              ))}
            </ul>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
            <div className="flex items-center gap-2 font-semibold text-navy">
              <WalletCards aria-hidden="true" className="size-5 text-brand" />
              <span>{DEMO_JOB.salary}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
              View job details <ArrowUpRight aria-hidden="true" className="size-4" />
            </span>
          </footer>
        </div>
      </article>
    </div>
  );
}

function Building2Icon() {
  return <span aria-hidden="true" className="grid size-4 grid-cols-3 items-end gap-0.5 text-brand">
    <span className="col-span-2 h-3 rounded-t-sm bg-current" />
    <span className="h-4 rounded-t-sm bg-current" />
  </span>;
}

function FitInsight() {
  return (
    <aside className="rounded-3xl border border-border bg-card p-6 shadow-lg shadow-navy/5 lg:sticky lg:top-8">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="font-bold tracking-[-0.02em] text-navy">Fit Insight</h2>
          <p className="text-xs text-muted-foreground">Demo explanation</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-brand-soft p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
          <div>
            <h3 className="font-semibold text-navy">Strong profile alignment</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your listed frontend skills align with the core requirements for this demo job.
            </p>
          </div>
        </div>
      </div>

      <section aria-labelledby="skill-match-title" className="mt-7">
        <div className="flex items-center justify-between">
          <h3 id="skill-match-title" className="font-semibold text-navy">Skill match</h3>
          <span className="text-xs text-muted-foreground">Profile evidence</span>
        </div>
        <ul className="mt-5 space-y-4">
          {FIT_SKILLS.map((skill) => (
            <li key={skill.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-navy">{skill.label}</span>
                <span className="tabular-nums text-muted-foreground">{skill.score} / 100</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted" aria-hidden="true">
                <div className={`h-full rounded-full ${skill.tone}`} style={{ width: `${skill.score}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-7 flex items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
        <p>Scores describe profile fit. They are not a hiring probability or a mutual match.</p>
      </div>
    </aside>
  );
}

export default function DiscoverDesignPreview() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto grid min-h-dvh max-w-[1600px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <PreviewNav />

        <main className="min-w-0 px-5 py-6 sm:px-8 sm:py-8 xl:px-12 xl:py-10">
          <div className="mx-auto max-w-6xl">
            <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Candidate preview</p>
                <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-navy sm:text-5xl">Discover jobs</h1>
                <p className="mt-3 max-w-xl text-base text-muted-foreground">Find work that fits your skills and see the evidence behind the score.</p>
              </div>
              <div className="flex items-center gap-3 self-start rounded-full border border-border bg-card px-3 py-2 sm:self-auto">
                <span className="grid size-9 place-items-center rounded-full bg-navy text-sm font-bold text-background">P</span>
                <span className="text-sm font-semibold text-navy">Pure</span>
                <span aria-label="Online" className="size-2 rounded-full bg-brand" />
              </div>
            </header>

            <nav aria-label="Mobile preview navigation" className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {NAV_ITEMS.map((item, index) => (
                <span
                  key={item}
                  className={
                    index === 0
                      ? "whitespace-nowrap rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-navy"
                      : "whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground"
                  }
                >
                  {item}
                </span>
              ))}
            </nav>

            <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
              <section aria-labelledby="demo-card-title" className="min-w-0">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 id="demo-card-title" className="text-lg font-semibold text-navy">Your next opportunity</h2>
                    <p className="mt-1 text-sm text-muted-foreground">A text-first card built for swipe, touch, and keyboard review.</p>
                  </div>
                  <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">1 demo job</span>
                </div>

                <DemoJobCard />

                <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-5">
                  <button type="button" className="grid size-16 place-items-center rounded-full border-2 border-skip bg-card text-skip shadow-sm transition hover:bg-skip/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" aria-label="Pass on this job">
                    <X aria-hidden="true" className="size-7" />
                  </button>
                  <button type="button" className="grid size-20 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/25 transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" aria-label="Like this job">
                    <Heart aria-hidden="true" className="size-8 fill-current" />
                  </button>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">Pass or Like - keyboard alternatives: Left and Right</p>
              </section>

              <FitInsight />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
