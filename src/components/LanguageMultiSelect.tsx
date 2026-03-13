'use client'

import { useState, useRef } from 'react'
import { LANGUAGES, getLanguageByCode } from '@/data/languages'

interface Props {
  value: string[]
  onChange: (codes: string[]) => void
  maxItems?: number
  placeholder?: string
}

export default function LanguageMultiSelect({
  value,
  onChange,
  maxItems = 8,
  placeholder = '🔍 언어 검색 (예: English, 한국어...)',
}: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtered = LANGUAGES.filter(l =>
    !value.includes(l.code) &&
    (search.length === 0 ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 25)

  const add = (code: string) => {
    if (value.includes(code) || value.length >= maxItems) return
    onChange([...value, code])
    setSearch('')
    setOpen(false)
  }

  const remove = (code: string) => {
    onChange(value.filter(c => c !== code))
  }

  // blur 시 드롭다운 아이템 클릭이 먼저 처리되도록 약간 지연 후 닫기
  const handleBlur = () => {
    blurTimer.current = setTimeout(() => setOpen(false), 150)
  }

  // 드롭다운 아이템 mousedown 시 blur 타이머 취소
  const handleDropdownMouseDown = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
  }

  return (
    <div className="space-y-3">
      {/* 선택된 언어 칩 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(code => {
            const lang = getLanguageByCode(code)
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-full text-sm font-medium"
              >
                {lang?.emoji} {lang?.name}
                <button
                  type="button"
                  onClick={() => remove(code)}
                  className="hover:text-amber-200 ml-0.5 font-bold leading-none"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* 언어 검색 */}
      {value.length < maxItems && (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="w-full h-10 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />

          {open && filtered.length > 0 && (
            <div
              className="absolute z-20 top-12 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto max-h-72"
              onMouseDown={handleDropdownMouseDown}
            >
              {filtered.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => add(lang.code)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-colors text-left"
                >
                  <span className="text-lg">{lang.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                    <div className="text-xs text-gray-400">{lang.nativeName}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {open && search.length > 0 && filtered.length === 0 && (
            <div
              className="absolute z-20 top-12 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg"
              onMouseDown={handleDropdownMouseDown}
            >
              <div className="px-4 py-3 text-sm text-gray-400 text-center">검색 결과 없음</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
