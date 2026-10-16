"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SwapDirection = "left" | "right";
type SwapPhase = "idle" | "out-left" | "out-right" | "in-left" | "in-right";

const STORAGE_KEY = "matchback-auth-swap";

function incomingPhase(direction: SwapDirection): SwapPhase {
  return direction === "left" ? "in-right" : "in-left";
}

function playIncomingPhase(
  direction: SwapDirection,
  setPhase: React.Dispatch<React.SetStateAction<SwapPhase>>,
) {
  setPhase(incomingPhase(direction));

  return window.setTimeout(() => setPhase("idle"), 520);
}

export default function AuthMotion({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const pendingDirection = useRef<SwapDirection | null>(null);
  const [phase, setPhase] = useState<SwapPhase>("idle");

  useEffect(() => {
    const storedDirection = window.sessionStorage.getItem(STORAGE_KEY) as
      | SwapDirection
      | null;
    if (!storedDirection) return;

    window.sessionStorage.removeItem(STORAGE_KEY);
    const timeout = playIncomingPhase(storedDirection, setPhase);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleSwapStart = (event: Event) => {
      const direction = (event as CustomEvent<{ direction: SwapDirection }>).detail
        ?.direction;
      if (!direction) return;

      pendingDirection.current = direction;
      setPhase(direction === "left" ? "out-left" : "out-right");
    };

    window.addEventListener("matchback:auth-swap", handleSwapStart);
    return () => window.removeEventListener("matchback:auth-swap", handleSwapStart);
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    const storedDirection = window.sessionStorage.getItem(STORAGE_KEY) as
      | SwapDirection
      | null;
    const direction = pendingDirection.current ?? storedDirection;

    if (direction) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      pendingDirection.current = null;
      const timeout = playIncomingPhase(direction, setPhase);
      previousPathname.current = pathname;
      return () => window.clearTimeout(timeout);
    }

    previousPathname.current = pathname;
  }, [pathname]);

  return (
    <div className="auth-swap-stage" data-swap={phase}>
      {children}
    </div>
  );
}
