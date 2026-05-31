// components/landing/CursorDog/DesktopDogSvg.tsx
import { type Ref } from 'react'
import { MORPH_EMOJI_SIZE_PX } from './constants'
import type { DogRefs, EmojiRefs } from './types'

interface Props {
  dogRef: DogRefs['dogRef']
  bobRef: DogRefs['bobRef']
  headRef: DogRefs['headRef']
  shoutRef: DogRefs['shoutRef']
  leashRef: DogRefs['leashRef']
  emojiRef: EmojiRefs['emojiRef']
  rootRef: React.RefObject<HTMLDivElement | null>
  svgRef: React.RefObject<SVGSVGElement | null>
  /** Wrapper for ONLY the SVG dog+leash — faded out during MORPHED while the
   *  emoji layer (a sibling) stays visible (Codex #8). */
  svgLayerRef: React.RefObject<HTMLDivElement | null>
}

export function DesktopDogSvg({ dogRef, bobRef, headRef, shoutRef, leashRef, emojiRef, rootRef, svgRef, svgLayerRef }: Props) {
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
      {/* SVG layer — faded out during MORPHED. The emoji layer below is a
          sibling so it stays visible while this fades (Codex #8). */}
      <div ref={svgLayerRef} style={{ position: 'absolute', inset: 0 }}>
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
            scale 1.2 renders the dog at ~37×31 CSS px (intrinsic viewBox 31x26).
            opacity=0 at SSR so the dog never paints at (0,0) before the
            controller's entryTrot positions it offscreen and tweens it in. */}
        <g ref={dogRef as Ref<SVGGElement>} transform="translate(0,0) scale(1.2)" opacity={0}>
          {/* bobRef — sniff bob lives here (y += 4). Separate from dogRef so the
              baseline reset (PAUSED_INPUT / PARKED entry) only zeros bobRef.y
              and never zaps the cursor-follow position. Spec round-7. */}
          <g ref={bobRef as Ref<SVGGElement>} style={{ transformOrigin: '15.5px 13px', transformBox: 'fill-box' }}>
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

      {/* Emoji-morph layer — a plain DOM node so the glyph uses the system emoji
          font. Sibling of the SVG layer (Codex #8): the SVG fades during
          MORPHED while this stays visible. Positioned at the top-left; the
          controller writes x/y via quickTo — x follows the cursor (centered by
          marginLeft below), y is pinned above the hovered word's top (see
          morphEmojiY). opacity 0 until MORPHED. */}
      <div
        ref={emojiRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          // marginLeft -0.5em keeps the emoji horizontally centered on the
          // cursor; x is added by quickTo via the translate() it writes. (GSAP
          // composes its own translate; we keep the centering offset here via
          // margin so they don't conflict.)
          marginLeft: '-0.5em',
          // No vertical margin: while MORPHED the controller drives y directly so
          // the emoji's TOP sits at `wordTop - GAP - SIZE`, pinning its bottom a
          // fixed gap above the hovered word's top edge. This keeps the word
          // readable for ANY word height (a centered margin offset only cleared
          // small body text and still covered tall headings — Codex follow-up).
          marginTop: 0,
          fontSize: MORPH_EMOJI_SIZE_PX,
          lineHeight: 1,
          opacity: 0,
          willChange: 'transform, opacity',
          userSelect: 'none',
        }}
      />
    </div>
  )
}
