'use client'

import { useState, useRef } from 'react'
import { LANGUAGES, LANGUAGE_LEVELS, getLanguageByCode, getLevelInfo, type LanguageSkill } from '@/data/languages'

interface Props {
  value: LanguageSkill[]
  onChange: (skills: LanguageSkill[]) => void
  maxItems?: number
}

export default function LanguageSkillPicker({ value, onChange, maxItems = 10 }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedCodes = value.map(s => s.lang)

  const filtered = LANGUAGES.filter(l =>
    !selectedCodes.includes(l.code) &&
    (search.length === 0 ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 25)

  const addLanguage = (code: string) => {
    if (selectedCodes.includes(code) || value.length >= maxItems) return
    onChange([...value, { lang: code, level: 'intermediate' }])
    setSearch('')
    setOpen(false)
  }

  const removeLanguage = (code: string) => {
    onChange(value.filter(s => s.lang !== code))
  }

  const changeLevel = (code: string, level: string) => {
    onChange(value.map(s => s.lang === code ? { ...s, level } : s))
  }

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => setOpen(false), 150)
  }

  const handleDropdownMouseDown = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
  }

  return (
    <div className="space-y-3">
      {/* 선택된 언어 목록 */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map(skill => {
            const lang = getLanguageByCode(skill.lang)
            const level = getLevelInfo(skill.level)
            return (
              <div
                key={skill.lang}
                className="flex items-center gap-2 p-3 bg-surface border border-edge rounded-xl"
              >
                <span className="text-base">{lang?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-heading">{lang?.name}</span>
                  <span className="text-xs text-hint ml-1">({lang?.nativeName})</span>
                </div>

                {/* 레벨 선택 */}
                <div className="flex gap-1 shrink-0">
                  {LANGUAGE_LEVELS.map(lvl => (
                    <button
                      key={lvl.code}
                      type="button"
                      onClick={() => changeLevel(skill.lang, lvl.code)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                        skill.level === lvl.code
                          ? `${lvl.color} text-white`
                          : 'bg-surface-sunken text-subtle hover:bg-gray-200'
                      }`}
                      title={lvl.label}
                    >
                      {lvl.labelKo}
                    </button>
                  ))}
                </div>

                {/* 삭제 */}
                <button
                  type="button"
                  onClick={() => removeLanguage(skill.lang)}
                  className="w-6 h-6 flex items-center justify-center rounded-full text-hint hover:text-red-500 hover:bg-danger-light transition-colors shrink-0"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 언어 추가 */}
      {value.length < maxItems && (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            placeholder="🔍 언어 검색 (예: Korean, English, 한국어...)"
            className="w-full h-10 rounded-xl border border-edge px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />

          {open && filtered.length > 0 && (
            <div
              className="absolute z-20 top-12 left-0 right-0 bg-surface border border-edge rounded-xl shadow-lg overflow-y-auto max-h-72"
              onMouseDown={handleDropdownMouseDown}
            >
              {filtered.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => addLanguage(lang.code)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-light transition-colors text-left"
                >
                  <span className="text-lg">{lang.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-heading">{lang.name}</div>
                    <div className="text-xs text-hint">{lang.nativeName}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {open && search.length > 0 && filtered.length === 0 && (
            <div
              className="absolute z-20 top-12 left-0 right-0 bg-surface border border-edge rounded-xl shadow-lg"
              onMouseDown={handleDropdownMouseDown}
            >
              <div className="px-4 py-3 text-sm text-hint text-center">검색 결과 없음</div>
            </div>
          )}
        </div>
      )}

      {/* 레벨 범례 */}
      <div className="flex flex-wrap gap-2 pt-1">
        {LANGUAGE_LEVELS.map(lvl => (
          <span key={lvl.code} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${lvl.bgColor} ${lvl.textColor}`}>
            {'★'.repeat(lvl.stars)} {lvl.label} ({lvl.labelKo})
          </span>
        ))}
      </div>
    </div>
  )
}
