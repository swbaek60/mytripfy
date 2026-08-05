'use client'

import { useLocale, useTranslations } from 'next-intl'
import { MapPin, Car, BedDouble, Utensils, Activity, FileText, Clock } from 'lucide-react'
import { useCurrency } from '@/context/CurrencyContext'
import { formatCurrency, sumInCurrency } from '@/utils/currency'
import type { ActivityCategory, TripDay } from '@/types/itinerary'

interface Props {
  days: TripDay[]
}

/** 라벨은 번역 키로 따로 받는다. 여기에는 색과 아이콘만 둔다. */
const CATEGORY_META: Record<
  ActivityCategory,
  { labelKey: string; icon: React.ReactNode; color: string; dot: string }
> = {
  transport:     { labelKey: 'catTransport',     icon: <Car size={13} />,       color: 'bg-brand-muted text-brand-hover',     dot: 'bg-brand' },
  accommodation: { labelKey: 'catAccommodation', icon: <BedDouble size={13} />, color: 'bg-purple-muted text-purple-strong', dot: 'bg-purple' },
  meal:          { labelKey: 'catMeal',          icon: <Utensils size={13} />,  color: 'bg-sunset-muted text-sunset-strong', dot: 'bg-sunset' },
  activity:      { labelKey: 'catActivity',      icon: <Activity size={13} />,  color: 'bg-success-muted text-success-strong',   dot: 'bg-success' },
  note:          { labelKey: 'catNote',          icon: <FileText size={13} />,  color: 'bg-surface-hover text-body',     dot: 'bg-hint' },
}

export default function ItineraryView({ days }: Props) {
  const t = useTranslations('Itinerary')
  const tc = useTranslations('Common')
  const locale = useLocale()
  const { formatPrice, selectedCurrency, rates } = useCurrency()

  // 날짜는 보고 있는 로케일로 적는다. 예전에는 'en-US' 로 고정돼 있어
  // 한국어 화면에서도 "Monday, March 3" 으로 나왔다.
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return ''
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  if (days.length === 0) {
    return <p className="text-sm text-hint py-4 text-center">{t('empty')}</p>
  }

  // 총 비용: 각 activity를 선택 통화로 변환 후 합산
  const allActivities = days.flatMap(d => d.trip_activities)
  const hasCost = allActivities.some(a => a.cost && a.cost > 0)
  const total = sumInCurrency(allActivities, selectedCurrency, rates)

  return (
    <div className="space-y-6">
      {days.map((day) => {
        const dayCostActivities = day.trip_activities.filter(a => a.cost && a.cost > 0)
        const hasDayCost = dayCostActivities.length > 0

        return (
          <div key={day.id}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
                {day.day_number}
              </div>
              <div>
                <p className="font-bold text-heading text-sm sm:text-base">
                  {day.title || t('dayLabel', { number: day.day_number })}
                </p>
                {(day.date || hasDayCost) && (
                  <p className="text-xs text-hint">
                    {day.date ? formatDate(day.date) : ''}
                    {hasDayCost && (
                      <span className="ml-1 text-brand font-medium">
                        · {dayCostActivities.map(a => formatPrice(a.cost!, a.currency || 'USD')).join(' + ')}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {day.notes && (
              <p className="text-sm text-subtle italic mb-3 ml-12">{day.notes}</p>
            )}

            {day.trip_activities.length > 0 ? (
              <div className="ml-4 border-l-2 border-edge pl-6 space-y-3">
                {day.trip_activities
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((act) => {
                    const meta = CATEGORY_META[act.category]
                    return (
                      <div key={act.id} className="relative">
                        <div className={`absolute -left-[29px] top-3 w-3 h-3 rounded-full border-2 border-white ${meta.dot}`} />
                        <div className="bg-surface-sunken rounded-xl p-3">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {act.time_label && (
                              <span className="flex items-center gap-1 text-xs text-hint">
                                <Clock size={11} /> {act.time_label}
                              </span>
                            )}
                            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                              {meta.icon} {t(meta.labelKey)}
                            </span>
                          </div>
                          <p className="font-semibold text-heading text-sm">{act.title}</p>
                          {act.location && (
                            <p className="flex items-center gap-1 text-xs text-hint mt-1">
                              <MapPin size={11} /> {act.location}
                            </p>
                          )}
                          {act.notes && (
                            <p className="text-xs text-subtle mt-1 italic">{act.notes}</p>
                          )}
                          {act.cost != null && act.cost > 0 && (
                            <div className="mt-1">
                              <span className="text-xs text-brand font-semibold">
                                {formatPrice(act.cost, act.currency || selectedCurrency)}
                              </span>
                              {/* 원래 통화와 다를 때 원래 금액 표시 */}
                              {act.currency && act.currency !== selectedCurrency && (
                                <span className="text-xs text-hint ml-1">
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
              <p className="text-xs text-hint ml-12 italic">{tc('noActivitiesPlanned')}</p>
            )}
          </div>
        )
      })}

      {hasCost && (
        <div className="border-t border-edge pt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-body">{tc('estimatedTotal')}</span>
          <span className="text-lg font-bold text-brand">
            {total.incomplete ? '~' : ''}{formatCurrency(total.total, selectedCurrency)}
          </span>
        </div>
      )}
    </div>
  )
}
