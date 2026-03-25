'use client'

import Link from 'next/link'
import { Users, MessageSquare } from 'lucide-react'
import { getLevelInfo } from '@/data/countries'
import { Button } from '@/components/ui/button'

interface Member {
  id: string
  full_name: string | null
  avatar_url: string | null
  travel_level?: number
  isHost?: boolean
}

interface Props {
  locale: string
  host: Member
  acceptedMembers: Member[]
  groupChatId?: string | null
}

export default function TripMembersCard({ locale, host, acceptedMembers, groupChatId }: Props) {
  const allMembers = [host, ...acceptedMembers]
  if (allMembers.length === 0) return null
  const showGroupChat = groupChatId && allMembers.length >= 3

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-heading text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            Travel Group ({allMembers.length})
          </h3>
          <p className="text-sm text-subtle mt-0.5">Who&apos;s going on this trip</p>
        </div>
        {showGroupChat && (
          <Link href={`/${locale}/messages/group/${groupChatId}`}>
            <Button className="bg-brand hover:bg-brand-hover text-white rounded-full text-sm px-4 shrink-0 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Trip Group Chat
            </Button>
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {allMembers.map(m => {
          const levelInfo = getLevelInfo(m.travel_level || 1)
          return (
            <Link
              key={m.id}
              href={`/${locale}/users/${m.id}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-sunken hover:bg-brand-light border border-transparent hover:border-edge-brand transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-subtle text-sm">👤</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-heading text-sm truncate">
                    {m.full_name || 'Anonymous'}
                  </span>
                  {m.isHost && (
                    <span className="text-[10px] bg-amber-light text-amber-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                      Host
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: levelInfo.color }}
                >
                  {levelInfo.badge} Lv.{m.travel_level || 1}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
