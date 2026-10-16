import AuthCard from "@/components/features/auth/AuthCard";
import AuthSwapLink from "@/components/features/auth/AuthSwapLink";
import SignupForm from "@/components/features/auth/SignupForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create your account · MATCHBACK" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create an account"
      googleLabel="Sign up with Google"
      description={
        <>
          Already have an account?{" "}
          <AuthSwapLink
            href="/login"
            direction="right"
            className="font-semibold text-brand underline decoration-brand/30 underline-offset-4 transition hover:text-navy"
          >
            Log in
          </AuthSwapLink>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
