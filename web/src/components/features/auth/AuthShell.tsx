"use client";

import AuthMotion from "@/components/features/auth/AuthMotion";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AuthShell({ children }: { children: ReactNode }) {
  const isRegister = usePathname() === "/signup";
  const formOrder = isRegister
    ? "lg:order-2 lg:border-l"
    : "lg:order-1 lg:border-r";
  const visualOrder = isRegister ? "lg:order-1" : "lg:order-2";

  return (
    <main className="auth-page min-h-dvh overflow-hidden bg-background">
      <div className="mx-auto grid min-h-dvh w-full max-w-[1440px] lg:grid-cols-[minmax(560px,0.95fr)_minmax(0,1.05fr)]">
        <section
          className={`relative flex min-h-dvh flex-col justify-center border-border/70 bg-background px-4 py-7 sm:px-8 lg:py-10 xl:px-16 ${formOrder}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_5%,color-mix(in_oklch,var(--brand-soft)_72%,transparent),transparent_32%),linear-gradient(145deg,transparent_45%,color-mix(in_oklch,var(--brand-soft)_28%,transparent))]" />
          <div className="relative mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center">
            <div className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand text-brand-foreground shadow-lg shadow-brand/15">
                  <Leaf aria-hidden="true" className="size-5" />
                </span>
                <span className="text-lg font-bold tracking-[-0.04em] text-navy">MATCHBACK</span>
              </Link>
              <span className="hidden text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:block">
                {isRegister ? "Start with context" : "Make a better match"}
              </span>
            </div>
            <AuthMotion>{children}</AuthMotion>
            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground sm:mt-6">
              {isRegister
                ? "A clearer profile makes better conversations possible."
                : "Your next move starts with the right context."}
            </p>
          </div>
        </section>

        <section
          className={`auth-copy-in relative hidden min-h-dvh overflow-hidden bg-navy text-background lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16 ${visualOrder}`}
        >
          <div aria-hidden="true" className="auth-visual-grid pointer-events-none absolute inset-0" />
          <div
            aria-hidden="true"
            className={`auth-visual-glow auth-visual-glow--top pointer-events-none absolute -top-32 size-[34rem] rounded-full ${isRegister ? "-left-32" : "-right-32"}`}
          />
          <div
            aria-hidden="true"
            className={`auth-visual-glow auth-visual-glow--bottom pointer-events-none absolute -bottom-40 size-[30rem] rounded-full ${isRegister ? "-right-40" : "-left-40"}`}
          />
          <div
            aria-hidden="true"
            className={`auth-visual-orbit pointer-events-none absolute top-[18%] size-[28rem] rounded-full border border-brand/25 ${isRegister ? "left-[8%]" : "right-[8%]"}`}
          />
          <div
            aria-hidden="true"
            className={`auth-visual-orbit auth-visual-orbit--inner pointer-events-none absolute top-[30%] size-[16rem] rounded-full border border-highlight/20 ${isRegister ? "left-[18%]" : "right-[18%]"}`}
          />

          <div className="relative flex items-center justify-between gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-background/45">
              MATCHBACK / WORKSPACE
            </span>
            <span className="rounded-full border border-background/15 px-3 py-1.5 text-[11px] font-medium text-background/60">
              {isRegister ? "Build your profile" : "Candidate first"}
            </span>
          </div>

          {isRegister ? (
            <div className="relative max-w-2xl py-12 xl:py-16">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-highlight">
                Start with your story
              </p>
              <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] xl:text-[4.6rem]">
                Let the right work find more of you.
              </h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-background/65">
                Bring your skills, goals, and working style into one clear profile before you start exploring.
              </p>

              <div className="auth-visual-card mt-12 max-w-md rounded-[1.5rem] border border-background/12 bg-background/[0.08] p-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-background/45">
                      PROFILE FOUNDATION
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight">Make your next step visible</p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-highlight text-highlight-foreground">
                    <Leaf aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Skills", "Experience", "Direction"].map((label) => (
                    <span key={label} className="rounded-full border border-background/15 px-3 py-1.5 text-xs text-background/65">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative max-w-2xl py-12 xl:py-16">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-highlight">
                Work with more context
              </p>
              <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] xl:text-[4.6rem]">
                Find a better fit for what comes next.
              </h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-background/65">
                Match your skills, goals, and working style with opportunities that make sense for you.
              </p>

              <div className="auth-visual-card mt-12 max-w-md rounded-[1.5rem] border border-background/12 bg-background/[0.08] p-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-background/45">
                      PROFILE FIT
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight">A clearer next step</p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-brand text-brand-foreground">
                    <Leaf aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <div className="mt-6 space-y-3">
                  {["Skills", "Goals", "Working style"].map((label, index) => (
                    <div key={label} className="flex items-center gap-3 text-sm text-background/60">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-background/10">
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${82 - index * 12}%` }} />
                      </span>
                      <span className="w-24">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-between gap-6 text-sm text-background/40">
            <span>{isRegister ? "Your story is part of the match." : "Thoughtful work starts with context."}</span>
            <span className="h-px w-20 bg-background/20" />
          </div>
        </section>
      </div>
    </main>
  );
}
