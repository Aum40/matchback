"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SwapDirection = "left" | "right";

export default function AuthSwapLink({
  href,
  direction,
  children,
  className,
}: {
  href: string;
  direction: SwapDirection;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      isLeaving ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    setIsLeaving(true);
    window.sessionStorage.setItem("matchback-auth-swap", direction);
    window.dispatchEvent(
      new CustomEvent("matchback:auth-swap", { detail: { direction } }),
    );

    window.setTimeout(() => router.push(href), 340);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-disabled={isLeaving}
      className={className}
    >
      {children}
    </Link>
  );
}
