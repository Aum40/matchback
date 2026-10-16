import AuthCard from "@/components/features/auth/AuthCard";
import AuthSwapLink from "@/components/features/auth/AuthSwapLink";
import LoginForm from "@/components/features/auth/LoginForm";
import { redirectErrorMessage } from "@/lib/login-errors";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Log in · MATCHBACK" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthCard
      title="Log in"
      googleLabel="Continue with Google"
      description={
        <>
          Don&apos;t have an account?{" "}
          <AuthSwapLink
            href="/signup"
            direction="left"
            className="font-semibold text-brand underline decoration-brand/30 underline-offset-4 transition hover:text-navy"
          >
            Sign up
          </AuthSwapLink>
        </>
      }
    >
      <LoginForm initialError={redirectErrorMessage(error)} />
    </AuthCard>
  );
}
