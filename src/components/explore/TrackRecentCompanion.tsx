'use client'

import { useEffect } from 'react'
import { addRecentCompanion } from '@/lib/recent-companions'

interface Props {
  id: string
  title: string
  country: string
}

export default function TrackRecentCompanion({ id, title, country }: Props) {
  useEffect(() => {
    addRecentCompanion({ id, title, country })
  }, [id, title, country])
  return null
}
