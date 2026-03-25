'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, MapPin, Clock, Utensils, Car, BedDouble, FileText, Activity } from 'lucide-react'
import { useCurrency } from '@/context/CurrencyContext'
import { CURRENCIES, convertAmount, formatCurrency } from '@/utils/currency'

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
  tripId?: string
  postId?: string
  startDate: string | null
  initialDays: TripDay[]
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
  transport:     { label: 'Transport',     icon: <Car size={13} />,       color: 'bg-blue-100 text-blue-700' },
  accommodation: { label: 'Accommodation', icon: <BedDouble size={13} />, color: 'bg-purple-100 text-purple-700' },
  meal:          { label: 'Meal',          icon: <Utensils size={13} />,  color: 'bg-orange-100 text-orange-700' },
  activity:      { label: 'Activity',      icon: <Activity size={13} />,  color: 'bg-green-100 text-green-700' },
  note:          { label: 'Note',          icon: <FileText size={13} />,  color: 'bg-gray-100 text-body' },
}

function getDateForDay(startDate: string | null, dayNumber: number): string {
  if (!startDate) return ''
  const d = new Date(startDate)
  d.setDate(d.getDate() + dayNumber - 1)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function ItineraryEditor({ tripId, postId, startDate, initialDays }: Props) {
  const [days, setDays] = useState<TripDay[]>(initialDays)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(initialDays.map(d => d.id)))
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { selectedCurrency, rates } = useCurrency()

  const refField = tripId ? { trip_id: tripId } : { post_id: postId }

  const addDay = async () => {
    setSaving(true)
    const nextNum = days.length + 1
    const date = getDateForDay(startDate, nextNum)
    const { data, error } = await supabase
      .from('trip_days')
      .insert({ ...refField, day_number: nextNum, date: date || null, title: `Day ${nextNum}` })
      .select()
      .single()
    if (!error && data) {
      const newDay: TripDay = { ...data, trip_activities: [] }
      setDays(prev => [...prev, newDay])
      setExpandedDays(prev => new Set([...prev, data.id]))
    }
    setSaving(false)
  }

  const deleteDay = async (dayId: string) => {
    if (!confirm('Delete this day and all its activities?')) return
    setSaving(true)
    await supabase.from('trip_days').delete().eq('id', dayId)
    setDays(prev => prev.filter(d => d.id !== dayId))
    setSaving(false)
  }

  const updateDayField = async (dayId: string, field: 'title' | 'notes', value: string) => {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, [field]: value } : d))
    await supabase.from('trip_days').update({ [field]: value }).eq('id', dayId)
  }

  const addActivity = async (dayId: string) => {
    setSaving(true)
    const day = days.find(d => d.id === dayId)
    const sortOrder = (day?.trip_activities.length ?? 0)
    const { data, error } = await supabase
      .from('trip_activities')
      .insert({ day_id: dayId, sort_order: sortOrder, category: 'activity', title: 'New activity', currency: selectedCurrency })
      .select()
      .single()
    if (!error && data) {
      setDays(prev => prev.map(d =>
        d.id === dayId
          ? { ...d, trip_activities: [...d.trip_activities, data] }
          : d
      ))
    }
    setSaving(false)
  }

  const updateActivity = async (
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
    await supabase.from('trip_activities').update({ [field]: value }).eq('id', activityId)
  }

  const deleteActivity = async (dayId: string, activityId: string) => {
    await supabase.from('trip_activities').delete().eq('id', activityId)
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, trip_activities: d.trip_activities.filter(a => a.id !== activityId) }
        : d
    ))
  }

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(dayId)) next.delete(dayId)
      else next.add(dayId)
      return next
    })
  }

  const totalConverted = days
    .flatMap(d => d.trip_activities)
    .reduce((sum, a) => {
      if (!a.cost) return sum
      return sum + convertAmount(a.cost, a.currency || selectedCurrency, selectedCurrency, rates)
    }, 0)

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const dateLabel = day.date ? formatDate(day.date) : `Day ${day.day_number}`
        const isExpanded = expandedDays.has(day.id)
        const dayConverted = day.trip_activities.reduce((sum, a) => {
          if (!a.cost) return sum
          return sum + convertAmount(a.cost, a.currency || selectedCurrency, selectedCurrency, rates)
        }, 0)

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
                  value={day.title ?? `Day ${day.day_number}`}
                  onChange={e => { e.stopPropagation(); updateDayField(day.id, 'title', e.target.value) }}
                  onClick={e => e.stopPropagation()}
                  className="font-bold text-heading bg-transparent border-none outline-none w-full text-sm sm:text-base"
                  placeholder={`Day ${day.day_number}`}
                />
                <p className="text-xs text-hint">
                  {dateLabel} · {day.trip_activities.length} activities
                  {dayConverted > 0 && (
                    <span className="text-brand font-medium ml-1">
                      · {formatCurrency(dayConverted, selectedCurrency)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); deleteDay(day.id) }}
                  className="p-1.5 text-hint hover:text-red-500 transition-colors rounded-lg hover:bg-danger-light"
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
                  placeholder="Add notes for this day..."
                  rows={2}
                  className="w-full text-sm text-body placeholder-hint bg-surface-sunken rounded-xl px-3 py-2 resize-none border border-edge focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                              <input
                                value={act.time_label ?? ''}
                                onChange={e => updateActivity(day.id, act.id, 'time_label', e.target.value)}
                                placeholder="Time"
                                className="w-20 text-xs text-subtle bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                              <input
                                value={act.title}
                                onChange={e => updateActivity(day.id, act.id, 'title', e.target.value)}
                                onFocus={e => {
                                  if (e.target.value === 'New activity') {
                                    updateActivity(day.id, act.id, 'title', '')
                                  }
                                }}
                                placeholder="Activity title"
                                className="flex-1 text-sm font-medium text-heading bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-0"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <MapPin size={11} className="text-hint shrink-0" />
                                <input
                                  value={act.location ?? ''}
                                  onChange={e => updateActivity(day.id, act.id, 'location', e.target.value)}
                                  placeholder="Location (optional)"
                                  className="flex-1 text-xs text-subtle bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-0"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <select
                                  value={act.currency || selectedCurrency}
                                  onChange={e => updateActivity(day.id, act.id, 'currency', e.target.value)}
                                  className="text-xs text-subtle bg-surface border border-edge rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[70px]"
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
                                  className="w-20 text-xs text-subtle bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                            </div>
                            <input
                              value={act.notes ?? ''}
                              onChange={e => updateActivity(day.id, act.id, 'notes', e.target.value)}
                              placeholder="Notes (optional)"
                              className="w-full text-xs text-subtle bg-surface border border-edge rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </div>
                          <button
                            onClick={() => deleteActivity(day.id, act.id)}
                            className="mt-2 p-1.5 text-hint hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
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
                  <Plus size={14} /> Add Activity
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
        <Plus size={16} /> Add Day {days.length + 1}
      </button>

      {totalConverted > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-body">Estimated Total Budget</span>
          <span className="text-xl font-bold text-brand">
            {formatCurrency(totalConverted, selectedCurrency)}
          </span>
        </div>
      )}
    </div>
  )
}
