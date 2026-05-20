// components/landing/CursorDog/MobileDogSvg.tsx
import { type Ref } from 'react'
import type { DogRefs } from './types'

interface Props {
  dogRef: DogRefs['dogRef']
  bobRef: DogRefs['bobRef']
  headRef: DogRefs['headRef']
  shoutRef: DogRefs['shoutRef']
}

export function MobileDogSvg({ dogRef, bobRef, headRef, shoutRef }: Props) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-cursor-dog
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 128,
        height: 108,
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      <svg
        viewBox="0 0 31.0189 25.9189"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', display: 'block', width: '100%', height: '100%' }}
      >
        <g ref={dogRef as Ref<SVGGElement>}>
          <g ref={bobRef as Ref<SVGGElement>}>
            <g ref={headRef as Ref<SVGGElement>} style={{ transformOrigin: '16px 22px', transformBox: 'fill-box' }}>
              <path
                d="M16.4333 21.4596C23.7166 26.2067 30.0434 22.7602 30.0434 16.5824C30.0434 10.4047 23.5215 9.49424 19.4247 9.94944C15.3278 10.4046 15.7734 15.8447 20.0941 14.4364C25.0822 12.8107 22.5463 0.975433 14.1113 0.975436C5.1373 0.975438 0.975428 8.92055 0.975436 15.9971C0.975441 21.5246 4.44891 25.6537 9.2801 24.8411C14.1113 24.0285 13.0518 18.5983 10.3856 13.331"
                stroke="var(--content-accent, #3A39FF)"
                strokeWidth="1.95087"
                strokeLinecap="round"
              />
            </g>
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
