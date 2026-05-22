"use client";

/**
 * Core GSAP entrypoint. Re-exports the base library only — no plugins
 * registered. Files that need plugins import from the named plugin
 * entrypoints alongside this one:
 *
 *   import { gsap } from "@/lib/gsap";
 *   import { ScrollTrigger, ScrollSmoother, ScrollToPlugin } from "@/lib/gsap-scroll";
 *   import { SplitText } from "@/lib/gsap-split";
 *   import { useGSAP } from "@/lib/gsap-react";
 *
 * Each plugin entrypoint calls registerPlugin idempotently when imported,
 * so registration cost is paid only by the code paths that need it. A
 * component that only tweens (e.g. TiltSpotlightCard) no longer pulls
 * ScrollTrigger/ScrollSmoother/SplitText into its chunk.
 */
import { gsap } from "gsap";

export { gsap };
