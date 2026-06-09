'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Fraštačan SW zaregistrovaný:', registration.scope)
        })
        .catch((error) => {
          console.log('Fraštačan SW registrácia zlyhala:', error)
        })
    }
  }, [])

  return null
}
