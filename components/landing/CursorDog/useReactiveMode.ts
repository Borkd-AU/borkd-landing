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
  if (window.matchMedia('(pointer: coarse)').matches) {
    return 'mobile'
  }
  return 'disabled'
}

export function useReactiveMode(): Mode | null {
  // null on first SSR/client render — controller renders null until mode resolves
  const [mode, setMode] = useState<Mode | null>(null)

  useEffect(() => {
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
