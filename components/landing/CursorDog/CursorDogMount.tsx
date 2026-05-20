// components/landing/CursorDog/CursorDogMount.tsx
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const CursorDog = dynamic(() => import('./index'), { ssr: false, loading: () => null })

export default function CursorDogMount() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const ric =
      (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
    if (typeof ric === 'function') {
      const handle = ric(() => setReady(true), { timeout: 2000 })
      return () => {
        const cic =
          (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback
        if (typeof cic === 'function') cic(handle)
      }
    }
    // Safari fallback — defer one frame
    const t = window.setTimeout(() => setReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  if (!ready) return null
  return <CursorDog />
}
