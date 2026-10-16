"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeartHandshake, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function MatchModal({
  open,
  matchId,
  title,
  subtitle,
  primaryHref,
  onClose,
}: {
  open: boolean;
  matchId: string | null;
  title: string;
  subtitle: string;
  primaryHref: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !matchId) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-modal-title"
        data-match-id={matchId}
        className="relative w-full max-w-md rounded-3xl border border-border bg-card p-7 text-card-foreground shadow-2xl"
      >
        <button
          type="button"
          aria-label="Close match dialog"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <div className="grid size-14 place-items-center rounded-2xl bg-brand text-brand-foreground">
          <HeartHandshake aria-hidden="true" className="size-7" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-brand">Mutual match confirmed</p>
        <h2 id="match-modal-title" className="mt-2 text-3xl font-bold tracking-[-0.04em] text-navy">
          {title}
        </h2>
        <p className="mt-3 leading-7 text-muted-foreground">{subtitle}</p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={primaryHref} className={cn(buttonVariants({ size: "lg" }), "flex-1") }>
            View match
          </Link>
          <Button type="button" variant="outline" onClick={onClose}>
            Keep exploring
          </Button>
        </div>
      </section>
    </div>
  );
}
