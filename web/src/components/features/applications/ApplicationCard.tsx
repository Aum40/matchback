"use client";

import FormAlert from "@/components/features/auth/FormAlert";
import JobCard from "@/components/features/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  removeApplicationAction,
  updateApplicationAction,
} from "@/lib/actions/applications.action";
import type { Application, ApplicationStatus } from "@/lib/api/api.type";
import { APPLICATION_STATUS_LABELS } from "@/lib/format";
import Link from "next/link";
import { useState, useTransition } from "react";

/**
 * งานหนึ่งรายการในหน้า Saved / Applications
 * ทุกอย่างผู้ใช้กรอกเอง — ข้อความในหน้านี้ต้องไม่ทำให้เข้าใจว่าระบบรู้ผลจากนายจ้าง
 */
export default function ApplicationCard({
  application,
  showTracking = true,
}: {
  application: Application;
  /** false = หน้า Saved แสดงแค่การ์ด + ปุ่มเริ่มติดตาม/ลบ */
  showTracking?: boolean;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [notes, setNotes] = useState(application.notes ?? "");
  const [feedback, setFeedback] = useState(application.employerFeedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = (patch: Parameters<typeof updateApplicationAction>[1], done: string) =>
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await updateApplicationAction(application.id, patch);
      if (result.success) setMessage(done);
      else setError(result.message);
    });

  const remove = () =>
    startTransition(async () => {
      setError(null);
      const result = await removeApplicationAction(application.id);
      if (!result.success) setError(result.message);
    });

  const id = (name: string) => `${application.id}-${name}`;

  return (
    <JobCard job={application.job} skillLimit={4}>
      <div className="grid gap-3 border-t pt-4">
        {error && <FormAlert message={error} />}

        {showTracking ? (
          <>
            <Field className="gap-1">
              <FieldLabel htmlFor={id("status")}>Status (you update this)</FieldLabel>
              <select
                id={id("status")}
                value={status}
                onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
                className="h-11 rounded-xl border border-border bg-muted px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              >
                {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field className="gap-1">
              <FieldLabel htmlFor={id("notes")}>Notes</FieldLabel>
              <Textarea
                id={id("notes")}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contact person, interview dates, what you sent"
                className="min-h-16"
              />
            </Field>
            <Field className="gap-1">
              <FieldLabel htmlFor={id("feedback")}>Feedback from the employer</FieldLabel>
              <Textarea
                id={id("feedback")}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Write down any real feedback you received"
                className="min-h-16"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={isPending}
                onClick={() =>
                  save({ status, notes, employerFeedback: feedback }, "Saved.")
                }
              >
                {isPending ? "Saving..." : "Save"}
              </Button>
              <Link
                href={`/jobs/${application.job.id}`}
                className="text-sm underline underline-offset-4"
              >
                Match analysis
              </Link>
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {message}
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={isPending}
              onClick={() => save({ status: "APPLIED" }, "Moved to Applications.")}
            >
              I applied
            </Button>
            <Link
              href={`/jobs/${application.job.id}`}
              className="text-sm underline underline-offset-4"
            >
              Match analysis
            </Link>
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={remove}
              className="ml-auto"
            >
              Remove
            </Button>
            <p aria-live="polite" className="w-full text-sm text-muted-foreground">
              {message}
            </p>
          </div>
        )}
      </div>
    </JobCard>
  );
}
