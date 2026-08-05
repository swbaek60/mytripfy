'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, MapPin, Utensils, Car, BedDouble, FileText, Activity } from 'lucide-react'
import { useCurrency } from '@/context/CurrencyContext'
import { CURRENCIES, formatCurrency, sumInCurrency } from '@/utils/currency'
import { api, errorMessage } from '@/lib/client/api'
import type { ActivityCategory, TripActivity, TripDay } from '@/types/itinerary'

interface Props {
  tripId?: string
  postId?: string
  startDate: string | null
  initialDays: TripDay[]
}

/** 라벨은 번역 키로 따로 받는다. 여기에는 색과 아이콘만 둔다. */
const CATEGORY_META: Record<
  ActivityCategory,
  { labelKey: string; icon: React.ReactNode; color: string }
> = {
  transport:     { labelKey: 'catTransport',     icon: <Car size={13} />,       color: 'bg-brand-muted text-brand-hover' },
  accommodation: { labelKey: 'catAccommodation', icon: <BedDouble size={13} />, color: 'bg-purple-muted text-purple-strong' },
  meal:          { labelKey: 'catMeal',          icon: <Utensils size={13} />,  color: 'bg-sunset-muted text-sunset-strong' },
  activity:      { labelKey: 'catActivity',      icon: <Activity size={13} />,  color: 'bg-success-muted text-success-strong' },
  note:          { labelKey: 'catNote',          icon: <FileText size={13} />,  color: 'bg-surface-hover text-body' },
}

/**
 * 새 활동의 기본 제목. 번역하지 않는다 — /api/trips/itinerary 의 zod 기본값과
 * 같은 문자열이어야 하고, 사용자가 입력란을 누르면 이 값일 때만 비워 준다.
 */
const NEW_ACTIVITY_TITLE = 'New activity'

function getDateForDay(startDate: string | null, dayNumber: number): string {
  if (!startDate) return ''
  const d = new Date(startDate)
  d.setDate(d.getDate() + dayNumber - 1)
  return d.toISOString().split('T')[0]
}

/** 활동 필드명 → API 파라미터명 */
const ACTIVITY_PARAM: Record<string, string> = {
  time_label: 'timeLabel',
  sort_order: 'sortOrder',
}

export default function ItineraryEditor({ tripId, postId, startDate, initialDays }: Props) {
  const t = useTranslations('Itinerary')
  const tc = useTranslations('Common')
  const locale = useLocale()
  const [days, setDays] = useState<TripDay[]>(initialDays)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(initialDays.map(d => d.id)))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { selectedCurrency, rates } = useCurrency()

  // 날짜는 보고 있는 로케일로 적는다 (예전에는 'en-US' 고정).
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return ''
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // 타이핑 중에는 마지막 입력만 저장한다 (필드별 디바운스).
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const queueSave = useCallback((key: string, body: Record<string, unknown>) => {
    const pending = timers.current
    const existing = pending.get(key)
    if (existing) clearTimeout(existing)
    pending.set(
      key,
      setTimeout(() => {
        pending.delete(key)
        api.patch('/api/trips/itinerary', body).catch(err => setError(errorMessage(err)))
      }, 600)
    )
  }, [])

  const addDay = async () => {
    setSaving(true)
    setError('')
    const nextNum = days.length + 1
    const date = getDateForDay(startDate, nextNum)
    try {
      const { day } = await api.post<{ day: TripDay }>('/api/trips/itinerary', {
        scope: 'day',
        ...(tripId ? { tripId } : { postId }),
        dayNumber: nextNum,
        date: date || null,
        title: t('dayLabel', { number: nextNum }),
      })
      setDays(prev => [...prev, { ...day, trip_activities: [] }])
      setExpandedDays(prev => new Set([...prev, day.id]))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const deleteDay = async (dayId: string) => {
    if (!confirm('Delete this day and all its activities?')) return
    setSaving(true)
    try {
      await api.del('/api/trips/itinerary', { scope: 'day', dayId })
      setDays(prev => prev.filter(d => d.id !== dayId))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const updateDayField = (dayId: string, field: 'title' | 'notes', value: string) => {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, [field]: value } : d))
    queueSave(`day:${dayId}:${field}`, { scope: 'day', dayId, [field]: value })
  }

  const addActivity = async (dayId: string) => {
    setSaving(true)
    try {
      const { activity } = await api.post<{ activity: TripActivity }>('/api/trips/itinerary', {
        scope: 'activity',
        dayId,
        category: 'activity',
        title: NEW_ACTIVITY_TITLE,
        currency: selectedCurrency,
      })
      setDays(prev => prev.map(d =>
        d.id === dayId ? { ...d, trip_activities: [...d.trip_activities, activity] } : d
      ))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const updateActivity = (
    dayId: string,
    activityId: string,
    field: keyof TripActivity,
    value: string | number | null
  ) => {
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, trip_activities: d.trip_activities.map(a => a.id === activityId ? { ...a, [field]: value } : a) }
        : d
    ))
    const param = ACTIVITY_PARAM[field] ?? field
    queueSave(`activity:${activityId}:${field}`, { scope: 'activity', activityId, [param]: value })
  }

  const deleteActivity = async (dayId: string, activityId: string) => {
    try {
      await api.del('/api/trips/itinerary', { scope: 'activity', activityId })
      setDays(prev => prev.map(d =>
        d.id === dayId
          ? { ...d, trip_activities: d.trip_activities.filter(a => a.id !== activityId) }
          : d
      ))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(dayId)) next.delete(dayId)
      else next.add(dayId)
      return next
    })
  }

  const total = sumInCurrency(days.flatMap(d => d.trip_activities), selectedCurrency, rates)

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger-light border border-danger-border text-danger-strong rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {days.map((day) => {
        const dateLabel = day.date ? formatDate(day.date) : t('dayLabel', { number: day.day_number })
        const isExpanded = expandedDays.has(day.id)
        const dayTotal = sumInCurrency(day.trip_activities, selectedCurrency, rates)

        return (
          <div key={day.id} className="bg-surface rounded-2xl shadow-sm border border-edge overflow-hidden">
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-hover transition-colors"
              onClick={() => toggleDay(day.id)}
            >
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
                {day.day_number}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  value={day.title ?? t('dayLabel', { number: day.day_number })}
                  onChange={e => { e.stopPropagation(); updateDayField(day.id, 'title', e.target.value) }}
                  onClick={e => e.stopPropagation()}
                  aria-label={tc('title')}
                  className="font-bold text-heading bg-transparent border-none outline-none w-full text-sm sm:text-base"
                  placeholder={t('dayLabel', { number: day.day_number })}
                />
                <p className="text-xs text-hint">
                  {dateLabel} · {day.trip_activities.length} activities
                  {dayTotal.total > 0 && (
                    <span className="text-brand font-medium ml-1">
                      · {dayTotal.incomplete ? '~' : ''}{formatCurrency(dayTotal.total, selectedCurrency)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); deleteDay(day.id) }}
                  aria-label={t('deleteDay')}
                  className="p-1.5 text-hint hover:text-danger transition-colors rounded-lg hover:bg-danger-light"
                >
                  <Trash2 size={14} />
                </button>
                {isExpanded ? <ChevronUp size={16} className="text-hint" /> : <ChevronDown size={16} className="text-hint" />}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-edge p-4 space-y-3">
                <textarea
                  value={day.notes ?? ''}
                  onChange={e => updateDayField(day.id, 'notes', e.target.value)}
                  placeholder={tc('dayNotesPlaceholder')}
                  rows={2}
                  className="w-full text-sm text-body placeholder-hint bg-surface-sunken rounded-xl px-3 py-2 resize-none border border-edge focus:outline-none focus:ring-2 focus:ring-brand"
                />

                <div className="space-y-2">
                  {day.trip_activities
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((act) => {
                      const meta = CATEGORY_META[act.category]
                      return (
                        <div key={act.id} className="flex gap-2 items-start group">
                          <div className="mt-2 text-hint cursor-grab shrink-0">
                            <GripVertical size={14} />
                          </div>
                          <div className="flex-1 bg-surface-sunken rounded-xl p-3 border border-edge space-y-2">
                            <div className="flex flex-wrap gap-2 items-center">
                              <select
                                value={act.category}
                                onChange={e => updateActivity(day.id, act.id, 'category', e.target.value)}
                                className={`text-xs font-medium px-2 py-1 rounded-full border-none outline-none cursor-pointer ${meta.color}`}
                              >
                                {Object.entries(CATEGORY_META).map(([k, v]) => (
                                  <option key={k} value={k}>{t(v.labelKey)}</option>
                                ))}
                              </select>
                              <input
                                value={act.time_label ?? ''}
                                onChange={e => updateActivity(day.id, act.id, 'time_label', e.target.value)}
                                placeholder={t('timePlaceholder')}
                                aria-label={t('timePlaceholder')}
                                className="w-20 text-xs text-subtle bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
                              />
                              <input
                                value={act.title}
                                onChange={e => updateActivity(day.id, act.id, 'title', e.target.value)}
                                onFocus={e => {
                                  if (e.target.value === NEW_ACTIVITY_TITLE) {
                                    updateActivity(day.id, act.id, 'title', '')
                                  }
                                }}
                                placeholder={tc('activityTitle')}
                                aria-label={tc('activityTitle')}
                                className="flex-1 text-sm font-medium text-heading bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand min-w-0"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <MapPin size={11} className="text-hint shrink-0" />
                                <input
                                  value={act.location ?? ''}
                                  onChange={e => updateActivity(day.id, act.id, 'location', e.target.value)}
                                  placeholder={t('locationPlaceholder')}
                                  aria-label={t('locationPlaceholder')}
                                  className="flex-1 text-xs text-subtle bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand min-w-0"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <select
                                  value={act.currency || selectedCurrency}
                                  onChange={e => updateActivity(day.id, act.id, 'currency', e.target.value)}
                                  className="text-xs text-subtle bg-surface border border-edge rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-brand max-w-[70px]"
                                >
                                  {CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.code}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  value={act.cost ?? ''}
                                  onChange={e => updateActivity(day.id, act.id, 'cost', e.target.value ? parseFloat(e.target.value) : null)}
                                  placeholder="0"
                                  className="w-20 text-xs text-subtle bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
                                />
                              </div>
                            </div>
                            <input
                              value={act.notes ?? ''}
                              onChange={e => updateActivity(day.id, act.id, 'notes', e.target.value)}
                              placeholder={t('notesPlaceholder')}
                              aria-label={t('notesPlaceholder')}
                              className="w-full text-xs text-subtle bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
                            />
                          </div>
                          <button
                            onClick={() => deleteActivity(day.id, act.id)}
                            aria-label={t('deleteActivity')}
                            className="mt-2 p-1.5 text-hint hover:text-danger transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                </div>

                <button
                  onClick={() => addActivity(day.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-brand border-2 border-dashed border-edge-brand rounded-xl hover:bg-brand-light transition-colors font-medium"
                >
                  <Plus size={14} /> {tc('addActivity')}
                </button>
              </div>
            )}
          </div>
        )
      })}

      <button
        onClick={addDay}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 text-sm font-semibold text-brand border-2 border-dashed border-edge-brand rounded-2xl hover:bg-brand-light transition-colors disabled:opacity-50"
      >
        <Plus size={16} /> {tc('addDay')} {days.length + 1}
      </button>

      {total.total > 0 && (
        <div className="bg-gradient-to-r from-brand-light to-indigo-light rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-body">{tc('estimatedTotalBudget')}</span>
          <span className="text-xl font-bold text-brand">
            {total.incomplete ? '~' : ''}{formatCurrency(total.total, selectedCurrency)}
          </span>
        </div>
      )}
    </div>
  )
}
