"use client";

/**
 * @gsap/react entrypoint. Registers useGSAP idempotently and re-exports
 * it. Separate from the core barrel so files that don't need the React
 * helper don't pull it.
 */
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export { useGSAP };
