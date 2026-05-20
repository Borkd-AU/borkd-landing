// components/landing/CursorDog/DesktopDogSvg.tsx
import { type Ref } from 'react'
import type { DogRefs } from './types'

interface Props {
  dogRef: DogRefs['dogRef']
  bobRef: DogRefs['bobRef']
  headRef: DogRefs['headRef']
  shoutRef: DogRefs['shoutRef']
  leashRef: DogRefs['leashRef']
  rootRef: React.RefObject<HTMLDivElement | null>
  svgRef: React.RefObject<SVGSVGElement | null>
}

export function DesktopDogSvg({ dogRef, bobRef, headRef, shoutRef, leashRef, rootRef, svgRef }: Props) {
  // The svg viewBox is set imperatively by the controller on mount + resize.
  // We render a placeholder viewBox here; the controller updates it before
  // the first frame paints.
  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-cursor-dog
      ref={rootRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      <svg
        ref={svgRef as Ref<SVGSVGElement>}
        viewBox="0 0 1 1"
        preserveAspectRatio="xMinYMin meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', display: 'block', width: '100%', height: '100%' }}
      >
        {/* Leash — d attribute updated each frame by the controller */}
        <path
          ref={leashRef as Ref<SVGPathElement>}
          d=""
          stroke="var(--content-accent, #3A39FF)"
          strokeWidth="1.95087"
          strokeLinecap="round"
          fill="none"
        />
        {/* Dog — dogRef.x/y written by quickTo. Wrapper for cursor follow only.
            scale 1.2 renders the dog at ~37×31 CSS px (intrinsic viewBox 31x26). */}
        <g ref={dogRef as Ref<SVGGElement>} transform="translate(0,0) scale(1.2)">
          {/* bobRef — sniff bob lives here (y += 4). Separate from dogRef so the
              baseline reset (PAUSED_INPUT / PARKED entry) only zeros bobRef.y
              and never zaps the cursor-follow position. Spec round-7. */}
          <g ref={bobRef as Ref<SVGGElement>}>
            <g ref={headRef as Ref<SVGGElement>} style={{ transformOrigin: '16px 22px', transformBox: 'fill-box' }}>
              <path
                d="M16.4333 21.4596C23.7166 26.2067 30.0434 22.7602 30.0434 16.5824C30.0434 10.4047 23.5215 9.49424 19.4247 9.94944C15.3278 10.4046 15.7734 15.8447 20.0941 14.4364C25.0822 12.8107 22.5463 0.975433 14.1113 0.975436C5.1373 0.975438 0.975428 8.92055 0.975436 15.9971C0.975441 21.5246 4.44891 25.6537 9.2801 24.8411C14.1113 24.0285 13.0518 18.5983 10.3856 13.331"
                stroke="var(--content-accent, #3A39FF)"
                strokeWidth="1.95087"
                strokeLinecap="round"
              />
            </g>
            {/* shoutRef is a SIBLING of headRef (spec round-6 amendment).
                Do not nest it inside headRef — it must stay axis-aligned
                during the 12° head-tilt. */}
            <g ref={shoutRef as Ref<SVGGElement>} opacity={0}>
              <g stroke="var(--content-accent, #3A39FF)" strokeWidth="1.95087" strokeLinecap="round">
                <line x1="28.2" y1="4.2" x2="30.4" y2="0.5" />
                <line x1="29.8" y1="6.2" x2="33.8" y2="3.8" />
                <line x1="30.6" y1="8.5" x2="35.5" y2="8.7" />
                <line x1="30.2" y1="10.8" x2="33.8" y2="13.6" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
