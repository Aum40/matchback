"use client";

import JobCard from "@/components/features/jobs/JobCard";
import { skillStates } from "@/components/features/jobs/SkillChips";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { resetSwipesAction, swipeAction } from "@/lib/actions/jobs.action";
import type { DiscoverJob, SwipeDirection } from "@/lib/api/api.type";
import { cn } from "@/lib/utils";
import { AlertCircle, Heart, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";

/** ลากเกินนี้ (px) แล้วปล่อย = ปัดจริง น้อยกว่านี้การ์ดเด้งกลับ */
const SWIPE_THRESHOLD = 110;

/**
 * กองการ์ดหน้า Discover
 * - ปัดได้สามแบบ: ลากด้วยนิ้ว/เมาส์, ปุ่ม Skip/Interested, ปุ่มลูกศรซ้าย/ขวาบนคีย์บอร์ด
 * - optimistic: การ์ดหายทันที แล้วค่อยบันทึก ถ้าบันทึกไม่ผ่านการ์ดกลับมาบนสุดพร้อมข้อความ
 */
export default function SwipeDeck({ jobs: initialJobs }: { jobs: DiscoverJob[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [dragX, setDragX] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [, startTransition] = useTransition();
  const dragStart = useRef<number | null>(null);

  const current = jobs[0];

  const decide = (direction: SwipeDirection) => {
    if (!current) return;
    const job = current;

    setError(null);
    setDragX(0);
    setJobs((rest) => rest.slice(1));
    setAnnouncement(
      `${direction === "LIKE" ? "Saved" : "Skipped"} ${job.title} at ${job.company}.`,
    );

    startTransition(async () => {
      const result = await swipeAction(job.id, direction);
      if (!result.success) {
        setJobs((rest) => [job, ...rest]);
        setError(`Couldn't save your choice: ${result.message}`);
      }
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // ปุ่ม/ลิงก์ในการ์ดต้องกดได้ตามปกติ ไม่เริ่มลาก
    if ((event.target as HTMLElement).closest("a, button")) return;
    dragStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    setDragX(event.clientX - dragStart.current);
  };

  const onPointerUp = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      decide(dragX > 0 ? "LIKE" : "SKIP");
    } else {
      setDragX(0);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      decide("LIKE");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      decide("SKIP");
    }
  };

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-8 text-center">
        <p className="font-medium">You&apos;ve seen every job for now.</p>
        <p className="text-sm text-muted-foreground">
          Review the jobs you saved, or start over to see skipped ones again.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/saved" className={buttonVariants()}>
            View saved jobs
          </Link>
          <form action={resetSwipesAction}>
            <Button type="submit" variant="outline">
              <RotateCcw aria-hidden="true" /> Start over
            </Button>
          </form>
        </div>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    );
  }

  const hint = dragX >= SWIPE_THRESHOLD / 2 ? "LIKE" : dragX <= -SWIPE_THRESHOLD / 2 ? "SKIP" : null;

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <div
        role="region"
        aria-label="Job cards. Use the left and right arrow keys to skip or save."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {/* การ์ดใบถัดไปโผล่ด้านหลังนิดเดียว ให้รู้ว่ายังมีต่อ */}
        {jobs.length > 1 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-3 -bottom-2 top-3 rounded-2xl border bg-card/60"
          />
        )}

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          // pan-y: เลื่อนหน้าขึ้นลงได้ตามปกติ แต่การลากแนวนอนเป็นของการ์ด
          className={cn(
            "relative cursor-grab touch-pan-y select-none active:cursor-grabbing",
            dragX === 0 && "motion-safe:transition-transform",
          )}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 25}deg)`,
          }}
        >
          <JobCard
            job={current}
            score={current.match.score}
            skillStates={skillStates(current.match)}
          >
            <Link
              href={`/jobs/${current.id}`}
              className="text-sm font-medium underline underline-offset-4"
            >
              See details and match analysis
            </Link>
          </JobCard>

          {hint && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-5 rounded-lg border-2 px-3 py-1 text-sm font-bold uppercase",
                hint === "LIKE"
                  ? "left-5 -rotate-12 border-success text-success"
                  : "right-5 rotate-12 border-destructive text-destructive",
              )}
            >
              {hint === "LIKE" ? "Interested" : "Skip"}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onClick={() => decide("SKIP")}>
          <X aria-hidden="true" /> Skip
        </Button>
        <Button size="lg" onClick={() => decide("LIKE")}>
          <Heart aria-hidden="true" /> Interested
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {jobs.length} {jobs.length === 1 ? "job" : "jobs"} left · Swipe, use the
        buttons, or press ← / →
      </p>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
