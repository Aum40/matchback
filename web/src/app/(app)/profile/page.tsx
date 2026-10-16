import ProfileForm from "@/components/features/profile/ProfileForm";
import { CandidatesApi } from "@/lib/api/candidates.api";
import { JobsApi } from "@/lib/api/jobs.api";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "RECRUITER") redirect("/recruiter");
  if (session.user.role === "ADMIN") redirect("/admin");

  const [profile, skills] = await Promise.all([
    CandidatesApi.getProfile(session.user.access_token),
    JobsApi.skills(),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="text-sm text-muted-foreground">
          Your match scores and resume suggestions come from this page. The more
          accurate it is, the more useful they are.
        </p>
      </header>
      <ProfileForm profile={profile} skills={skills} />
    </div>
  );
}
