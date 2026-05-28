'use client'

import { useCallback, useState } from 'react'

type ElementTag = 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'div'

interface Props {
  text: string
  locale: string
  className?: string
  as?: ElementTag
  /** 번역 버튼 숨김 (목록 카드 등 공간이 좁을 때) */
  hideButton?: boolean
}

const LABELS: Record<string, { show: string; original: string; loading: string }> = {
  ko: { show: '번역 보기', original: '원문 보기', loading: '번역 중…' },
  ja: { show: '翻訳を表示', original: '原文を表示', loading: '翻訳中…' },
  zh: { show: '查看翻译', original: '查看原文', loading: '翻译中…' },
  'zh-TW': { show: '查看翻譯', original: '查看原文', loading: '翻譯中…' },
}

function getLabels(locale: string) {
  return LABELS[locale] ?? { show: 'Show translation', original: 'Show original', loading: 'Translating…' }
}

function cacheKey(text: string, locale: string) {
  return `ugc-tr:${locale}:${text.slice(0, 80)}:${text.length}`
}

export default function TranslatedText({
  text,
  locale,
  className = '',
  as: Tag = 'p',
  hideButton = false,
}: Props) {
  const [mode, setMode] = useState<'original' | 'translated'>('original')
  const [translated, setTranslated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const labels = getLabels(locale)
  const showTranslateButton = locale !== 'en' && !hideButton && text?.trim()

  const fetchTranslation = useCallback(async () => {
    if (!text?.trim()) return

    const key = cacheKey(text, locale)
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      if (stored) {
        setTranslated(stored)
        setMode('translated')
        return
      }
    } catch {
      /* ignore */
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: locale }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Translation failed')

      setTranslated(data.translatedText)
      setMode('translated')
      try {
        localStorage.setItem(key, data.translatedText)
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Translation failed')
    } finally {
      setLoading(false)
    }
  }, [text, locale])

  const displayText = mode === 'translated' && translated ? translated : text

  if (!text?.trim()) return null

  return (
    <div className="min-w-0">
      <Tag className={className}>{displayText}</Tag>
      {showTranslateButton && (
        <div className="mt-1">
          {mode === 'original' ? (
            <button
              type="button"
              onClick={fetchTranslation}
              disabled={loading}
              className="text-xs text-brand hover:text-brand-hover font-medium disabled:opacity-50"
            >
              {loading ? labels.loading : `🌐 ${labels.show}`}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('original')}
              className="text-xs text-hint hover:text-body font-medium"
            >
              {labels.original}
            </button>
          )}
          {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
        </div>
      )}
    </div>
  )
}
