'use client'

import { MapPin, Car, BedDouble, Utensils, Activity, FileText, Clock } from 'lucide-react'
import { useCurrency } from '@/context/CurrencyContext'
import { convertAmount, formatCurrency } from '@/utils/currency'

type Category = 'transport' | 'accommodation' | 'meal' | 'activity' | 'note'

interface TripActivity {
  id: string
  sort_order: number
  time_label: string | null
  category: Category
  title: string
  location: string | null
  notes: string | null
  cost: number | null
  currency: string
}

interface TripDay {
  id: string
  day_number: number
  date: string | null
  title: string | null
  notes: string | null
  trip_activities: TripActivity[]
}

interface Props {
  days: TripDay[]
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; color: string; dot: string }> = {
  transport:     { label: 'Transport',     icon: <Car size={13} />,       color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  accommodation: { label: 'Accommodation', icon: <BedDouble size={13} />, color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  meal:          { label: 'Meal',          icon: <Utensils size={13} />,  color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  activity:      { label: 'Activity',      icon: <Activity size={13} />,  color: 'bg-green-100 text-green-700',   dot: 'bg-green-400' },
  note:          { label: 'Note',          icon: <FileText size={13} />,  color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function ItineraryView({ days }: Props) {
  const { formatPrice, selectedCurrency, rates } = useCurrency()

  if (days.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        No itinerary added yet.
      </p>
    )
  }

  // 총 비용: 각 activity를 선택 통화로 변환 후 합산
  const allActivities = days.flatMap(d => d.trip_activities)
  const hasCost = allActivities.some(a => a.cost && a.cost > 0)
  const totalConverted = allActivities.reduce((sum, a) => {
    if (!a.cost) return sum
    return sum + convertAmount(a.cost, a.currency || selectedCurrency, selectedCurrency, rates)
  }, 0)

  return (
    <div className="space-y-6">
      {days.map((day) => {
        const dayCostActivities = day.trip_activities.filter(a => a.cost && a.cost > 0)
        const hasDayCost = dayCostActivities.length > 0

        return (
          <div key={day.id}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {day.day_number}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm sm:text-base">
                  {day.title || `Day ${day.day_number}`}
                </p>
                {(day.date || hasDayCost) && (
                  <p className="text-xs text-gray-400">
                    {day.date ? formatDate(day.date) : ''}
                    {hasDayCost && (
                      <span className="ml-1 text-blue-500 font-medium">
                        · {dayCostActivities.map(a => formatPrice(a.cost!, a.currency || 'USD')).join(' + ')}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {day.notes && (
              <p className="text-sm text-gray-500 italic mb-3 ml-12">{day.notes}</p>
            )}

            {day.trip_activities.length > 0 ? (
              <div className="ml-4 border-l-2 border-gray-100 pl-6 space-y-3">
                {day.trip_activities
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((act) => {
                    const meta = CATEGORY_META[act.category]
                    return (
                      <div key={act.id} className="relative">
                        <div className={`absolute -left-[29px] top-3 w-3 h-3 rounded-full border-2 border-white ${meta.dot}`} />
                        <div className="bg-gray-50 rounded-xl p-3">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {act.time_label && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={11} /> {act.time_label}
                              </span>
                            )}
                            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                              {meta.icon} {meta.label}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{act.title}</p>
                          {act.location && (
                            <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <MapPin size={11} /> {act.location}
                            </p>
                          )}
                          {act.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">{act.notes}</p>
                          )}
                          {act.cost != null && act.cost > 0 && (
                            <div className="mt-1">
                              <span className="text-xs text-blue-600 font-semibold">
                                {formatPrice(act.cost, act.currency || selectedCurrency)}
                              </span>
                              {/* 원래 통화와 다를 때 원래 금액 표시 */}
                              {act.currency && act.currency !== selectedCurrency && (
                                <span className="text-xs text-gray-400 ml-1">
                                  ({act.currency} {act.cost.toLocaleString()})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 ml-12 italic">No activities planned.</p>
            )}
          </div>
        )
      })}

      {hasCost && (
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">Estimated Total</span>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(totalConverted, selectedCurrency)}
          </span>
        </div>
      )}
    </div>
  )
}
