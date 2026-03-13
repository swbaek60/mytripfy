import Header from '@/components/Header'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getDisputeLabels } from '@/data/dispute-labels'
import { getTranslations } from 'next-intl/server'

export default async function ChallengeGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const L = getDisputeLabels(locale)
  const t = await getTranslations({ locale, namespace: 'ChallengeGuide' })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} locale={locale} currentPath="/challenges" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ── 히어로 ─────────────────────────────────────── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            🚩 {L.systemName}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            {L.guide.heroTitle.includes('\n')
              ? L.guide.heroTitle.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)
              : L.guide.heroTitle}
          </h1>
          <p className="mt-4 text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
            {L.guide.heroSub}
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link href={`/${locale}/challenges/feed`}>
              <button className="bg-purple-600 text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-purple-700 transition-colors">
                커뮤니티 피드 보러가기 →
              </button>
            </Link>
            <Link href={`/${locale}/challenges`}>
              <button className="bg-white border border-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-gray-50 transition-colors">
                챌린지 허브
              </button>
            </Link>
          </div>
        </div>

        {/* ── 전체 흐름 4단계 ────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{L.guide.howItWorksTitle}</h2>
          <div className="relative">
            {/* 연결선 */}
            <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-200 to-red-200 hidden sm:block" />
            <div className="space-y-4">
              {[
                {
                  step: '01',
                  icon: '🔍',
                  color: 'bg-purple-50 border-purple-200',
                  badge: 'text-purple-600 bg-purple-100',
                  title: '수상한 인증 발견',
                  desc: '커뮤니티 피드에서 다른 사용자의 인증 사진을 봅니다. 엉뚱한 장소, 인터넷에서 가져온 사진, 완전히 다른 장소의 사진이라고 판단되면 딴지걸기 버튼을 누릅니다.',
                },
                {
                  step: '02',
                  icon: '🚩',
                  color: 'bg-amber-50 border-amber-200',
                  badge: 'text-amber-600 bg-amber-100',
                  title: '딴지걸기 & 포인트 예치',
                  desc: '딴지를 걸 때 포인트 5pt를 예치합니다. 이 비용은 허위 신고 남용을 방지합니다. 이유를 구체적으로 작성해야 하며, 최소 10자 이상이어야 합니다. 같은 인증에 3명 이상 신고하면 배심원 소집 단계로 넘어갑니다.',
                },
                {
                  step: '03',
                  icon: '⚖️',
                  color: 'bg-blue-50 border-blue-200',
                  badge: 'text-blue-600 bg-blue-100',
                  title: '배심원단 구성 & 투표 (72시간)',
                  desc: '해당 카테고리에서 5개 이상 인증을 완료한 활성 사용자 중 무작위로 배심원이 선발됩니다. 배심원은 인증 사진과 신고 이유를 보고 72시간 내에 ✅ 유효 또는 ❌ 무효를 투표합니다.',
                },
                {
                  step: '04',
                  icon: '🏛️',
                  color: 'bg-green-50 border-green-200',
                  badge: 'text-green-600 bg-green-100',
                  title: '자동 판결 & 포인트 정산',
                  desc: '배심원 3명 이상이 무효 판정 시 인증이 취소되고 포인트가 차감됩니다. 3명 이상이 유효 판정 시 딴지가 기각되고 허위 신고자들이 예치 포인트를 잃습니다.',
                },
              ].map((item, i) => (
                <div key={i} className={`relative flex gap-4 sm:gap-6 p-5 rounded-2xl border-2 ${item.color}`}>
                  <div className="flex-shrink-0 w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-2xl">{item.icon}</span>
                    <span className={`text-[10px] font-black mt-0.5 px-1 rounded ${item.badge}`}>{item.step}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 포인트 정산 표 ─────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">{L.guide.pointTableTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-4">

            {/* 시나리오 A: 딴지 성공 */}
            <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden">
              <div className="bg-red-500 text-white px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">시나리오 A</p>
                <p className="text-lg font-extrabold">❌ 허위 인증 적발</p>
                <p className="text-sm opacity-80">배심원 3명 이상이 무효 판정</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { who: '🚨 인증자', change: '−해당 챌린지 포인트 전액', color: 'text-red-600', bg: 'bg-red-50' },
                  { who: '🚩 신고자', change: '+5pt 예치금 환급 + 3pt 보너스', color: 'text-green-600', bg: 'bg-green-50' },
                  { who: '⚖️ 배심원', change: '+2pt 참여 보상', color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center px-3 py-2.5 rounded-xl ${row.bg}`}>
                    <span className="text-sm font-semibold text-gray-700">{row.who}</span>
                    <span className={`text-sm font-bold ${row.color}`}>{row.change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 시나리오 B: 딴지 실패 */}
            <div className="bg-white rounded-2xl border-2 border-green-200 overflow-hidden">
              <div className="bg-green-500 text-white px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">시나리오 B</p>
                <p className="text-lg font-extrabold">✅ 정당한 인증 확인</p>
                <p className="text-sm opacity-80">배심원 3명 이상이 유효 판정</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { who: '✅ 인증자', change: '+5pt 보상 (허위신고 피해 보상)', color: 'text-green-600', bg: 'bg-green-50' },
                  { who: '🚩 신고자', change: '−5pt 예치금 몰수', color: 'text-red-600', bg: 'bg-red-50' },
                  { who: '⚖️ 배심원', change: '+2pt 참여 보상', color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center px-3 py-2.5 rounded-xl ${row.bg}`}>
                    <span className="text-sm font-semibold text-gray-700">{row.who}</span>
                    <span className={`text-sm font-bold ${row.color}`}>{row.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 반복 위반 ─────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">{L.guide.repeatPenaltyTitle}</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-bold text-gray-700">위반 횟수</th>
                  <th className="text-left px-5 py-3 font-bold text-gray-700">추가 패널티</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { count: '1회', penalty: '해당 챌린지 포인트만 차감', severity: 'text-amber-600' },
                  { count: '2회', penalty: '포인트 차감 + ⚠️ 프로필 경고 뱃지 30일', severity: 'text-orange-600' },
                  { count: '3회', penalty: '해당 카테고리 인증 권한 30일 정지', severity: 'text-red-600' },
                  { count: '4회+', penalty: '전체 인증 일시 정지 + 관리자 검토', severity: 'text-red-700 font-bold' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{row.count}</td>
                    <td className={`px-5 py-3.5 ${row.severity}`}>{row.penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 자격 조건 ─────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">{L.guide.eligibilityTitle}</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: '🏅', title: '인증 3개 이상', desc: '본인이 최소 3개 챌린지를 인증한 사용자만 신고할 수 있습니다.' },
              { icon: '⏰', title: '인증 30일 이내', desc: '인증 후 30일이 지난 인증은 딴지 대상이 되지 않습니다.' },
              { icon: '🔁', title: '중복 신고 금지', desc: '같은 인증에 한 사람이 두 번 신고할 수 없습니다.' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">{L.guide.faqTitle}</h2>
          <div className="space-y-3">
            {[
              {
                q: '딴지를 걸었는데 3명이 안 모이면 어떻게 되나요?',
                a: '30일 이내에 3명이 모이지 않으면 딴지가 자동으로 기각되고, 예치 포인트는 환급됩니다.',
              },
              {
                q: '배심원으로 선발되면 반드시 투표해야 하나요?',
                a: '투표는 72시간 이내에 자유롭게 할 수 있습니다. 투표하면 +2pt 보상을 받습니다. 투표하지 않으면 패널티는 없지만 보상도 없습니다.',
              },
              {
                q: '내 인증에 딴지가 걸렸을 때 어떻게 해야 하나요?',
                a: '알림이 전송되며, 48시간 내에 추가 사진이나 근거를 제출할 수 있습니다. (현재 개발 중) 배심원이 판단 시 참고합니다.',
              },
              {
                q: '허위로 딴지를 남발하면 어떻게 되나요?',
                a: '허위 신고가 반복되면 신고 권한이 제한됩니다. 또한 딴지가 기각될 때마다 예치 포인트 5pt를 잃습니다.',
              },
              {
                q: '배심원은 어떻게 선발되나요?',
                a: '같은 카테고리에서 5개 이상 인증한 활성 사용자 중 무작위로 선발됩니다. 신고자나 인증자의 팔로워는 제외됩니다.',
              },
            ].map((item, i) => (
              <details key={i} className="bg-white border border-gray-100 rounded-2xl group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none">
                  <span className="font-semibold text-gray-900 text-sm pr-4">{item.q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0">▾</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <h2 className="text-2xl font-extrabold mb-2">{L.guide.ctaTitle}</h2>
          <p className="text-purple-200 mb-6 text-sm leading-relaxed">
            {L.guide.ctaSub}
          </p>
          <Link href={`/${locale}/challenges/feed`}>
            <button className="bg-white text-purple-700 font-bold px-8 py-3 rounded-full hover:bg-purple-50 transition-colors">
              {t('communityFeedCta')}
            </button>
          </Link>
        </div>

      </main>
    </div>
  )
}
