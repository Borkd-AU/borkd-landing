// components/landing/CursorDog/useReactiveMode.ts
import { useEffect, useState } from 'react'
import type { Mode } from './types'

function resolveMode(): Mode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'disabled'
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'disabled'
  }
  if (window.matchMedia('(pointer: fine)').matches) {
    return 'desktop'
  }
  // Mobile/touch (coarse pointer) and anything else: no cursor exists,
  // so the cursor-following dog has no input to track. Disable rather
  // than degrade — see the design discussion in the 2026-05-20 session.
  return 'disabled'
}

export function useReactiveMode(): Mode | null {
  // null on first SSR/client render — controller renders null until mode resolves
  const [mode, setMode] = useState<Mode | null>(null)

  useEffect(() => {
    // The initial mode resolution must happen after mount (matchMedia is
    // client-only). The set-state-in-effect rule flags this, but the
    // "double-render on hydration" it warns about is exactly the intent:
    // server renders null, client effect resolves the real mode. The
    // controller in index.tsx gates rendering on `mode == null`, so the
    // first paint stays empty until this resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(resolveMode())
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const queries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(pointer: fine)'),
      window.matchMedia('(pointer: coarse)'),
    ]
    const onChange = () => setMode(resolveMode())
    queries.forEach((q) => q.addEventListener('change', onChange))
    return () => queries.forEach((q) => q.removeEventListener('change', onChange))
  }, [])

  return mode
}
