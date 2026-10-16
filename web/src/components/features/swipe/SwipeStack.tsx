"use client";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ErrorActionResult } from "@/lib/actions/action.type";
import type { SwipeDirection, SwipeResult } from "@/lib/api/api.type";
import { cn } from "@/lib/utils";
import { AlertCircle, Heart, RotateCcw, X } from "lucide-react";
import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 110;

type SwipeStackProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  onSwipe: (
    item: T,
    direction: SwipeDirection,
  ) => Promise<SwipeResult | ErrorActionResult>;
  emptyState: React.ReactNode;
  onSwipeResult?: (item: T, result: SwipeResult) => void;
  ariaLabel?: string;
  itemLabel?: string;
};

function isErrorResult(
  result: SwipeResult | ErrorActionResult,
): result is ErrorActionResult {
  return "success" in result && result.success === false;
}
function isSwipeResult(
  result: SwipeResult | ErrorActionResult,
): result is SwipeResult {
  return "matchCreated" in result;
}

export default function SwipeStack<T>({
  items: initialItems,
  getKey,
  renderCard,
  onSwipe,
  emptyState,
  onSwipeResult,
  ariaLabel = "Swipe cards",
  itemLabel = "item",
}: SwipeStackProps<T>) {
  const [items, setItems] = useState(initialItems);
  const [dragX, setDragX] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [isPending, setIsPending] = useState(false);
  const dragStart = useRef<number | null>(null);

  const current = items[0];

  const decide = async (direction: SwipeDirection) => {
    if (!current || isPending) return;
    const item = current;

    setError(null);
    setDragX(0);
    setItems((rest) => rest.slice(1));
    setIsPending(true);

    try {
      const result = await onSwipe(item, direction);
      if (isErrorResult(result)) {
        setItems((rest) => [item, ...rest]);
        setError(result.message);
        setAnnouncement(`Could not save this ${itemLabel}.`);
        return;
      }

      setAnnouncement(direction === "LIKE" ? `Liked this ${itemLabel}.` : `Passed on this ${itemLabel}.`);
      if (isSwipeResult(result)) onSwipeResult?.(item, result);
    } catch (actionError) {
      setItems((rest) => [item, ...rest]);
      setError(actionError instanceof Error ? actionError.message : "Please try again.");
      setAnnouncement(`Could not save this ${itemLabel}.`);
    } finally {
      setIsPending(false);
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
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
      void decide(dragX > 0 ? "LIKE" : "SKIP");
    } else {
      setDragX(0);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      void decide("LIKE");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      void decide("SKIP");
    }
  };

  if (!current) {
    return (
      <div className="space-y-4 rounded-3xl border border-dashed p-8 text-center">
        {emptyState}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    );
  }

  const hint = dragX >= SWIPE_THRESHOLD / 2 ? "LIKE" : dragX <= -SWIPE_THRESHOLD / 2 ? "PASS" : null;

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t save your choice: {error}</AlertTitle>
        </Alert>
      )}

      <div
        role="region"
        aria-label={ariaLabel}
        aria-busy={isPending}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {items.length > 1 && (
          <div aria-hidden="true" className="absolute inset-x-4 -bottom-3 top-4 rounded-3xl border border-border bg-card/70 shadow-sm" />
        )}
        {items.length > 2 && (
          <div aria-hidden="true" className="absolute inset-x-7 -bottom-5 top-7 rounded-3xl border border-border/70 bg-card/50" />
        )}

        <div
          key={getKey(current)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            "relative cursor-grab touch-pan-y select-none active:cursor-grabbing",
            dragX === 0 && "motion-safe:transition-transform",
          )}
          style={{ transform: `translateX(${dragX}px) rotate(${dragX / 25}deg)` }}
        >
          {renderCard(current)}
          {hint && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-5 rounded-lg border-2 px-3 py-1 text-sm font-bold uppercase",
                hint === "LIKE"
                  ? "left-5 -rotate-12 border-brand text-brand"
                  : "right-5 rotate-12 border-skip text-skip",
              )}
            >
              {hint}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button disabled={isPending} variant="outline" size="lg" onClick={() => void decide("SKIP")}>
          <X aria-hidden="true" /> Pass
        </Button>
        <Button disabled={isPending} size="lg" onClick={() => void decide("LIKE")}>
          <Heart aria-hidden="true" /> Like
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {items.length} {items.length === 1 ? itemLabel : `${itemLabel}s`} left. Swipe, use the buttons, or press Left / Right.
      </p>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

export function SwipeStackResetHint({ onReset }: { onReset: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onReset}>
      <RotateCcw aria-hidden="true" /> Start over
    </Button>
  );
}

