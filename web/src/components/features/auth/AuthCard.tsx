import GoogleButton from "@/components/features/auth/GoogleButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { googleEnabled } from "@/lib/env";

/** Shared shell for the Login and Register forms. */
export default function AuthCard({
  title,
  description,
  googleLabel,
  children,
}: {
  title: string;
  description: React.ReactNode;
  googleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="relative w-full overflow-hidden rounded-[1.75rem] border-border/70 bg-card/95 py-0 text-card-foreground shadow-[0_24px_70px_-30px_color-mix(in_oklch,var(--navy)_35%,transparent)] ring-1 ring-navy/5 backdrop-blur-xl sm:rounded-[2rem]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-brand" />

      <CardHeader className="gap-3 px-6 pb-5 pt-9 sm:px-11 sm:pb-7 sm:pt-11">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Your account</p>
          <span className="text-[11px] font-medium text-muted-foreground">MATCHBACK</span>
        </div>
        <CardTitle className="text-[2rem] font-semibold tracking-[-0.06em] text-navy sm:text-[2.45rem]">
          {title}
        </CardTitle>
        <CardDescription className="max-w-md text-[15px] leading-6">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 px-6 pb-9 sm:px-11 sm:pb-11">
        {googleEnabled && (
          <>
            <GoogleButton label={googleLabel} />
            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or continue with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
