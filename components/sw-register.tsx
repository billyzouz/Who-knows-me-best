'use client'

import { useEffect } from 'react'

export default function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (let reg of regs) reg.unregister()
      })
      return
    }

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      // New SW waiting → reload as soon as it activates
      const onStateChange = (sw: ServiceWorker) => {
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') window.location.reload()
        })
      }

      if (reg.waiting) {
        onStateChange(reg.waiting)
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      }

      reg.addEventListener('updatefound', () => {
        const newSw = reg.installing
        if (newSw) onStateChange(newSw)
      })
    })

    // Reload when SW takes control (after skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [])

  return null
}
