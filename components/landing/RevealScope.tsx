"use client";

/**
 * RevealScope — client wrapper that turns its server-rendered children into
 * a scroll-reveal scope. Every descendant with `data-reveal` fades up as it
 * enters the viewport. The page stays a server component; only this thin
 * shell is client-side. See useGsapReveal for the actual mechanics.
 */
import { useRef, type ReactNode } from "react";
import { useGsapReveal } from "./useGsapReveal";

interface Props {
  children: ReactNode;
  className?: string;
}

export function RevealScope({ children, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  useGsapReveal(ref);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
