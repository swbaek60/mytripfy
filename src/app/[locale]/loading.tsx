/**
 * 로딩 시에도 페이지와 동일한 루트 구조(div > header)를 유지해
 * hydration mismatch를 방지합니다.
 */
export default function LocaleLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="w-full bg-surface border-b border-edge sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-3">
            <div className="h-9 w-24 bg-surface-sunken rounded animate-pulse" />
            <div className="flex-1" />
            <div className="h-9 w-32 bg-surface-sunken rounded animate-pulse" />
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center bg-surface-sunken">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-subtle">Loading...</p>
        </div>
      </div>
    </div>
  )
}
