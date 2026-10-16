"use client";

import FormAlert from "@/components/features/auth/FormAlert";
import { Button } from "@/components/ui/button";
import { demoLoginAction } from "@/lib/actions/auth.action";
import { useState, useTransition } from "react";

export default function DemoLoginButtons({
  enabled,
}: {
  enabled: { candidate: boolean; recruiter: boolean };
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!enabled.candidate && !enabled.recruiter) return null;

  const tryDemo = (role: "candidate" | "recruiter") => {
    setError(null);
    startTransition(async () => {
      const result = await demoLoginAction(role);
      if (result) setError(result.message);
    });
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/45 p-4">
      <p className="text-sm font-semibold text-navy">Demo access</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Credentials stay on the server and are only available when configured.
      </p>
      {error && (
        <div className="mt-3">
          <FormAlert message={error} />
        </div>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {enabled.candidate && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => tryDemo("candidate")}
            className="h-10 rounded-xl bg-background"
          >
            Try as candidate
          </Button>
        )}
        {enabled.recruiter && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => tryDemo("recruiter")}
            className="h-10 rounded-xl bg-background"
          >
            Try as recruiter
          </Button>
        )}
      </div>
    </div>
  );
}
