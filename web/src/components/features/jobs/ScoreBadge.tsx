import { scoreLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * คะแนนความเข้ากัน 0-100 — แสดงเป็น profile fit ไม่ใช่ % หรือโอกาสได้งาน
 * (ดู api/src/matching/match-score.ts)
 */
export default function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "md" | "lg";
}) {
  const tone =
    score >= 75
      ? "border-success/40 bg-success/10 text-success"
      : score >= 50
        ? "border-warning/50 bg-warning/15 text-foreground"
        : "border-border bg-muted text-muted-foreground";

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-2xl border text-center",
        size === "lg" ? "size-24" : "size-16",
        tone,
      )}
      aria-label={`Match score ${score} out of 100, ${scoreLabel(score)}`}
    >
      <span
        className={cn(
          "leading-none font-bold tabular-nums",
          size === "lg" ? "text-3xl" : "text-xl",
        )}
      >
        {score}
      </span>
      <span className="mt-1 text-[0.65rem] font-medium uppercase">Profile fit</span>
    </div>
  );
}
