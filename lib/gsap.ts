"use client";

/**
 * Single registration point for GSAP plugins this project actually
 * uses. Keep this list lean — registering every Club GSAP plugin
 * pulls dev/helper code (GSDevTools, MotionPathHelper, EaselPlugin,
 * etc.) into the production bundle for no benefit.
 *
 * To add a new plugin:
 *   1. import it from "gsap/<Name>"
 *   2. add it to the `gsap.registerPlugin(...)` call below
 *   3. re-export it for downstream callers
 *
 * Idempotent — registerPlugin de-dupes internally.
 */
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  SplitText
);

export {
  gsap,
  useGSAP,
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  SplitText,
};
