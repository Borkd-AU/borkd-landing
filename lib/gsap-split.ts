"use client";

/**
 * SplitText entrypoint. Importing from here registers the plugin
 * idempotently. Use alongside the core gsap import:
 *
 *   import { gsap } from "@/lib/gsap";
 *   import { SplitText } from "@/lib/gsap-split";
 *
 * SplitText is the heaviest plugin in this project (full chars+words DOM
 * splitting machinery). Pages without title reveals (e.g. /design-system,
 * /privacy, /terms once anchored) do not load it.
 */
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export { SplitText };
