'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, MessageCircle, Mail, Send, ExternalLink } from 'lucide-react'

type ContactMethod = {
  id: string
  icon: React.ReactNode
  label: string
  desc: string
  color: string
  lightBg: string
  textColor: string
  available: boolean
  loginRequired?: boolean
  href?: string
  action?: () => void
  external?: boolean
}

interface Props {
  locale: string
  guideId: string
  guideName: string
  guideEmail?: string | null
  whatsapp?: string | null
  telegram?: string | null
  lineId?: string | null
  instagram?: string | null
  facebook?: string | null
  twitter?: string | null
  isLoggedIn: boolean
}

export default function GuideContactModal({
  locale, guideId, guideName,
  whatsapp, telegram, lineId,
  instagram, facebook, twitter,
  isLoggedIn,
}: Props) {
  const [open, setOpen] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSendEmail = async () => {
    if (!emailMsg.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/email/contact-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId, message: emailMsg }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.error === 'Guide email not found'
          ? 'Unable to send: guide email is not set.'
          : data?.error === 'Email delivery failed'
            ? (data?.reason ? `Email failed: ${data.reason}` : data?.code === 'SES_SANDBOX_RECIPIENT'
              ? 'Email could not be sent right now. Please try the in-app chat above instead.'
              : 'Email could not be sent. Please try again later.')
            : data?.error || 'Something went wrong.'
        alert(msg)
        return
      }
      setSent(true)
      setTimeout(() => { setSent(false); setShowEmail(false); setEmailMsg('') }, 3000)
    } finally {
      setSending(false)
    }
  }

  // 사용 가능한 연락 수단 목록
  const methods: (ContactMethod | false)[] = [
    {
      id: 'chat',
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'Chat on mytripfy',
      desc: 'Real-time messaging inside the app',
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50 border-blue-100',
      textColor: 'text-blue-700',
      available: isLoggedIn,
      loginRequired: !isLoggedIn,
      href: isLoggedIn ? `/${locale}/messages/${guideId}` : `/${locale}/login`,
    },
    {
      id: 'email',
      icon: <Mail className="w-5 h-5" />,
      label: 'Send a Message',
      desc: 'Send an inquiry to the guide via email',
      color: 'bg-violet-500',
      lightBg: 'bg-violet-50 border-violet-100',
      textColor: 'text-violet-700',
      available: isLoggedIn,
      loginRequired: !isLoggedIn,
      action: () => setShowEmail(true),
    },
    whatsapp && {
      id: 'whatsapp',
      icon: <span className="text-xl leading-none">💬</span>,
      label: 'WhatsApp',
      desc: whatsapp,
      color: 'bg-green-500',
      lightBg: 'bg-green-50 border-green-100',
      textColor: 'text-green-700',
      available: true,
      href: `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`,
      external: true,
    },
    telegram && {
      id: 'telegram',
      icon: <span className="text-xl leading-none">✈️</span>,
      label: 'Telegram',
      desc: telegram,
      color: 'bg-sky-500',
      lightBg: 'bg-sky-50 border-sky-100',
      textColor: 'text-sky-700',
      available: true,
      href: `https://t.me/${telegram.replace('@', '')}`,
      external: true,
    },
    lineId && {
      id: 'line',
      icon: <span className="text-xl leading-none">🟢</span>,
      label: 'LINE',
      desc: `ID: ${lineId}`,
      color: 'bg-lime-500',
      lightBg: 'bg-lime-50 border-lime-100',
      textColor: 'text-lime-700',
      available: true,
      href: `https://line.me/ti/p/~${lineId}`,
      external: true,
    },
    instagram && {
      id: 'instagram',
      icon: <span className="text-xl leading-none">📸</span>,
      label: 'Instagram',
      desc: instagram.replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@'),
      color: 'bg-pink-500',
      lightBg: 'bg-pink-50 border-pink-100',
      textColor: 'text-pink-700',
      available: true,
      href: instagram,
      external: true,
    },
    facebook && {
      id: 'facebook',
      icon: <span className="text-xl leading-none">👤</span>,
      label: 'Facebook',
      desc: 'Open Facebook profile',
      color: 'bg-blue-600',
      lightBg: 'bg-blue-50 border-blue-100',
      textColor: 'text-blue-700',
      available: true,
      href: facebook,
      external: true,
    },
    twitter && {
      id: 'twitter',
      icon: <span className="text-xl leading-none">🐦</span>,
      label: 'X (Twitter)',
      desc: twitter.replace('https://x.com/', '@').replace('https://twitter.com/', '@'),
      color: 'bg-gray-800',
      lightBg: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-800',
      available: true,
      href: twitter,
      external: true,
    },
  ].filter(Boolean) as NonNullable<typeof methods[number]>[]

  const methodsList = methods.filter((m): m is ContactMethod => Boolean(m))
  const availableCount = methodsList.filter(m => m.available !== false).length

  return (
    <>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl py-4 text-base font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-5 h-5" />
        Contact This Guide
        <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">
          {availableCount} ways
        </span>
      </button>

      {/* 모달 */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* 배경 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setOpen(false); setShowEmail(false) }}
          />

          {/* 패널 */}
          <div className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

            {/* 헤더 */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Contact Guide</h2>
                <p className="text-sm text-gray-400 mt-0.5">{guideName}</p>
              </div>
              <button
                onClick={() => { setOpen(false); setShowEmail(false) }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 이메일 작성 화면 */}
            {showEmail ? (
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowEmail(false)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
                  <span className="text-sm font-semibold text-gray-700">Send Message to {guideName}</span>
                </div>
                {sent ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="font-bold text-green-700">Message sent!</p>
                    <p className="text-sm text-gray-400 mt-1">The guide will reply soon.</p>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={emailMsg}
                      onChange={e => setEmailMsg(e.target.value)}
                      placeholder={`Hi ${guideName}, I'm interested in hiring you as a guide for my trip to...`}
                      rows={5}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                      autoFocus
                    />
                    <button
                      onClick={handleSendEmail}
                      disabled={sending || !emailMsg.trim()}
                      className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* 연락 수단 목록 */
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {methodsList.map(method => {
                  const content = (
                    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${method.lightBg} hover:shadow-sm transition-all cursor-pointer group`}>
                      <div className={`w-11 h-11 ${method.color} rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm`}>
                        {method.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${method.textColor}`}>{method.label}</p>
                        {method.desc && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{method.desc}</p>
                        )}
                        {method.loginRequired && (
                          <p className="text-xs text-orange-500 mt-0.5">Login required</p>
                        )}
                      </div>
                      <ExternalLink className={`w-4 h-4 ${method.textColor} opacity-40 group-hover:opacity-100 shrink-0`} />
                    </div>
                  )

                  if (method.action) {
                    return (
                      <button key={method.id} onClick={method.action} className="w-full text-left">
                        {content}
                      </button>
                    )
                  }
                  if (method.href && method.external) {
                    return (
                      <a key={method.id} href={method.href} target="_blank" rel="noopener noreferrer">
                        {content}
                      </a>
                    )
                  }
                  return (
                    <Link key={method.id} href={method.href!} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* 안전 안내 */}
            {!showEmail && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
                <p className="text-[11px] text-gray-400 text-center">
                  🔒 For your safety, keep initial communications on mytripfy chat.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
