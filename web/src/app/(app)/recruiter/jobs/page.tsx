"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getRecruiterJobsAction,
  updateRecruiterJobAction,
} from "@/lib/actions/recruiter.action";

type JobResponse = import("@/lib/api/api.type").RecruiterJob;

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadJobs() {
      const res = await getRecruiterJobsAction();
      if (cancelled) return;
      if (res.data) setJobs(res.data);
      else if (res.error) setError(res.error);
      setLoading(false);
    }
    void loadJobs();
    return () => { cancelled = true; };
  }, []);

  const handleTogglePublish = async (job: JobResponse) => {
    const newStatus = job.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const res = await updateRecruiterJobAction(job.id, { status: newStatus });
    if (res.data) {
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j))
      );
    } else if (res.error) {
      alert(res.error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading job postings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Postings</h1>
          <p className="text-muted-foreground">
            Manage your company&apos;s open positions and candidates.
          </p>
        </div>
        <Link href="/recruiter/jobs/new" className={buttonVariants()}>
          + Post New Job
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No job postings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first job posting to start finding candidates.
          </p>
          <Link
            href="/recruiter/jobs/new"
            className={buttonVariants({ className: "mt-4" })}
          >
            Create Job
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-lg border p-5 gap-4 bg-card"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg">{job.title}</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      job.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {job.location || "Remote"} • {job.employmentType || "Full-time"}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePublish(job)}
                >
                  {job.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </Button>

                {job.status === "PUBLISHED" ? (
                  <Link
                    href={`/recruiter/jobs/${job.id}/candidates`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    Swipe Candidates
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                    title="Publish job to view candidates"
                  >
                    Swipe Candidates
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
