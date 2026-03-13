'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { PERSONALITY_TYPES } from '@/data/personalityTypes'

const QUESTIONS = [
  {
    id: 'pace',
    question: 'What\'s your ideal travel pace?',
    emoji: '⏱️',
    options: [
      { value: 'slow', label: '🐌 Slow & deep — I want to really know one place' },
      { value: 'moderate', label: '🚶 Moderate — balance of exploring and relaxing' },
      { value: 'fast', label: '🏃 Fast — I want to see as much as possible!' },
    ],
  },
  {
    id: 'accommodation',
    question: 'Where do you prefer to stay?',
    emoji: '🏨',
    options: [
      { value: 'budget', label: '🏕️ Hostel/Camping — meet people & save money' },
      { value: 'mid', label: '🏩 Mid-range hotel — comfort without breaking the bank' },
      { value: 'luxury', label: '🏰 Luxury — I deserve the best!' },
    ],
  },
  {
    id: 'food',
    question: 'How adventurous are you with food?',
    emoji: '🍜',
    options: [
      { value: 'adventurous', label: '🦑 I\'ll try ANYTHING — street food, bugs, everything!' },
      { value: 'moderate', label: '🍛 I enjoy local food but have some limits' },
      { value: 'safe', label: '🍔 I prefer familiar foods — no surprises please' },
    ],
  },
  {
    id: 'planning',
    question: 'How do you plan your trips?',
    emoji: '📋',
    options: [
      { value: 'spontaneous', label: '🎲 Spontaneous — I decide on the go!' },
      { value: 'flexible', label: '📝 Light plan — rough idea, flexible execution' },
      { value: 'detailed', label: '📊 Detailed — every hour is planned in advance' },
    ],
  },
  {
    id: 'social',
    question: 'What\'s your social style while traveling?',
    emoji: '👥',
    options: [
      { value: 'social', label: '🥳 Super social — I want to meet everyone!' },
      { value: 'balanced', label: '😊 Balanced — social when I feel like it' },
      { value: 'solo', label: '🧘 Prefer alone time — travel for inner peace' },
    ],
  },
  {
    id: 'budget',
    question: 'What\'s your travel budget style?',
    emoji: '💰',
    options: [
      { value: 'backpacker', label: '🎒 Backpacker — under $30/day if possible!' },
      { value: 'mid', label: '💳 Mid-range — $50-150/day, comfort matters' },
      { value: 'splurge', label: '💎 No limit — experiences over money' },
    ],
  },
  {
    id: 'interest',
    question: 'What excites you most while traveling?',
    emoji: '🎯',
    options: [
      { value: 'nature', label: '🏔️ Nature & Adventure — mountains, oceans, forests' },
      { value: 'culture', label: '🏛️ Culture & History — museums, temples, local life' },
      { value: 'food_nightlife', label: '🎉 Food & Nightlife — restaurants, bars, festivals' },
    ],
  },
  {
    id: 'companion',
    question: 'What do you value most in a travel companion?',
    emoji: '🤝',
    options: [
      { value: 'flexible', label: '🌊 Flexible & easy-going — go with the flow' },
      { value: 'reliable', label: '⏰ Reliable & punctual — respects the plan' },
      { value: 'fun', label: '😂 Fun & adventurous — always up for anything' },
    ],
  },
]

function calculatePersonality(answers: Record<string, string>): string {
  const { pace, accommodation, food, planning, social, budget, interest, companion } = answers
  if (budget === 'backpacker' && pace === 'fast' && planning === 'spontaneous') return 'backpacker'
  if (interest === 'nature' && pace !== 'slow') return 'adventurer'
  if (interest === 'culture' || (pace === 'slow' && planning === 'detailed')) return 'culture_seeker'
  if (social === 'social' && companion === 'fun') return 'social_nomad'
  if (accommodation === 'luxury' || budget === 'splurge') return 'luxury_traveler'
  if (food === 'adventurous' || interest === 'food_nightlife') return 'foodie_explorer'
  return 'social_nomad'
}

export default function PersonalityTest({ userId, locale }: { userId: string; locale: string }) {
  const router = useRouter()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQ].id]: value }
    setAnswers(newAnswers)
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(prev => prev + 1), 300)
    } else {
      const personality = calculatePersonality(newAnswers)
      setResult(personality)
      saveResult(personality, newAnswers)
    }
  }

  const saveResult = async (personality: string, ans: Record<string, string>) => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('travel_personalities').upsert({
      id: userId,
      personality_type: personality,
      personality_desc: PERSONALITY_TYPES[personality]?.desc,
      scores: ans,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
  }

  const progress = ((currentQ) / QUESTIONS.length) * 100

  if (result) {
    const p = PERSONALITY_TYPES[result]
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="text-7xl mb-4">{p.emoji}</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">You are...</h2>
          <h3 className="text-3xl font-extrabold mb-4" style={{ color: p.color }}>{p.type}</h3>
          <p className="text-gray-600 leading-relaxed text-lg mb-6">{p.desc}</p>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
            <p className="font-semibold text-gray-700 text-sm mb-3">Your travel DNA:</p>
            {Object.entries(answers).map(([key, val]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-500 capitalize">{key}:</span>
                <span className="font-medium text-gray-700 capitalize">{val}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push(`/${locale}/companions`)}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-full py-5"
            >
              ✈️ Find Matching Companions
            </Button>
            <Button
              variant="outline"
              onClick={() => { setCurrentQ(0); setAnswers({}); setResult(null) }}
              className="w-full rounded-full"
            >
              🔄 Retake Test
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const q = QUESTIONS[currentQ]

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="text-5xl mb-4 text-center">{q.emoji}</div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">{q.question}</h2>
        <div className="space-y-3">
          {q.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {currentQ > 0 && (
        <button
          onClick={() => setCurrentQ(prev => prev - 1)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Previous question
        </button>
      )}
    </div>
  )
}
