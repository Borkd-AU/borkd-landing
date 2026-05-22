"use client";

/**
 * Scroll plugins entrypoint — ScrollTrigger + ScrollSmoother +
 * ScrollToPlugin. Importing from here registers all three idempotently.
 * Use alongside the core gsap import:
 *
 *   import { gsap } from "@/lib/gsap";
 *   import { ScrollTrigger, ScrollSmoother } from "@/lib/gsap-scroll";
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin);

export { ScrollTrigger, ScrollSmoother, ScrollToPlugin };
