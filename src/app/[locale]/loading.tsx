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
      <div className="flex-1 bg-surface-sunken" />
    </div>
  )
}
