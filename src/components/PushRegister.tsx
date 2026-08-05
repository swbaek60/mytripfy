'use client'

import { useEffect } from 'react'

/** Registers Capacitor push token with mytripfy API when running in the native app shell. */
export default function PushRegister() {
  useEffect(() => {
    let removeListener: (() => void) | undefined

    async function init() {
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (!Capacitor.isNativePlatform()) return

        const { PushNotifications } = await import('@capacitor/push-notifications')
        const perm = await PushNotifications.requestPermissions()
        if (perm.receive !== 'granted') return

        await PushNotifications.register()

        const regHandle = await PushNotifications.addListener('registration', async ev => {
          const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
          await fetch('/api/push/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: ev.value, platform }),
          })
        })

        removeListener = () => {
          regHandle.remove()
        }
      } catch {
        // Capacitor not available in web build
      }
    }

    init()
    return () => removeListener?.()
  }, [])

  return null
}
