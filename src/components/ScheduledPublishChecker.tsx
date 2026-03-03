'use client'

import { useEffect } from 'react'

export function ScheduledPublishChecker() {
  useEffect(() => {
    // Check for scheduled articles every minute
    const checkScheduled = async () => {
      try {
        await fetch('/api/scheduled-publish', { method: 'POST' })
      } catch (error) {
        console.error('Failed to check scheduled articles:', error)
      }
    }

    // Check immediately on mount
    checkScheduled()
    
    // Then check every minute
    const interval = setInterval(checkScheduled, 60000)

    return () => clearInterval(interval)
  }, [])

  return null
}
